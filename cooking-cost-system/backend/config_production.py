import os
from .config import Config

class ProductionConfig(Config):
    """Production config."""
    DEBUG = False
    ENV = 'production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL_PRODUCTION')
