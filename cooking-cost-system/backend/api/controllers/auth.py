from flask import Blueprint, request, g, current_app
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
import bcrypt
import os
import re
import threading
import time
import uuid
import filetype
from api.database import db
from api.models.user import User
from api.utils.response import success, error
from api.utils.auth import require_auth
from api.extensions import limiter
from api.models.revoked_token import RevokedToken
from api.utils.audit import (
    log_login_success, log_login_failure, log_logout,
    log_register, log_login_unverified, log_email_verified, log_email_changed,
)
from api.utils.email import (
    generate_verification_token, decode_verification_token, send_verification_email,
)
from api.controllers.genres import seed_default_genres

ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def _validate_image(file) -> str | None:
    filename = file.filename or ''
    if '.' not in filename or filename.rsplit('.', 1)[1].lower() not in {'jpg', 'jpeg', 'png', 'gif', 'webp'}:
        return '許可されていないファイル形式です（jpg/png/gif/webp）'

    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > MAX_FILE_SIZE:
        return 'ファイルサイズは5MB以下にしてください'

    header = file.read(512)
    file.seek(0)
    kind = filetype.guess(header)
    if kind is None or kind.mime not in ALLOWED_MIME_TYPES:
        return '画像ファイルを選択してください（ファイルの内容が画像ではありません）'

    return None

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

# タイミング攻撃対策：ユーザーが存在しない場合もbcryptを実行するためのダミーハッシュ
_DUMMY_HASH = bcrypt.hashpw(b'dummy_timing_protection', bcrypt.gensalt(rounds=12)).decode()


def _validate_password(password: str) -> str | None:
    if len(password) < 8:
        return 'パスワードは8文字以上で入力してください'
    if not re.search(r'[a-z]', password):
        return 'パスワードに小文字英字を含めてください'
    if not re.search(r'[A-Z]', password):
        return 'パスワードに大文字英字を含めてください'
    if not re.search(r'[0-9]', password):
        return 'パスワードに数字を含めてください'
    return None


def _dispatch_verification_email(user: User, token: str) -> None:
    """確認メール送信を別スレッドに投げ、リクエストの応答をブロックしない
    （Resend への外部HTTP呼び出しの待ち時間をレスポンスに含めないため）。
    daemon=False: ワーカーのリロード・シャットダウン時に送信中のスレッドが
    強制終了され、確認メールが無音で失われるのを避ける。"""
    threading.Thread(
        target=send_verification_email,
        kwargs=dict(
            to_email=user.email,
            username=user.username,
            token=token,
            from_email=current_app.config['RESEND_FROM_EMAIL'],
            frontend_url=current_app.config['FRONTEND_URL'],
        ),
        daemon=False,
    ).start()


def _generate_token(user_id: int, secret: str) -> tuple[str, str, str]:
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    jti = uuid.uuid4().hex
    token = jwt.encode(
        {'sub': str(user_id), 'exp': expires_at, 'jti': jti},
        secret,
        algorithm='HS256'
    )
    return token, expires_at.isoformat().replace('+00:00', 'Z'), expires_at


# POST /api/auth/register
@auth_bp.route('/register', methods=['POST'])
@limiter.limit('5 per hour')
def register():
    body = request.get_json(silent=True) or {}
    username = (body.get('username') or '').strip()
    email = (body.get('email') or '').strip()
    password = body.get('password') or ''

    if not username or not email or not password:
        return error('VALIDATION_ERROR', 'username・email・password は必須です')
    if len(username) < 3 or len(username) > 50:
        return error('VALIDATION_ERROR', 'username は 3〜50 文字で入力してください')
    pw_error = _validate_password(password)
    if pw_error:
        return error('VALIDATION_ERROR', pw_error)

    if User.query.filter_by(username=username).first():
        return error('CONFLICT', 'そのユーザー名は既に使用されています', 409)
    if User.query.filter_by(email=email).first():
        return error('CONFLICT', 'そのメールアドレスは既に使用されています', 409)

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()
    user = User(username=username, email=email, password_hash=pw_hash)
    db.session.add(user)
    db.session.commit()

    seed_default_genres(user.id)
    log_register(user.id, user.username)

    verify_token = generate_verification_token(user.id, current_app.config['JWT_SECRET'])
    _dispatch_verification_email(user, verify_token)

    # メール確認が完了するまではログインさせない（トークンは発行しない）
    return success(
        {'user': user.to_dict()},
        message='確認メールを送信しました。メール内のリンクからメールアドレスの確認を完了してください。',
        status=201,
    )


# POST /api/auth/login
@auth_bp.route('/login', methods=['POST'])
@limiter.limit('10 per minute')
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
        # ユーザーが存在しない場合もbcryptを実行してタイミング攻撃を防ぐ
        bcrypt.checkpw(password.encode(), _DUMMY_HASH.encode())
        log_login_failure(identifier)
        return error('UNAUTHORIZED', 'ユーザー名またはパスワードが正しくありません', 401)
    if not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        log_login_failure(identifier)
        return error('UNAUTHORIZED', 'ユーザー名またはパスワードが正しくありません', 401)
    if not user.is_active:
        log_login_failure(identifier)
        return error('UNAUTHORIZED', 'アカウントが無効です', 401)
    if not user.email_verified:
        log_login_unverified(user.id, user.username)
        # data.email を返すのは列挙のリスクにはならない: ここに到達する時点で
        # bcrypt.checkpw が既に成功しており、呼び出し元は正しいパスワードを
        # 知っている（＝アカウントを特定できている）ことが確定している。
        # ログイン欄はメールアドレス/ユーザー名どちらでも入力可能なため、
        # ユーザー名でログインした場合でもフロントエンドが再送先の
        # メールアドレスを特定できるよう、ここで明示的に返す。
        return error(
            'EMAIL_NOT_VERIFIED', 'メールアドレスが確認されていません。確認メールをご確認ください。', 403,
            data={'email': user.email},
        )

    log_login_success(user.id, user.username)
    token, expires_at, _ = _generate_token(user.id, current_app.config['JWT_SECRET'])
    return success({'user': user.to_dict(), 'token': token, 'expiresAt': expires_at})


# POST /api/auth/verify-email
@auth_bp.route('/verify-email', methods=['POST'])
@limiter.limit('20 per hour')
def verify_email():
    body = request.get_json(silent=True) or {}
    token = (body.get('token') or '').strip()
    if not token:
        return error('VALIDATION_ERROR', 'token は必須です')

    try:
        user_id = decode_verification_token(token, current_app.config['JWT_SECRET'])
    except jwt.ExpiredSignatureError:
        return error('TOKEN_EXPIRED', '確認リンクの有効期限が切れています。再送してください。', 400)
    except jwt.InvalidTokenError:
        return error('VALIDATION_ERROR', '確認リンクが無効です。', 400)

    user = db.session.get(User, user_id)
    if not user or not user.is_active:
        return error('NOT_FOUND', 'ユーザーが見つかりません', 404)

    if not user.email_verified:
        user.email_verified = True
        db.session.commit()
        log_email_verified(user.id, user.username)

    return success(message='メールアドレスの確認が完了しました。ログインしてください。')


# POST /api/auth/resend-verification
@auth_bp.route('/resend-verification', methods=['POST'])
@limiter.limit('3 per hour')
def resend_verification():
    body = request.get_json(silent=True) or {}
    email = (body.get('email') or '').strip()
    if not email:
        return error('VALIDATION_ERROR', 'email は必須です')

    # メールアドレスの存在有無を応答から判別できないよう、常に同じメッセージ・
    # 同じ応答時間を返す（タイミング攻撃によるユーザー列挙対策）。
    # メール送信は Resend への外部HTTP呼び出しを含み、応答時間が「下限を
    # 確保する」だけでは吸収できない範囲まで伸びうる（実測で送信あり
    # ~900ms・送信なし ~500ms、という有意な差が出た）。そのためメール送信は
    # バックグラウンドスレッドに投げてレスポンスをブロックしないようにし、
    # レスポンス自体は常に固定時間だけ待って返す。
    generic_message = 'メールアドレスが登録済みかつ未確認の場合、確認メールを再送しました。'
    fixed_response_seconds = 0.5

    user = User.query.filter_by(email=email).first()
    if user and not user.email_verified:
        verify_token = generate_verification_token(user.id, current_app.config['JWT_SECRET'])
        _dispatch_verification_email(user, verify_token)

    time.sleep(fixed_response_seconds)
    return success(message=generic_message)


# POST /api/auth/logout
@auth_bp.route('/logout', methods=['POST'])
@require_auth
def logout():
    jti = g.token_jti
    if jti and not RevokedToken.is_revoked(jti):
        revoked = RevokedToken(
            jti=jti,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
        )
        db.session.add(revoked)
        RevokedToken.cleanup_expired()
        db.session.commit()
    log_logout(g.user_id)
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
    token, expires_at, _ = _generate_token(user.id, current_app.config['JWT_SECRET'])
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

    email_changed = False
    if new_email:
        dup = User.query.filter(User.email == new_email, User.id != user.id).first()
        if dup:
            return error('CONFLICT', 'そのメールアドレスは既に使用されています', 409)
        if new_email != user.email:
            user.email = new_email
            # メールアドレス変更時は実在確認をやり直す。変更前のアドレスに対する
            # email_verified=true をそのまま新アドレスへ引き継いでしまうと、
            # ログイン時の未確認ブロックが実質無意味になるため。
            # 現在有効な JWT（このリクエストの認証に使われたトークン）は意図的に
            # 失効させない。ブロックするのは「次回ログイン」のみで、変更直後の
            # セッションはそのまま使い続けられる（再ログインを要求しない設計）。
            # より厳格にするなら RevokedToken に現在の jti を追加する対応もあるが、
            # 現状は割れたメールアドレスへの不正アクセスより UX を優先している。
            user.email_verified = False
            email_changed = True

    db.session.commit()

    if email_changed:
        log_email_changed(user.id, user.username)
        verify_token = generate_verification_token(user.id, current_app.config['JWT_SECRET'])
        _dispatch_verification_email(user, verify_token)

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
    pw_error = _validate_password(new_password)
    if pw_error:
        return error('VALIDATION_ERROR', pw_error)

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
    img_error = _validate_image(file)
    if img_error:
        return error('VALIDATION_ERROR', img_error)

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
    img_error = _validate_image(file)
    if img_error:
        return error('VALIDATION_ERROR', img_error)

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
