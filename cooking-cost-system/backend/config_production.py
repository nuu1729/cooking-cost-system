import os
from config import Config, build_d1_database_uri, validate_cors_origins

# テスト・非標準環境向けに環境変数で上書き可能
SECRETS_DIR = os.environ.get('SECRETS_DIR', '/run/secrets')


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


def _build_database_uri() -> str:
    """Cloudflare D1 の接続情報から SQLAlchemy 用 URI を組み立てる。
    CF_D1_API_TOKEN は secrets ファイル（{SECRETS_DIR}/cf_d1_api_token）を優先し、
    無ければ環境変数にフォールバックする（jwt_secret/secret_key と同じ方式）。
    CF_ACCOUNT_ID / CF_D1_DATABASE_ID は非機密のため環境変数のみ。"""
    account_id = _require_env('CF_ACCOUNT_ID')
    database_id = _require_env('CF_D1_DATABASE_ID')
    api_token = _load_secret('cf_d1_api_token', env_fallback='CF_D1_API_TOKEN')
    return build_d1_database_uri(account_id, api_token, database_id)


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
