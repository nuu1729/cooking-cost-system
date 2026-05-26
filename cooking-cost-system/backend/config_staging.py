import os
from config import Config

class StagingConfig(Config):
    DEBUG = True
    ENV = 'staging'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL_STAGING')
    CORS_ORIGIN = os.environ.get('CORS_ORIGIN', 'http://localhost:3000')
