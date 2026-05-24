import os
from config import Config


def _require_env(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        raise RuntimeError(f'本番環境では {name} 環境変数の設定が必要です')
    return val


def _validate_cors_origin() -> str:
    val = _require_env('CORS_ORIGIN')
    origins = [o.strip() for o in val.split(',')]
    for origin in origins:
        if 'localhost' in origin or '127.0.0.1' in origin:
            raise RuntimeError(
                f'本番環境の CORS_ORIGIN にローカルオリジン "{origin}" は使用できません。'
                ' Cloudflare Pages 等の本番ドメインを指定してください。'
            )
    return val


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    PROPAGATE_EXCEPTIONS = False
    ENV = 'production'
    JWT_SECRET = _require_env('JWT_SECRET')
    SECRET_KEY = _require_env('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = _require_env('DATABASE_URL_PRODUCTION')
    CORS_ORIGIN = _validate_cors_origin()
