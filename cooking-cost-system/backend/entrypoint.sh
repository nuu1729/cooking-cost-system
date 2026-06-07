#!/bin/sh
# Docker secrets からパスワードを読み込み、DATABASE_URL_PRODUCTION を構築してから
# Gunicorn を起動する。引数でシークレットをプロセスに渡さないことでメモリ漏洩を防ぐ。
set -eu

# --- Docker secrets を環境変数に展開 ---
if [ -f /run/secrets/mysql_password ]; then
    DB_PASSWORD=$(cat /run/secrets/mysql_password)
else
    echo "Error: /run/secrets/mysql_password が見つかりません" >&2
    exit 1
fi

if [ -f /run/secrets/jwt_secret ]; then
    JWT_SECRET=$(cat /run/secrets/jwt_secret)
    export JWT_SECRET
else
    echo "Error: /run/secrets/jwt_secret が見つかりません" >&2
    exit 1
fi

if [ -f /run/secrets/secret_key ]; then
    SECRET_KEY=$(cat /run/secrets/secret_key)
    export SECRET_KEY
else
    echo "Error: /run/secrets/secret_key が見つかりません" >&2
    exit 1
fi

# --- DATABASE_URL_PRODUCTION を構築 ---
DB_HOST="${DB_HOST:-database}"
DB_USER="${DB_USER:-cooking_user}"
DB_NAME="${DB_NAME:-cooking_cost_system}"
export DATABASE_URL_PRODUCTION="mysql+pymysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:3306/${DB_NAME}"

# パスワード変数をメモリから即座にクリア
unset DB_PASSWORD

# --- Gunicorn 起動 ---
exec gunicorn --config gunicorn.conf.py wsgi:app
