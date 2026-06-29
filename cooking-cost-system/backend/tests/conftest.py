import os
import secrets

# config.py の class Config がモジュール import 時に _require_env() を評価するため、
# pytest のテスト収集前にダミー値を設定して RuntimeError を回避する。
# 実際の値は使用されない（validate_cors_origins は Config インスタンスに依存しない）。
os.environ.setdefault('SECRET_KEY', secrets.token_hex(32))
os.environ.setdefault('DATABASE_URL', 'sqlite:///:memory:')
