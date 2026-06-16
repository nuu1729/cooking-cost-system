import os
import re
from urllib.parse import quote_plus
from config import Config, validate_cors_origins

# テスト・非標準環境向けに環境変数で上書き可能
SECRETS_DIR = os.environ.get('SECRETS_DIR', '/run/secrets')

# DB_USER・DB_HOST・DB_NAME に許可する文字（URI を壊す `@` `:` `/` 等を排除）
_DB_COMPONENT_RE = re.compile(r'[A-Za-z0-9_.-]+')


def _require_env(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        raise RuntimeError(f'本番環境では {name} 環境変数の設定が必要です')
    return val


def _read_secret_file(name: str) -> str | None:
    """Docker secrets ファイル ({SECRETS_DIR}/<name>) の内容を返す。
    ファイルが存在しない場合は None（呼び出し側でフォールバック判断）。
    ファイルが存在するが空の場合はエラー（設定ミスの可能性が高く、
    フォールバックで隠さず早期に検知する）。
    パーミッション不足など FileNotFoundError 以外の OSError は、
    原因が分かるようメッセージを付けて RuntimeError として再送出する。"""
    path = os.path.join(SECRETS_DIR, name)
    try:
        with open(path) as f:
            value = f.read().strip()
    except FileNotFoundError:
        return None
    except OSError as e:
        raise RuntimeError(f'secrets ファイル {path} を読み込めませんでした: {e}') from e
    if not value:
        raise RuntimeError(f'secrets ファイル {path} が空です。設定を確認してください。')
    if any(c in value for c in (' ', '\t', '\n', '\r')):
        raise RuntimeError(f'secrets ファイル {path} に空白文字が含まれています。貼り付けミスの可能性があります。')
    return value


def _load_secret(name: str, env_fallback: str) -> str:
    """secrets ファイルを優先して読み込む。
    ファイルが存在しない場合は env_fallback 環境変数にフォールバック
    （Docker secrets 非対応のデプロイ環境との後方互換性のため）。"""
    value = _read_secret_file(name)
    if value is not None:
        return value
    return _require_env(env_fallback)


def _validate_db_component(value: str, env_name: str) -> str:
    """DB_USER・DB_HOST・DB_NAME が URI を壊す文字を含まないことを検証する。"""
    if not _DB_COMPONENT_RE.fullmatch(value):
        raise RuntimeError(f'{env_name} に不正な文字が含まれています: {value!r}')
    return value


def _validate_db_port(value: str) -> str:
    if not value:
        raise RuntimeError('DB_PORT が空です。')
    if not value.isdigit() or not (1 <= int(value) <= 65535):
        raise RuntimeError(f'DB_PORT が不正です（1-65535 の数値を指定してください）: {value!r}')
    return value


def _build_database_uri() -> str:
    """mysql_password secrets ファイルが存在する場合は DB_USER/DB_HOST/DB_PORT/DB_NAME
    （非機密、デフォルト値あり）と組み合わせて URI を構築。
    secrets ファイルが存在しない場合は DATABASE_URL_PRODUCTION 環境変数にフォールバック。
    このフォールバックは setup-vps.sh 経由のデプロイでは到達しない
    （setup_secrets() が secrets/mysql_password.txt を必ず生成するため）。
    Docker secrets を使わない代替デプロイ環境専用のパス。"""
    password = _read_secret_file('mysql_password')
    if password is not None:
        user = _validate_db_component(os.environ.get('DB_USER', 'cooking_user'), 'DB_USER')
        host = _validate_db_component(os.environ.get('DB_HOST', 'database'), 'DB_HOST')
        port = _validate_db_port(os.environ.get('DB_PORT', '3306'))
        name = _validate_db_component(os.environ.get('DB_NAME', 'cooking_cost_system'), 'DB_NAME')
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
