from functools import wraps
from flask import request, g, current_app
import jwt
from api.utils.response import error


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return error('UNAUTHORIZED', '認証が必要です', 401)
        token = auth_header[7:]
        try:
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET'],
                algorithms=['HS256']
            )
            g.user_id = int(payload['sub'])
            g.token_jti = payload.get('jti')
        except jwt.ExpiredSignatureError:
            return error('UNAUTHORIZED', 'トークンの有効期限が切れています', 401)
        except jwt.InvalidTokenError:
            return error('UNAUTHORIZED', 'トークンが無効です', 401)

        from api.models.revoked_token import RevokedToken
        if g.token_jti and RevokedToken.is_revoked(g.token_jti):
            return error('UNAUTHORIZED', 'トークンは失効しています', 401)

        return f(*args, **kwargs)
    return decorated
