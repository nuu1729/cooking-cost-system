from flask import Blueprint, request, g, current_app
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
import bcrypt
import os
import uuid
from api.database import db
from api.models.user import User
from api.utils.response import success, error
from api.utils.auth import require_auth

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}

def _allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def _upload_dir() -> str:
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return os.path.join(base, 'uploads')

def _save_file(file, subfolder: str) -> str:
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    save_dir = os.path.join(_upload_dir(), subfolder)
    os.makedirs(save_dir, exist_ok=True)
    file.save(os.path.join(save_dir, filename))
    return f"/uploads/{subfolder}/{filename}"

def _delete_old_file(url: Optional[str]):
    if not url:
        return
    rel = url.lstrip('/')
    abs_path = os.path.join(_upload_dir(), *rel.split('/')[1:])
    if os.path.exists(abs_path):
        os.remove(abs_path)

auth_bp = Blueprint('auth', __name__)


def _generate_token(user_id: int, secret: str) -> tuple[str, str]:
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    token = jwt.encode(
        {'sub': user_id, 'exp': expires_at},
        secret,
        algorithm='HS256'
    )
    return token, expires_at.isoformat().replace('+00:00', 'Z')


# POST /api/auth/register
@auth_bp.route('/register', methods=['POST'])
def register():
    body = request.get_json(silent=True) or {}
    username = (body.get('username') or '').strip()
    email = (body.get('email') or '').strip()
    password = body.get('password') or ''

    if not username or not email or not password:
        return error('VALIDATION_ERROR', 'username・email・password は必須です')
    if len(username) < 3 or len(username) > 50:
        return error('VALIDATION_ERROR', 'username は 3〜50 文字で入力してください')
    if len(password) < 8:
        return error('VALIDATION_ERROR', 'password は 8 文字以上で入力してください')

    if User.query.filter_by(username=username).first():
        return error('CONFLICT', 'そのユーザー名は既に使用されています', 409)
    if User.query.filter_by(email=email).first():
        return error('CONFLICT', 'そのメールアドレスは既に使用されています', 409)

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()
    user = User(username=username, email=email, password_hash=pw_hash)
    db.session.add(user)
    db.session.commit()

    token, expires_at = _generate_token(user.id, current_app.config['JWT_SECRET'])
    return success({'user': user.to_dict(), 'token': token, 'expiresAt': expires_at}, status=201)


# POST /api/auth/login
@auth_bp.route('/login', methods=['POST'])
def login():
    body = request.get_json(silent=True) or {}
    identifier = (body.get('username') or body.get('email') or '').strip()
    password = body.get('password') or ''

    if not identifier or not password:
        return error('VALIDATION_ERROR', 'メールアドレスとパスワードは必須です')

    user = User.query.filter(
        (User.email == identifier) | (User.username == identifier)
    ).first()
    if not user:
        return error('USER_NOT_FOUND', 'このアカウントは登録されていません', 404)
    if not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return error('WRONG_PASSWORD', 'パスワードが正しくありません', 401)
    if not user.is_active:
        return error('UNAUTHORIZED', 'アカウントが無効です', 401)

    token, expires_at = _generate_token(user.id, current_app.config['JWT_SECRET'])
    return success({'user': user.to_dict(), 'token': token, 'expiresAt': expires_at})


# POST /api/auth/logout
@auth_bp.route('/logout', methods=['POST'])
@require_auth
def logout():
    return success(message='ログアウトしました')


# GET /api/auth/me
@auth_bp.route('/me', methods=['GET'])
@require_auth
def me():
    user = User.query.get(g.user_id)
    if not user:
        return error('UNAUTHORIZED', 'ユーザーが見つかりません', 401)
    return success(user.to_dict())


# GET /api/auth/status
@auth_bp.route('/status', methods=['GET'])
def status():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return success({'valid': False, 'authEnabled': True})
    token = auth_header[7:]
    try:
        payload = jwt.decode(token, current_app.config['JWT_SECRET'], algorithms=['HS256'])
        user = User.query.get(payload['sub'])
        if user and user.is_active:
            return success({'valid': True, 'authEnabled': True, 'user': {'id': user.id, 'username': user.username}})
    except jwt.InvalidTokenError:
        pass
    return success({'valid': False, 'authEnabled': True})


# POST /api/auth/refresh
@auth_bp.route('/refresh', methods=['POST'])
@require_auth
def refresh():
    user = User.query.get(g.user_id)
    if not user or not user.is_active:
        return error('UNAUTHORIZED', 'ユーザーが見つかりません', 401)
    token, expires_at = _generate_token(user.id, current_app.config['JWT_SECRET'])
    return success({'token': token, 'expiresAt': expires_at})


# PUT /api/auth/profile
@auth_bp.route('/profile', methods=['PUT'])
@require_auth
def update_profile():
    body = request.get_json(silent=True) or {}
    user = User.query.get(g.user_id)
    if not user:
        return error('UNAUTHORIZED', 'ユーザーが見つかりません', 401)

    new_username = (body.get('username') or '').strip() or None
    new_email = (body.get('email') or '').strip() or None

    if new_username:
        if len(new_username) < 3 or len(new_username) > 50:
            return error('VALIDATION_ERROR', 'username は 3〜50 文字で入力してください')
        dup = User.query.filter(User.username == new_username, User.id != user.id).first()
        if dup:
            return error('CONFLICT', 'そのユーザー名は既に使用されています', 409)
        user.username = new_username

    if new_email:
        dup = User.query.filter(User.email == new_email, User.id != user.id).first()
        if dup:
            return error('CONFLICT', 'そのメールアドレスは既に使用されています', 409)
        user.email = new_email

    db.session.commit()
    return success(user.to_dict())


# PUT /api/auth/password
@auth_bp.route('/password', methods=['PUT'])
@require_auth
def update_password():
    body = request.get_json(silent=True) or {}
    current_password = body.get('currentPassword') or body.get('current_password') or ''
    new_password = body.get('newPassword') or body.get('new_password') or ''

    if not current_password or not new_password:
        return error('VALIDATION_ERROR', 'currentPassword と newPassword は必須です')
    if len(new_password) < 8:
        return error('VALIDATION_ERROR', 'newPassword は 8 文字以上で入力してください')

    user = User.query.get(g.user_id)
    if not user or not bcrypt.checkpw(current_password.encode(), user.password_hash.encode()):
        return error('UNAUTHORIZED', '現在のパスワードが正しくありません', 401)

    user.password_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt(rounds=12)).decode()
    db.session.commit()
    return success(message='パスワードを変更しました')


# POST /api/auth/upload-icon
@auth_bp.route('/upload-icon', methods=['POST'])
@require_auth
def upload_icon():
    if 'file' not in request.files:
        return error('VALIDATION_ERROR', 'file フィールドが必要です')
    file = request.files['file']
    if not file or file.filename == '':
        return error('VALIDATION_ERROR', 'ファイルが選択されていません')
    if not _allowed_file(file.filename):
        return error('VALIDATION_ERROR', '許可されていないファイル形式です（jpg/png/gif/webp）')

    user = User.query.get(g.user_id)
    if not user:
        return error('NOT_FOUND', 'ユーザーが見つかりません', 404)

    _delete_old_file(user.icon_url)
    url = _save_file(file, 'icons')
    user.icon_url = url
    db.session.commit()
    return success({'icon_url': url})


# POST /api/auth/upload-home-bg
@auth_bp.route('/upload-home-bg', methods=['POST'])
@require_auth
def upload_home_bg():
    if 'file' not in request.files:
        return error('VALIDATION_ERROR', 'file フィールドが必要です')
    file = request.files['file']
    if not file or file.filename == '':
        return error('VALIDATION_ERROR', 'ファイルが選択されていません')
    if not _allowed_file(file.filename):
        return error('VALIDATION_ERROR', '許可されていないファイル形式です（jpg/png/gif/webp）')

    user = User.query.get(g.user_id)
    if not user:
        return error('NOT_FOUND', 'ユーザーが見つかりません', 404)

    _delete_old_file(user.home_bg_url)
    url = _save_file(file, 'home_bg')
    user.home_bg_url = url
    db.session.commit()
    return success({'home_bg_url': url})


# DELETE /api/auth/upload-icon
@auth_bp.route('/upload-icon', methods=['DELETE'])
@require_auth
def delete_icon():
    user = User.query.get(g.user_id)
    if not user:
        return error('NOT_FOUND', 'ユーザーが見つかりません', 404)
    _delete_old_file(user.icon_url)
    user.icon_url = None
    db.session.commit()
    return success(message='アイコンを削除しました')


# DELETE /api/auth/upload-home-bg
@auth_bp.route('/upload-home-bg', methods=['DELETE'])
@require_auth
def delete_home_bg():
    user = User.query.get(g.user_id)
    if not user:
        return error('NOT_FOUND', 'ユーザーが見つかりません', 404)
    _delete_old_file(user.home_bg_url)
    user.home_bg_url = None
    db.session.commit()
    return success(message='背景画像を削除しました')
