#!/bin/sh
# Docker secrets からパスワードを読み込み、DATABASE_URL_PRODUCTION を構築してから
# Gunicorn を起動する。引数でシークレットをプロセスに渡さないことで漏洩を防ぐ。
set -eu

# --- Docker secrets を読み込む ---
if [ ! -f /run/secrets/mysql_password ]; then
    echo "Error: /run/secrets/mysql_password not found" >&2
    exit 1
fi
if [ ! -f /run/secrets/jwt_secret ]; then
    echo "Error: /run/secrets/jwt_secret not found" >&2
    exit 1
fi
if [ ! -f /run/secrets/secret_key ]; then
    echo "Error: /run/secrets/secret_key not found" >&2
    exit 1
fi

# DB_PASSWORD は意図的に export しない（DATABASE_URL_PRODUCTION 構築後にクリア）
DB_PASSWORD=$(cat /run/secrets/mysql_password)
export JWT_SECRET=$(cat /run/secrets/jwt_secret)
export SECRET_KEY=$(cat /run/secrets/secret_key)

# --- DATABASE_URL_PRODUCTION を構築（パスワードを URL エンコード）---
DB_HOST="${DB_HOST:-database}"
DB_USER="${DB_USER:-cooking_user}"
DB_NAME="${DB_NAME:-cooking_cost_system}"

DB_PASSWORD_ENCODED=$(printf '%s' "${DB_PASSWORD}" | python3 -c "
import urllib.parse, sys
print(urllib.parse.quote(sys.stdin.read().rstrip('\n'), safe=''))
")
export DATABASE_URL_PRODUCTION="mysql+pymysql://${DB_USER}:${DB_PASSWORD_ENCODED}@${DB_HOST}:3306/${DB_NAME}"

# パスワード変数をクリア
unset DB_PASSWORD
unset DB_PASSWORD_ENCODED

# --- Gunicorn 起動 ---
exec gunicorn --config gunicorn.conf.py wsgi:app
