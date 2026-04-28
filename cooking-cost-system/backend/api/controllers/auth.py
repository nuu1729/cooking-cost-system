from flask import Blueprint, request, g, current_app
from datetime import datetime, timedelta, timezone
import jwt
import bcrypt
from api.database import db
from api.models.user import User
from api.utils.response import success, error
from api.utils.auth import require_auth

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
    username = (body.get('username') or '').strip()
    password = body.get('password') or ''

    if not username or not password:
        return error('VALIDATION_ERROR', 'username と password は必須です')

    user = User.query.filter_by(username=username).first()
    if not user or not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return error('UNAUTHORIZED', 'ユーザー名またはパスワードが正しくありません', 401)
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
