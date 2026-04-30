from flask import Blueprint, request
from api.database import db
from api.models.memo import Memo
from api.utils.response import success, error
from api.utils.auth import require_auth

memo_bp = Blueprint('memo', __name__)


# GET /api/memo
@memo_bp.route('', methods=['GET'])
@require_auth
def list_memos():
    memos = Memo.query.order_by(Memo.created_at.desc()).all()
    return success([m.to_dict() for m in memos], count=len(memos))


# POST /api/memo
@memo_bp.route('', methods=['POST'])
@require_auth
def create_memo():
    body = request.get_json(silent=True) or {}
    content = (body.get('content') or '').strip()
    if not content:
        return error('VALIDATION_ERROR', 'content は必須です')
    memo = Memo(content=content)
    db.session.add(memo)
    db.session.commit()
    return success(memo.to_dict(), status=201)


# GET /api/memo/<id>
@memo_bp.route('/<int:memo_id>', methods=['GET'])
@require_auth
def get_memo(memo_id):
    memo = Memo.query.get(memo_id)
    if not memo:
        return error('NOT_FOUND', 'メモが見つかりません', 404)
    return success(memo.to_dict())


# PUT /api/memo/<id>
@memo_bp.route('/<int:memo_id>', methods=['PUT'])
@require_auth
def update_memo(memo_id):
    memo = Memo.query.get(memo_id)
    if not memo:
        return error('NOT_FOUND', 'メモが見つかりません', 404)
    body = request.get_json(silent=True) or {}
    content = (body.get('content') or '').strip()
    if not content:
        return error('VALIDATION_ERROR', 'content は必須です')
    memo.content = content
    db.session.commit()
    return success(memo.to_dict())


# DELETE /api/memo/<id>
@memo_bp.route('/<int:memo_id>', methods=['DELETE'])
@require_auth
def delete_memo(memo_id):
    memo = Memo.query.get(memo_id)
    if not memo:
        return error('NOT_FOUND', 'メモが見つかりません', 404)
    db.session.delete(memo)
    db.session.commit()
    return success(message='メモを削除しました')
