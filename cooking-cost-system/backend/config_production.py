import os
from urllib.parse import quote_plus
from config import Config, validate_cors_origins

SECRETS_DIR = '/run/secrets'


def _require_env(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        raise RuntimeError(f'本番環境では {name} 環境変数の設定が必要です')
    return val


def _read_secret_file(name: str) -> str | None:
    """Docker secrets ファイル ({SECRETS_DIR}/<name>) の内容を返す。
    ファイルが存在しない場合は None（呼び出し側でフォールバック判断）。
    ファイルが存在するが空の場合はエラー（設定ミスの可能性が高く、
    フォールバックで隠さず早期に検知する）。"""
    path = os.path.join(SECRETS_DIR, name)
    try:
        with open(path) as f:
            value = f.read().strip()
    except FileNotFoundError:
        return None
    if not value:
        raise RuntimeError(f'secrets ファイル {path} が空です。設定を確認してください。')
    return value


def _load_secret(name: str, env_fallback: str) -> str:
    """secrets ファイルを優先して読み込む。
    ファイルが存在しない場合は env_fallback 環境変数にフォールバック
    （Docker secrets 非対応のデプロイ環境との後方互換性のため）。"""
    value = _read_secret_file(name)
    if value is not None:
        return value
    return _require_env(env_fallback)


def _build_database_uri() -> str:
    """mysql_password secrets ファイルが存在する場合は DB_USER/DB_HOST/DB_PORT/DB_NAME
    （非機密、デフォルト値あり）と組み合わせて URI を構築。
    secrets ファイルが存在しない場合は DATABASE_URL_PRODUCTION 環境変数にフォールバック。"""
    password = _read_secret_file('mysql_password')
    if password is not None:
        user = os.environ.get('DB_USER', 'cooking_user')
        host = os.environ.get('DB_HOST', 'database')
        port = os.environ.get('DB_PORT', '3306')
        name = os.environ.get('DB_NAME', 'cooking_cost_system')
        return f'mysql+pymysql://{user}:{quote_plus(password)}@{host}:{port}/{name}'
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
