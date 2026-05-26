import os
from config import Config, validate_cors_origins


class StagingConfig(Config):
    DEBUG = True
    ENV = 'staging'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL_STAGING')
    CORS_ORIGIN = validate_cors_origins(
        os.environ.get('CORS_ORIGIN', 'http://localhost:3000'),
        require_https=False,
        allow_local=True,
    )
