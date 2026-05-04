from flask import Blueprint, request, g
from api.database import db
from api.models.genre import Genre
from api.models.item import Item
from api.utils.response import success, error
from api.utils.auth import require_auth

genres_bp = Blueprint('genres', __name__)


# GET /api/genres
@genres_bp.route('', methods=['GET'])
@require_auth
def list_genres():
    genres = Genre.query.order_by(Genre.name.asc()).all()
    result = []
    for genre in genres:
        d = genre.to_dict()
        d['ingredient_count'] = Item.query.filter_by(
            user_id=g.user_id, item_type=1, genre_id=genre.id
        ).count()
        result.append(d)
    result.sort(key=lambda x: -x['ingredient_count'])
    return success(result)


# POST /api/genres
@genres_bp.route('', methods=['POST'])
@require_auth
def create_genre():
    body = request.get_json(silent=True) or {}
    name = (body.get('name') or '').strip()
    if not name:
        return error('VALIDATION_ERROR', 'name は必須です')
    existing = Genre.query.filter_by(name=name).first()
    if existing:
        return error('CONFLICT', f'「{name}」はすでに登録されています', 409)
    genre = Genre(name=name)
    db.session.add(genre)
    db.session.commit()
    d = genre.to_dict()
    d['ingredient_count'] = 0
    return success(d, status=201)


# PUT /api/genres/<id>
@genres_bp.route('/<int:genre_id>', methods=['PUT'])
@require_auth
def update_genre(genre_id):
    genre = Genre.query.get(genre_id)
    if not genre:
        return error('NOT_FOUND', 'ジャンルが見つかりません', 404)
    body = request.get_json(silent=True) or {}
    name = (body.get('name') or '').strip()
    if not name:
        return error('VALIDATION_ERROR', 'name は空にできません')
    duplicate = Genre.query.filter_by(name=name).first()
    if duplicate and duplicate.id != genre_id:
        return error('CONFLICT', f'「{name}」はすでに登録されています', 409)
    old_name = genre.name
    genre.name = name
    Item.query.filter_by(genre=old_name).update({'genre': name})
    db.session.commit()
    d = genre.to_dict()
    d['ingredient_count'] = Item.query.filter_by(
        user_id=g.user_id, item_type=1, genre_id=genre_id
    ).count()
    return success(d)


# DELETE /api/genres/<id>
@genres_bp.route('/<int:genre_id>', methods=['DELETE'])
@require_auth
def delete_genre(genre_id):
    genre = Genre.query.get(genre_id)
    if not genre:
        return error('NOT_FOUND', 'ジャンルが見つかりません', 404)
    count = Item.query.filter_by(item_type=1, genre_id=genre_id).count()
    if count > 0:
        return error('CONFLICT', f'このジャンルは {count} 件の食材で使用中のため削除できません', 409)
    db.session.delete(genre)
    db.session.commit()
    return success(message='ジャンルを削除しました')
