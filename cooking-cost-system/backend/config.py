import os
from dotenv import load_dotenv

load_dotenv()


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
