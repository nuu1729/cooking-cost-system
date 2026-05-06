from flask import Blueprint, request, g
from api.database import db
from api.models.item import Item, ItemRelation
from api.utils.response import success, error
from api.utils.auth import require_auth
from api.utils.audit import log_delete

foods_bp = Blueprint('foods', __name__)

ITEM_TYPE = 3
ALLOWED_SORT = {'name', 'price', 'created_at'}


def _escape_like(s: str) -> str:
    return s.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')


# GET /api/foods
@foods_bp.route('', methods=['GET'])
@require_auth
def list_foods():
    name = request.args.get('name')
    sort_by = request.args.get('sortBy', 'name')
    sort_order = request.args.get('sortOrder', 'ASC').upper()
    limit = min(request.args.get('limit', 20, type=int), 100)
    offset = request.args.get('offset', 0, type=int)

    if sort_by not in ALLOWED_SORT:
        sort_by = 'name'
    if sort_order not in ('ASC', 'DESC'):
        sort_order = 'ASC'

    q = Item.query.filter_by(item_type=ITEM_TYPE, user_id=g.user_id)
    if name:
        q = q.filter(Item.name.like(f'%{_escape_like(name)}%'))

    col = getattr(Item, sort_by)
    q = q.order_by(col.asc() if sort_order == 'ASC' else col.desc())
    total = q.count()
    items = q.offset(offset).limit(limit).all()
    return success([i.to_dict() for i in items], count=total)


# POST /api/foods
@foods_bp.route('', methods=['POST'])
@require_auth
def create_food():
    body = request.get_json(silent=True) or {}
    name = (body.get('name') or '').strip()
    quantity = body.get('quantity', 1)
    unit = 'g'
    genre = body.get('genre')
    description = body.get('description')
    selling_price = body.get('selling_price')
    items_list = body.get('items') or []

    if not name:
        return error('VALIDATION_ERROR', 'name は必須です')
    if float(quantity) <= 0:
        return error('VALIDATION_ERROR', 'quantity は 0 より大きい値で入力してください')
    if selling_price is not None and float(selling_price) < 0:
        return error('VALIDATION_ERROR', 'selling_price は 0 以上で入力してください')
    if not items_list:
        return error('VALIDATION_ERROR', '仕込み品を 1 件以上選択してください')

    prep_ids = [i.get('prep_id') for i in items_list]
    preps = {
        p.id: p for p in
        Item.query.filter(Item.id.in_(prep_ids), Item.item_type == 2, Item.user_id == g.user_id).all()
    }
    for prep_id in prep_ids:
        if prep_id not in preps:
            return error('VALIDATION_ERROR', f'仕込み品 ID {prep_id} が見つかりません')

    total_cost = 0.0
    relations = []
    for entry in items_list:
        prep_id = entry['prep_id']
        amount = float(entry.get('amount', 0))
        desc = entry.get('description')
        if amount <= 0:
            return error('VALIDATION_ERROR', 'amount は 0 より大きい値で入力してください')
        cost = round(float(preps[prep_id].unit_price) * amount, 2)
        total_cost += cost
        relations.append({'prep_id': prep_id, 'amount': amount, 'cost': cost, 'description': desc})

    total_cost = round(total_cost, 2)
    unit_price = round(total_cost / float(quantity), 4)

    existing = Item.query.filter_by(item_type=ITEM_TYPE, name=name, user_id=g.user_id).first()
    if existing:
        existing.quantity = quantity
        existing.unit = unit
        existing.price = total_cost
        existing.unit_price = unit_price
        if selling_price is not None:
            existing.selling_price = selling_price
        if genre is not None:
            existing.genre = genre
        if description is not None:
            existing.description = description
        ItemRelation.query.filter_by(parent_item_id=existing.id).delete()
        db.session.flush()
        for r in relations:
            db.session.add(ItemRelation(
                parent_item_id=existing.id,
                child_item_id=r['prep_id'],
                amount=r['amount'],
                cost=r['cost']
            ))
        db.session.commit()
        return success(existing.to_dict(), message='お品を更新しました')

    food = Item(
        name=name, item_type=ITEM_TYPE, store='自家製',
        price=total_cost, quantity=quantity, unit=unit,
        unit_price=unit_price, selling_price=selling_price,
        genre=genre, description=description,
        user_id=g.user_id
    )
    db.session.add(food)
    db.session.flush()

    for r in relations:
        db.session.add(ItemRelation(
            parent_item_id=food.id,
            child_item_id=r['prep_id'],
            amount=r['amount'],
            cost=r['cost']
        ))
    db.session.commit()
    return success(food.to_dict(), message='お品を登録しました', status=201)


# GET /api/foods/stats/profit
@foods_bp.route('/stats/profit', methods=['GET'])
@require_auth
def profit_stats():
    limit = min(request.args.get('limit', 10, type=int), 50)
    items = Item.query.filter_by(item_type=ITEM_TYPE).order_by(Item.unit_price.asc()).limit(limit).all()
    return success([i.to_dict() for i in items])


# GET /api/foods/<id>
@foods_bp.route('/<int:item_id>', methods=['GET'])
@require_auth
def get_food(item_id):
    food = Item.query.filter_by(id=item_id, item_type=ITEM_TYPE, user_id=g.user_id).first()
    if not food:
        return error('NOT_FOUND', 'お品が見つかりません', 404)

    rels = db.session.query(ItemRelation, Item).join(
        Item, ItemRelation.child_item_id == Item.id
    ).filter(ItemRelation.parent_item_id == item_id).order_by(ItemRelation.id).all()

    preps = [{
        'prep_id': rel.child_item_id,
        'prep_name': prep.name,
        'prep_unit': prep.unit,
        'prep_genre': prep.genre,
        'prep_unit_price': float(prep.unit_price),
        'amount': float(rel.amount),
        'cost': float(rel.cost),
        'description': None,
    } for rel, prep in rels]

    data = food.to_dict()
    data['preps'] = preps
    return success(data)


# PUT /api/foods/<id>
@foods_bp.route('/<int:item_id>', methods=['PUT'])
@require_auth
def update_food(item_id):
    food = Item.query.filter_by(id=item_id, item_type=ITEM_TYPE, user_id=g.user_id).first()
    if not food:
        return error('NOT_FOUND', 'お品が見つかりません', 404)

    body = request.get_json(silent=True) or {}
    if 'name' in body:
        food.name = (body['name'] or '').strip()
    food.unit = 'g'
    if 'genre' in body:
        food.genre = body['genre']
    if 'description' in body:
        food.description = body['description']
    if 'selling_price' in body:
        sp = body['selling_price']
        if sp is not None and float(sp) < 0:
            return error('VALIDATION_ERROR', 'selling_price は 0 以上で入力してください')
        food.selling_price = sp

    quantity = body.get('quantity')
    if quantity is not None:
        if float(quantity) <= 0:
            return error('VALIDATION_ERROR', 'quantity は 0 より大きい値で入力してください')
        food.quantity = quantity

    items_list = body.get('items')
    if items_list is not None:
        if not items_list:
            return error('VALIDATION_ERROR', '仕込み品を 1 件以上選択してください')

        prep_ids = [i.get('prep_id') for i in items_list]
        preps = {
            p.id: p for p in
            Item.query.filter(Item.id.in_(prep_ids), Item.item_type == 2, Item.user_id == g.user_id).all()
        }
        for prep_id in prep_ids:
            if prep_id not in preps:
                return error('VALIDATION_ERROR', f'仕込み品 ID {prep_id} が見つかりません')

        ItemRelation.query.filter_by(parent_item_id=item_id).delete()

        total_cost = 0.0
        for entry in items_list:
            prep_id = entry['prep_id']
            amount = float(entry.get('amount', 0))
            if amount <= 0:
                return error('VALIDATION_ERROR', 'amount は 0 より大きい値で入力してください')
            cost = round(float(preps[prep_id].unit_price) * amount, 2)
            total_cost += cost
            db.session.add(ItemRelation(
                parent_item_id=item_id,
                child_item_id=prep_id,
                amount=amount,
                cost=cost
            ))

        food.price = round(total_cost, 2)
        food.unit_price = round(float(food.price) / float(food.quantity), 4)

    db.session.commit()
    return success(food.to_dict())


# DELETE /api/foods/<id>
@foods_bp.route('/<int:item_id>', methods=['DELETE'])
@require_auth
def delete_food(item_id):
    food = Item.query.filter_by(id=item_id, item_type=ITEM_TYPE, user_id=g.user_id).first()
    if not food:
        return error('NOT_FOUND', 'お品が見つかりません', 404)

    ItemRelation.query.filter_by(parent_item_id=item_id).delete()
    db.session.delete(food)
    db.session.commit()
    log_delete(g.user_id, 'food', item_id)
    return success(message='お品を削除しました')
