import os
from urllib.parse import quote_plus
from config import Config, validate_cors_origins


def _require_env(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        raise RuntimeError(f'本番環境では {name} 環境変数の設定が必要です')
    return val


def _load_secret(name: str, env_fallback: str) -> str:
    """Docker secrets ファイル (/run/secrets/<name>) を優先して読み込む。
    ファイルが存在しない場合は env_fallback 環境変数にフォールバック
    （Docker secrets 非対応のデプロイ環境との後方互換性のため）。"""
    path = f'/run/secrets/{name}'
    if os.path.exists(path):
        with open(path) as f:
            value = f.read().strip()
        if value:
            return value
    return _require_env(env_fallback)


def _build_database_uri() -> str:
    """mysql_password secrets ファイルが存在する場合はそこから URI を構築。
    存在しない場合は DATABASE_URL_PRODUCTION 環境変数にフォールバック。"""
    secret_path = '/run/secrets/mysql_password'
    if os.path.exists(secret_path):
        with open(secret_path) as f:
            password = f.read().strip()
        user = os.environ.get('DB_USER', 'cooking_user')
        host = os.environ.get('DB_HOST', 'database')
        name = os.environ.get('DB_NAME', 'cooking_cost_system')
        return f'mysql+pymysql://{user}:{quote_plus(password)}@{host}:3306/{name}'
    return _require_env('DATABASE_URL_PRODUCTION')


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    PROPAGATE_EXCEPTIONS = False
    ENV = 'production'
    JWT_SECRET = _load_secret('jwt_secret', env_fallback='JWT_SECRET')
    SECRET_KEY = _load_secret('secret_key', env_fallback='SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = _build_database_uri()
    CORS_ORIGIN = validate_cors_origins(
        _require_env('CORS_ORIGIN'),
        require_https=True,
        allow_local=False,
    )
