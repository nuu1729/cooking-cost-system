from flask import Blueprint, request, g
from sqlalchemy import or_
from api.database import db
from api.models.item import Item, ItemRelation
from api.utils.response import success, error
from api.utils.auth import require_auth
from api.utils.audit import log_delete
from api.utils.japanese import kana_variants

preps_bp = Blueprint('preps', __name__)

ITEM_TYPE = 2
ALLOWED_SORT = {'name', 'price', 'created_at'}


def _escape_like(s: str) -> str:
    return s.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')


# GET /api/preps
@preps_bp.route('', methods=['GET'])
@require_auth
def list_preps():
    name = request.args.get('name')
    genre = request.args.get('genre')
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
        variants = kana_variants(name)
        q = q.filter(or_(*[Item.name.like(f'%{_escape_like(v)}%') for v in variants]))
    if genre:
        q = q.filter(Item.genre == genre)

    col = getattr(Item, sort_by)
    q = q.order_by(col.asc() if sort_order == 'ASC' else col.desc())
    total = q.count()
    items = q.offset(offset).limit(limit).all()
    return success([i.to_dict() for i in items], count=total)


# POST /api/preps
@preps_bp.route('', methods=['POST'])
@require_auth
def create_prep():
    body = request.get_json(silent=True) or {}
    name = (body.get('name') or '').strip()
    quantity = body.get('quantity')
    unit = 'g'
    genre = body.get('genre')
    description = body.get('description')
    items_list = body.get('items') or []

    if not name or quantity is None:
        return error('VALIDATION_ERROR', 'name・quantity は必須です')
    if float(quantity) <= 0:
        return error('VALIDATION_ERROR', 'quantity は 0 より大きい値で入力してください')
    if not items_list:
        return error('VALIDATION_ERROR', '食材を 1 件以上選択してください')

    ingredient_ids = [i.get('ingredient_id') for i in items_list]
    ingredients = {
        ing.id: ing for ing in
        Item.query.filter(Item.id.in_(ingredient_ids), Item.item_type == 1, Item.user_id == g.user_id).all()
    }
    for ing_id in ingredient_ids:
        if ing_id not in ingredients:
            return error('VALIDATION_ERROR', f'食材 ID {ing_id} が見つかりません')

    total_cost = 0.0
    relations = []
    for entry in items_list:
        ing_id = entry['ingredient_id']
        amount = float(entry.get('amount', 0))
        if amount <= 0:
            return error('VALIDATION_ERROR', 'amount は 0 より大きい値で入力してください')
        cost = round(float(ingredients[ing_id].unit_price) * amount, 2)
        total_cost += cost
        relations.append({'ingredient_id': ing_id, 'amount': amount, 'cost': cost})

    total_cost = round(total_cost, 2)
    unit_price = round(total_cost / float(quantity), 4)

    existing = Item.query.filter_by(item_type=ITEM_TYPE, name=name, user_id=g.user_id).first()
    if existing:
        existing.quantity = quantity
        existing.unit = unit
        existing.price = total_cost
        existing.unit_price = unit_price
        if genre is not None:
            existing.genre = genre
        if description is not None:
            existing.description = description
        ItemRelation.query.filter_by(parent_item_id=existing.id).delete()
        db.session.flush()
        for r in relations:
            db.session.add(ItemRelation(
                parent_item_id=existing.id,
                child_item_id=r['ingredient_id'],
                amount=r['amount'],
                cost=r['cost']
            ))
        db.session.commit()
        return success(existing.to_dict(), message='仕込みを更新しました')

    prep = Item(
        name=name, item_type=ITEM_TYPE, store='自家製',
        price=total_cost, quantity=quantity, unit=unit,
        unit_price=unit_price, genre=genre, description=description,
        user_id=g.user_id
    )
    db.session.add(prep)
    db.session.flush()

    for r in relations:
        db.session.add(ItemRelation(
            parent_item_id=prep.id,
            child_item_id=r['ingredient_id'],
            amount=r['amount'],
            cost=r['cost']
        ))
    db.session.commit()
    return success(prep.to_dict(), message='仕込みを登録しました', status=201)


# GET /api/preps/check-name
@preps_bp.route('/check-name', methods=['GET'])
@require_auth
def check_name():
    name = request.args.get('name', '').strip()
    if not name:
        return error('VALIDATION_ERROR', 'name パラメータは必須です')
    exists = Item.query.filter_by(item_type=ITEM_TYPE, name=name, user_id=g.user_id).first() is not None
    return success({'exists': exists})


# GET /api/preps/search
@preps_bp.route('/search', methods=['GET'])
@require_auth
def search_preps():
    q = request.args.get('q', '').strip()
    limit = min(request.args.get('limit', 10, type=int), 50)
    query = Item.query.filter_by(item_type=ITEM_TYPE, user_id=g.user_id)
    if q:
        variants = kana_variants(q)
        query = query.filter(or_(*[Item.name.like(f'%{_escape_like(v)}%') for v in variants]))
    items = query.order_by(Item.name).limit(limit).all()
    return success([i.to_dict() for i in items])


# GET /api/preps/<id>
@preps_bp.route('/<int:item_id>', methods=['GET'])
@require_auth
def get_prep(item_id):
    prep = Item.query.filter_by(id=item_id, item_type=ITEM_TYPE, user_id=g.user_id).first()
    if not prep:
        return error('NOT_FOUND', '仕込み品が見つかりません', 404)

    rels = db.session.query(ItemRelation, Item).join(
        Item, ItemRelation.child_item_id == Item.id
    ).filter(ItemRelation.parent_item_id == item_id).order_by(ItemRelation.id).all()

    ingredients = [{
        'ingredient_id': rel.child_item_id,
        'ingredient_name': ing.name,
        'ingredient_unit': ing.unit,
        'ingredient_genre': ing.genre,
        'ingredient_store': ing.store,
        'ingredient_price': float(ing.price),
        'ingredient_quantity': float(ing.quantity),
        'ingredient_unit_price': float(ing.unit_price),
        'amount': float(rel.amount),
        'cost': float(rel.cost),
    } for rel, ing in rels]

    data = prep.to_dict()
    data['ingredients'] = ingredients
    return success(data)


# PUT /api/preps/<id>
@preps_bp.route('/<int:item_id>', methods=['PUT'])
@require_auth
def update_prep(item_id):
    prep = Item.query.filter_by(id=item_id, item_type=ITEM_TYPE, user_id=g.user_id).first()
    if not prep:
        return error('NOT_FOUND', '仕込み品が見つかりません', 404)

    body = request.get_json(silent=True) or {}
    name = (body.get('name') or '').strip()
    quantity = body.get('quantity')
    genre = body.get('genre')
    description = body.get('description')
    items_list = body.get('items')

    if name:
        prep.name = name
    if quantity is not None:
        if float(quantity) <= 0:
            return error('VALIDATION_ERROR', 'quantity は 0 より大きい値で入力してください')
        prep.quantity = quantity
    if 'genre' in body:
        prep.genre = genre
    if 'description' in body:
        prep.description = description
    prep.unit = 'g'

    if items_list is not None:
        if not items_list:
            return error('VALIDATION_ERROR', '食材を 1 件以上選択してください')

        ingredient_ids = [i.get('ingredient_id') for i in items_list]
        ingredients = {
            ing.id: ing for ing in
            Item.query.filter(Item.id.in_(ingredient_ids), Item.item_type == 1).all()
        }
        for ing_id in ingredient_ids:
            if ing_id not in ingredients:
                return error('VALIDATION_ERROR', f'食材 ID {ing_id} が見つかりません')

        ItemRelation.query.filter_by(parent_item_id=item_id).delete()

        total_cost = 0.0
        for entry in items_list:
            ing_id = entry['ingredient_id']
            amount = float(entry.get('amount', 0))
            if amount <= 0:
                return error('VALIDATION_ERROR', 'amount は 0 より大きい値で入力してください')
            cost = round(float(ingredients[ing_id].unit_price) * amount, 2)
            total_cost += cost
            db.session.add(ItemRelation(
                parent_item_id=item_id,
                child_item_id=ing_id,
                amount=amount,
                cost=cost
            ))

        prep.price = round(total_cost, 2)
        prep.unit_price = round(float(prep.price) / float(prep.quantity), 4)

        # この仕込みを使うお品のコストを再計算
        from api.utils.cascade import _recalculate_dish
        dish_ids = [
            r[0] for r in db.session.query(ItemRelation.parent_item_id)
            .join(Item, ItemRelation.parent_item_id == Item.id)
            .filter(ItemRelation.child_item_id == item_id, Item.item_type == 3)
            .distinct().all()
        ]
        db.session.flush()
        for dish_id in dish_ids:
            _recalculate_dish(dish_id)

    db.session.commit()
    return success(prep.to_dict(), message='仕込みを更新しました')


# DELETE /api/preps/<id>
@preps_bp.route('/<int:item_id>', methods=['DELETE'])
@require_auth
def delete_prep(item_id):
    prep = Item.query.filter_by(id=item_id, item_type=ITEM_TYPE, user_id=g.user_id).first()
    if not prep:
        return error('NOT_FOUND', '仕込み品が見つかりません', 404)

    food_rel = db.session.query(ItemRelation, Item).join(
        Item, ItemRelation.parent_item_id == Item.id
    ).filter(ItemRelation.child_item_id == item_id, Item.item_type == 3).first()
    if food_rel:
        food_name = food_rel[1].name
        return error('CONFLICT', f'この仕込み品は「{food_name}」で使用中のため削除できません', 409)

    ItemRelation.query.filter_by(parent_item_id=item_id).delete()
    db.session.delete(prep)
    db.session.commit()
    log_delete(g.user_id, 'prep', item_id)
    return success(message='仕込みを削除しました')
