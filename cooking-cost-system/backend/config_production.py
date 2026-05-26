import os
from config import Config, validate_cors_origins


def _require_env(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        raise RuntimeError(f'本番環境では {name} 環境変数の設定が必要です')
    return val


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    PROPAGATE_EXCEPTIONS = False
    ENV = 'production'
    JWT_SECRET = _require_env('JWT_SECRET')
    SECRET_KEY = _require_env('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = _require_env('DATABASE_URL_PRODUCTION')
    CORS_ORIGIN = validate_cors_origins(
        _require_env('CORS_ORIGIN'),
        require_https=True,
        allow_local=False,
    )
