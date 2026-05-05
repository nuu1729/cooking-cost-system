from flask import Blueprint, request, g
from api.database import db
from api.models.store import Store
from api.models.item import Item
from api.utils.response import success, error
from api.utils.auth import require_auth
from api.utils.audit import log_delete

stores_bp = Blueprint('stores', __name__)


@stores_bp.route('', methods=['GET'])
@require_auth
def list_stores():
    stores = Store.query.filter_by(user_id=g.user_id).all()
    result = []
    for s in stores:
        count = Item.query.filter_by(user_id=g.user_id, item_type=1, store_id=s.id).count()
        d = s.to_dict()
        d['ingredient_count'] = count
        result.append(d)
    result.sort(key=lambda x: x['ingredient_count'], reverse=True)
    return success(result)


@stores_bp.route('', methods=['POST'])
@require_auth
def create_store():
    body = request.get_json(silent=True) or {}
    name = (body.get('name') or '').strip()
    if not name:
        return error('VALIDATION_ERROR', '購入先名は必須です')

    existing = Store.query.filter_by(user_id=g.user_id, name=name).first()
    if existing:
        return error('CONFLICT', 'その購入先名はすでに登録されています', 409)

    store = Store(user_id=g.user_id, name=name)
    db.session.add(store)
    db.session.commit()

    d = store.to_dict()
    d['ingredient_count'] = 0
    return success(d, message='購入先を登録しました', status=201)


@stores_bp.route('/<int:store_id>', methods=['PUT'])
@require_auth
def update_store(store_id):
    store = Store.query.filter_by(id=store_id, user_id=g.user_id).first()
    if not store:
        return error('NOT_FOUND', '購入先が見つかりません', 404)

    body = request.get_json(silent=True) or {}
    name = (body.get('name') or '').strip()
    if not name:
        return error('VALIDATION_ERROR', '購入先名は必須です')

    existing = Store.query.filter_by(user_id=g.user_id, name=name).first()
    if existing and existing.id != store_id:
        return error('CONFLICT', 'その購入先名はすでに登録されています', 409)

    old_name = store.name
    store.name = name
    Item.query.filter_by(user_id=g.user_id, store=old_name).update({'store': name})
    db.session.commit()

    count = Item.query.filter_by(user_id=g.user_id, item_type=1, store_id=store.id).count()
    d = store.to_dict()
    d['ingredient_count'] = count
    return success(d, message='購入先を更新しました')


@stores_bp.route('/<int:store_id>', methods=['DELETE'])
@require_auth
def delete_store(store_id):
    store = Store.query.filter_by(id=store_id, user_id=g.user_id).first()
    if not store:
        return error('NOT_FOUND', '購入先が見つかりません', 404)

    count = Item.query.filter_by(user_id=g.user_id, item_type=1, store_id=store.id).count()
    if count > 0:
        return error('CONFLICT', f'この購入先は {count} 件の食材で使用中のため削除できません', 409)

    db.session.delete(store)
    db.session.commit()
    log_delete(g.user_id, 'store', store_id)
    return success(message='購入先を削除しました')
