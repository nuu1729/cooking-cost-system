import os
from urllib.parse import urlparse
from config import Config


def _validate_cors_origin_staging() -> str:
    val = os.environ.get('CORS_ORIGIN', 'http://localhost:3000')
    for origin in [o.strip() for o in val.split(',')]:
        if origin == '*':
            raise RuntimeError('[CORS設定エラー] CORS_ORIGIN にワイルドカード "*" は使用できません。')
        parsed = urlparse(origin)
        if parsed.scheme not in ('http', 'https'):
            raise RuntimeError(
                f'[CORS設定エラー] CORS_ORIGIN "{origin}" は http:// または https:// で始まる必要があります。'
            )
    return val


class StagingConfig(Config):
    DEBUG = True
    ENV = 'staging'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL_STAGING')
    CORS_ORIGIN = _validate_cors_origin_staging()
