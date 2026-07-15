import os
from urllib.parse import urlparse, quote_plus
from dotenv import load_dotenv

load_dotenv()

DEFAULT_CORS_ORIGIN = 'http://localhost:3000'


def build_d1_database_uri(account_id: str, api_token: str, database_id: str) -> str:
    """Cloudflare D1 用の SQLAlchemy 接続 URI を組み立てる（sqlalchemy-cloudflare-d1 の URL 形式）。"""
    return f'cloudflare_d1://{quote_plus(account_id)}:{quote_plus(api_token)}@{database_id}'

_LOCAL_HOSTS = {'localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0'}


def validate_cors_origins(val: str, *, require_https: bool = False, allow_local: bool = True) -> str:
    """CORS_ORIGIN の値を検証して返す。

    Args:
        val: カンマ区切りのオリジン文字列
        require_https: True のとき全オリジンで HTTPS を強制
        allow_local: False のとき localhost 等のローカルオリジンを禁止
    """
    for origin in [o.strip() for o in val.split(',')]:
        if origin == '*':
            raise RuntimeError('[CORS設定エラー] ワイルドカード "*" は使用できません。')
        parsed = urlparse(origin)
        is_local = parsed.hostname in _LOCAL_HOSTS
        if parsed.scheme not in ('http', 'https'):
            raise RuntimeError(
                f'[CORS設定エラー] CORS_ORIGIN "{origin}" は http:// または https:// で始まる必要があります。'
            )
        if not allow_local and is_local:
            raise RuntimeError(
                f'[CORS設定エラー] ローカルオリジン "{origin}" は使用できません。'
                ' 本番ドメインを指定してください。'
            )
        if require_https and parsed.scheme != 'https':
            raise RuntimeError(
                f'[CORS設定エラー] 本番環境の CORS_ORIGIN "{origin}" は https:// である必要があります。'
            )
        if not is_local and parsed.scheme == 'http':
            raise RuntimeError(
                f'[CORS設定エラー] 非ローカルオリジン "{origin}" は https:// が必要です。'
            )
    return val


def _require_env(key: str) -> str:
    value = os.environ.get(key)
    if not value:
        raise RuntimeError(
            f"環境変数 '{key}' が設定されていません。"
            f".env.example を参考に .env を作成してください。"
        )
    return value


class Config:
    SECRET_KEY = _require_env('SECRET_KEY')
    JWT_SECRET = os.environ.get('JWT_SECRET', os.environ.get('SECRET_KEY', ''))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGIN = os.environ.get('CORS_ORIGIN', DEFAULT_CORS_ORIGIN)
    # SQLALCHEMY_DATABASE_URI はここでは定義しない。
    # クラス本体はサブクラス定義前に即時評価されるため、ここで _require_env('DATABASE_URL') を
    # 呼ぶと staging/production（D1 接続で DATABASE_URL を使わない）でも import 時点で
    # 例外になってしまう。各サブクラスが自身の接続方式で個別に設定すること。


class DevelopmentConfig(Config):
    DEBUG = True
    ENV = 'development'
    # ここでは _require_env を使わず os.environ.get に留める。
    # このクラス本体は staging/production 利用時にも config.py の import に伴って
    # 必ず評価されるため、ここで例外を送出すると development 以外の環境まで壊れてしまう。
    # 値の存在チェックは create_app() 側で「実際に選択された環境」に対してのみ行う。
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
