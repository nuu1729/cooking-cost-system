from flask import Blueprint, request, g
from sqlalchemy import func, or_
from api.database import db
from api.models.item import Item, ItemRelation
from api.models.store import Store
from api.utils.response import success, error
from api.utils.auth import require_auth
from api.utils.japanese import kana_variants

ingredients_bp = Blueprint('ingredients', __name__)

ITEM_TYPE = 1
ALLOWED_SORT = {'name', 'price', 'unit_price', 'store', 'created_at', 'updated_at'}
ALLOWED_GENRE = {'meat', 'vegetable', 'seasoning', 'sauce', 'frozen', 'drink', 'other'}


def _escape_like(s: str) -> str:
    return s.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')


# GET /api/ingredients
@ingredients_bp.route('', methods=['GET'])
@require_auth
def list_ingredients():
    name = request.args.get('name')
    store = request.args.get('store')
    genre = request.args.get('genre')
    min_price = request.args.get('minPrice', type=float)
    max_price = request.args.get('maxPrice', type=float)
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
    if store:
        q = q.filter(Item.store.like(f'%{_escape_like(store)}%'))
    if genre:
        q = q.filter(Item.genre == genre)
    if min_price is not None:
        q = q.filter(Item.price >= min_price)
    if max_price is not None:
        q = q.filter(Item.price <= max_price)

    col = getattr(Item, sort_by)
    q = q.order_by(col.asc() if sort_order == 'ASC' else col.desc())

    total = q.count()
    items = q.offset(offset).limit(limit).all()
    return success([i.to_dict() for i in items], count=total)


# POST /api/ingredients
@ingredients_bp.route('', methods=['POST'])
@require_auth
def create_ingredient():
    body = request.get_json(silent=True) or {}
    name = (body.get('name') or '').strip()
    store_id = body.get('store_id')
    price = body.get('price')
    quantity = body.get('quantity')
    unit = (body.get('unit') or '').strip()
    genre = body.get('genre')
    description = body.get('description')

    if not name or store_id is None or price is None or quantity is None or not unit:
        return error('VALIDATION_ERROR', 'name・store_id・price・quantity・unit は必須です')
    if float(price) < 0:
        return error('VALIDATION_ERROR', 'price は 0 以上で入力してください')
    if float(quantity) <= 0:
        return error('VALIDATION_ERROR', 'quantity は 0 より大きい値で入力してください')

    store = Store.query.filter_by(id=store_id, user_id=g.user_id).first()
    if not store:
        return error('VALIDATION_ERROR', f'購入先 ID {store_id} が見つかりません')

    unit_price = round(float(price) / float(quantity), 4)
    item = Item(
        name=name, item_type=ITEM_TYPE, store=store.name, store_id=store_id,
        price=price, quantity=quantity, unit=unit,
        unit_price=unit_price, genre=genre, description=description,
        user_id=g.user_id
    )
    db.session.add(item)
    db.session.commit()
    return success(item.to_dict(), status=201)


# GET /api/ingredients/search
@ingredients_bp.route('/search', methods=['GET'])
@require_auth
def search_ingredients():
    q_str = request.args.get('q', '').strip()
    if not q_str:
        return error('VALIDATION_ERROR', 'q パラメータは必須です')
    variants = kana_variants(q_str)
    items = Item.query.filter(
        Item.item_type == ITEM_TYPE,
        Item.user_id == g.user_id,
        or_(*[Item.name.like(f'%{_escape_like(v)}%') for v in variants])
    ).order_by(Item.name.asc()).limit(20).all()
    return success([i.to_dict() for i in items], count=len(items))


# GET /api/ingredients/stats/genre
@ingredients_bp.route('/stats/genre', methods=['GET'])
@require_auth
def genre_stats():
    rows = db.session.query(
        func.coalesce(Item.genre, 'other').label('genre'),
        func.count(Item.id).label('count'),
        func.round(func.avg(Item.unit_price), 4).label('avg_unit_price')
    ).filter(Item.item_type == ITEM_TYPE, Item.user_id == g.user_id).group_by(
        func.coalesce(Item.genre, 'other')
    ).order_by(func.count(Item.id).desc()).all()

    data = [{'genre': r.genre, 'count': r.count, 'avg_unit_price': float(r.avg_unit_price or 0)} for r in rows]
    return success(data)


# GET /api/ingredients/popular
@ingredients_bp.route('/popular', methods=['GET'])
@require_auth
def popular_ingredients():
    limit = min(request.args.get('limit', 10, type=int), 50)
    rows = db.session.query(
        Item,
        func.count(ItemRelation.id).label('usage_count')
    ).join(ItemRelation, Item.id == ItemRelation.child_item_id
    ).filter(Item.item_type == ITEM_TYPE, Item.user_id == g.user_id
    ).group_by(Item.id
    ).order_by(func.count(ItemRelation.id).desc()
    ).limit(limit).all()

    data = [{**item.to_dict(), 'usage_count': count} for item, count in rows]
    return success(data)


# GET /api/ingredients/<id>
@ingredients_bp.route('/<int:item_id>', methods=['GET'])
@require_auth
def get_ingredient(item_id):
    item = Item.query.filter_by(id=item_id, item_type=ITEM_TYPE, user_id=g.user_id).first()
    if not item:
        return error('NOT_FOUND', '食材が見つかりません', 404)
    return success(item.to_dict())


# PUT /api/ingredients/<id>
@ingredients_bp.route('/<int:item_id>', methods=['PUT'])
@require_auth
def update_ingredient(item_id):
    item = Item.query.filter_by(id=item_id, item_type=ITEM_TYPE, user_id=g.user_id).first()
    if not item:
        return error('NOT_FOUND', '食材が見つかりません', 404)

    body = request.get_json(silent=True) or {}
    if 'name' in body:
        v = (body['name'] or '').strip()
        if not v:
            return error('VALIDATION_ERROR', 'name は空にできません')
        item.name = v
    if 'store_id' in body:
        sid = body['store_id']
        if sid is None:
            return error('VALIDATION_ERROR', 'store_id は必須です')
        store = Store.query.filter_by(id=sid, user_id=g.user_id).first()
        if not store:
            return error('VALIDATION_ERROR', f'購入先 ID {sid} が見つかりません')
        item.store_id = sid
        item.store = store.name
    if 'unit' in body:
        item.unit = (body['unit'] or '').strip()
    if 'genre' in body:
        item.genre = body['genre']
    if 'description' in body:
        item.description = body['description']

    price = body.get('price', None)
    quantity = body.get('quantity', None)
    if price is not None:
        if float(price) < 0:
            return error('VALIDATION_ERROR', 'price は 0 以上で入力してください')
        item.price = price
    if quantity is not None:
        if float(quantity) <= 0:
            return error('VALIDATION_ERROR', 'quantity は 0 より大きい値で入力してください')
        item.quantity = quantity
    price_changed = price is not None or quantity is not None
    if price_changed:
        item.unit_price = round(float(item.price) / float(item.quantity), 4)

    if price_changed:
        db.session.flush()
        from api.utils.cascade import cascade_from_ingredient
        cascade_from_ingredient(item.id)

    db.session.commit()
    return success(item.to_dict())


# DELETE /api/ingredients/<id>
@ingredients_bp.route('/<int:item_id>', methods=['DELETE'])
@require_auth
def delete_ingredient(item_id):
    item = Item.query.filter_by(id=item_id, item_type=ITEM_TYPE, user_id=g.user_id).first()
    if not item:
        return error('NOT_FOUND', '食材が見つかりません', 404)

    rel = db.session.query(ItemRelation, Item).join(
        Item, ItemRelation.parent_item_id == Item.id
    ).filter(ItemRelation.child_item_id == item_id).first()
    if rel:
        parent_name = rel[1].name
        return error('CONFLICT', f'この食材は「{parent_name}」で使用中のため削除できません', 409)

    db.session.delete(item)
    db.session.commit()
    return success(message='食材を削除しました')
