import os
from .config import Config

class StagingConfig(Config):
    """Staging config."""
    DEBUG = True
    ENV = 'staging'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL_STAGING')
