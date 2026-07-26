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


def _validate_non_empty(value: str, env_name: str) -> str:
    """値が空でないことを検証する。_load_secret の内部実装（_read_secret_file/
    _require_env）は現在いずれも空文字列を返さないが、CF_ACCOUNT_ID・
    CF_D1_DATABASE_ID と同様に呼び出し側で明示的に検証し、内部実装の変更に
    依存しない対称な保証とする。

    使い分け: CF_D1_API_TOKEN のように「形式は多様（Bearer トークン等）で
    空チェックのみで十分」な値に使う。CF_ACCOUNT_ID/CF_D1_DATABASE_ID のように
    URI を壊す文字（`@` `:` `/` 等）を排除する必要がある識別子形式の値には、
    _validate_db_component を使うこと。"""
    if not value:
        raise RuntimeError(f'{env_name} が空です。')
    return value


class ProductionConfig(Config):
    """Cloudflare D1 の REST API 接続情報から SQLAlchemy 接続文字列を構築する。

    account_id・database_id は非機密（Cloudflare ダッシュボードに表示される識別子）のため
    通常の環境変数から読む。api_token のみ機密情報のため、他の secrets（jwt_secret・
    secret_key）と同じ _load_secret パターン（Docker secrets ファイル優先、環境変数に
    フォールバック）で読み込む。

    接続文字列形式: cloudflare_d1://{account_id}:{api_token}@{database_id}
    （sqlalchemy-cloudflare-d1 の仕様。#171 spike で batch 原子性・クエリパターンの
    動作を検証済み。ただし ORM の session.commit() は D1 上で複数行更新に対する
    原子性を持たないため、cascade.py の書き込みは batch API を直接呼ぶ別経路を使う）。

    ⚠️ api_token を URI から除外することはできない。sqlalchemy-cloudflare-d1 の
    create_connect_args() が api_token を URI の password フィールドから
    しか取得しない仕様のため（ライブラリの構造的制約。フォーク以外に回避手段なし）。
    """
    DEBUG = False
    TESTING = False
    PROPAGATE_EXCEPTIONS = False
    ENV = 'production'
    JWT_SECRET = _load_secret('jwt_secret', env_fallback='JWT_SECRET')
    SECRET_KEY = _load_secret('secret_key', env_fallback='SECRET_KEY')
    # cascade.py が D1 batch API を直接呼ぶ際に使う（SQLALCHEMY_DATABASE_URI とは別に
    # current_app.config から読めるようにするため、URI 構築時の値をそのまま保持する）
    CF_ACCOUNT_ID = _validate_db_component(_require_env('CF_ACCOUNT_ID'), 'CF_ACCOUNT_ID')
    CF_D1_DATABASE_ID = _validate_db_component(_require_env('CF_D1_DATABASE_ID'), 'CF_D1_DATABASE_ID')
    CF_D1_API_TOKEN = _validate_non_empty(
        _load_secret('cf_d1_api_token', env_fallback='CF_D1_API_TOKEN'), 'CF_D1_API_TOKEN'
    )
    SQLALCHEMY_DATABASE_URI = (
        f'cloudflare_d1://{CF_ACCOUNT_ID}:{quote_plus(CF_D1_API_TOKEN)}@{CF_D1_DATABASE_ID}'
    )
    CORS_ORIGIN = validate_cors_origins(
        _require_env('CORS_ORIGIN'),
        require_https=True,
        allow_local=False,
    )
    # サインアップ確認メール送信用（Resend）。api_token と同じ secrets ファイル優先パターン
    RESEND_API_KEY = _load_secret('resend_api_key', env_fallback='RESEND_API_KEY')
    RESEND_FROM_EMAIL = _require_env('RESEND_FROM_EMAIL')
    # 確認メール内のリンク（{FRONTEND_URL}/verify-email?token=...）の生成に使う
    FRONTEND_URL = _require_env('FRONTEND_URL')
