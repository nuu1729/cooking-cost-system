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
            g.user_id = payload['sub']
        except jwt.ExpiredSignatureError:
            return error('UNAUTHORIZED', 'トークンの有効期限が切れています', 401)
        except jwt.InvalidTokenError:
            return error('UNAUTHORIZED', 'トークンが無効です', 401)
        return f(*args, **kwargs)
    return decorated
