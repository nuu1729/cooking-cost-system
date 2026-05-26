import os
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

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
    SQLALCHEMY_DATABASE_URI = _require_env('DATABASE_URL')
    CORS_ORIGIN = os.environ.get('CORS_ORIGIN', 'http://localhost:3000')


class DevelopmentConfig(Config):
    DEBUG = True
    ENV = 'development'


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
