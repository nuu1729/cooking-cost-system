import os
from config import Config, DEFAULT_CORS_ORIGIN, build_d1_database_uri, validate_cors_origins


def _require_env(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        raise RuntimeError(f'staging 環境では {name} 環境変数の設定が必要です')
    return val


class StagingConfig(Config):
    DEBUG = True
    ENV = 'staging'
    SQLALCHEMY_DATABASE_URI = build_d1_database_uri(
        _require_env('CF_ACCOUNT_ID'),
        _require_env('CF_D1_API_TOKEN'),
        _require_env('CF_D1_DATABASE_ID'),
    )
    CORS_ORIGIN = validate_cors_origins(
        os.environ.get('CORS_ORIGIN', DEFAULT_CORS_ORIGIN),
        require_https=False,
        allow_local=True,
    )
