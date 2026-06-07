#!/bin/sh
# Docker secrets からパスワードを読み込み、DATABASE_URL_PRODUCTION を構築してから
# Gunicorn を起動する。引数でシークレットをプロセスに渡さないことで漏洩を防ぐ。
set -eu

# --- ヘルパー関数 ---
check_secret() {
    if [ ! -f "/run/secrets/$1" ]; then
        echo "Error: /run/secrets/$1 not found" >&2
        exit 1
    fi
}

# --- Docker secrets の存在確認 ---
check_secret mysql_password
check_secret jwt_secret
check_secret secret_key

# --- Docker secrets を読み込む ---
# tr -d '\r\n' で Windows 環境で作成されたシークレットファイルの CRLF も除去する
# DB_PASSWORD は意図的に export しない（DATABASE_URL_PRODUCTION 構築後に unset する）
DB_PASSWORD=$(cat /run/secrets/mysql_password | tr -d '\r\n')

JWT_SECRET=$(cat /run/secrets/jwt_secret | tr -d '\r\n')
export JWT_SECRET

SECRET_KEY=$(cat /run/secrets/secret_key | tr -d '\r\n')
export SECRET_KEY

# --- DATABASE_URL_PRODUCTION を構築（パスワードを URL エンコード）---
# NOTE: DATABASE_URL_PRODUCTION には URL エンコードされたパスワードが含まれる。
# /proc/<pid>/environ からの読み取りリスクは残るが、docker inspect での外部参照は防止できる。
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

# --- 起動（引数があれば exec で委譲、なければ Gunicorn を起動）---
if [ $# -eq 0 ]; then
    exec gunicorn --config gunicorn.conf.py wsgi:app
else
    exec "$@"
fi
