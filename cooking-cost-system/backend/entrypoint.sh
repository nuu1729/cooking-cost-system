#!/bin/sh
# Docker secrets からパスワードを読み込み、DATABASE_URL_PRODUCTION を構築してから
# Gunicorn を起動する。引数でシークレットをプロセスに渡さないことで漏洩を防ぐ。
# pipefail は /bin/sh では非対応のため、パイプ内エラーは個別に確認する
set -eu

# --- ヘルパー関数 ---
check_secret() {
    if [ ! -f "/run/secrets/$1" ]; then
        echo "Error: Docker secret '/run/secrets/$1' not found." >&2
        echo "  Check the 'secrets' section in docker-compose.prod.yml and secrets/*.txt files." >&2
        exit 1
    fi
}

check_python3() {
    if ! command -v python3 > /dev/null 2>&1; then
        echo "Error: python3 not found. Required for URL encoding." >&2
        exit 1
    fi
}

# --- 前提チェック ---
check_python3
check_secret mysql_password
check_secret jwt_secret
check_secret secret_key

# --- Docker secrets を読み込む ---
# tr -d '\r\n' で Windows 環境で作成されたシークレットファイルの CRLF も除去する
# DB_PASSWORD は意図的に export しない（DATABASE_URL_PRODUCTION 構築後に unset する）
DB_PASSWORD=$(cat /run/secrets/mysql_password | tr -d '\r\n')

JWT_SECRET=$(cat /run/secrets/jwt_secret | tr -d '\r\n')
export JWT_SECRET
# NOTE: JWT_SECRET は環境変数として /proc/<pid>/environ から読み取り可能。
# Flask 側でファイルから直接読み込む方式への移行は issue #148 で追跡。

SECRET_KEY=$(cat /run/secrets/secret_key | tr -d '\r\n')
export SECRET_KEY

# --- DATABASE_URL_PRODUCTION を構築（パスワードを URL エンコード）---
# DB_HOST / DB_USER / DB_NAME は機密情報ではないため docker-compose.prod.yml の environment で管理
# パスワードのみ Docker secrets 経由で取得する
# NOTE: DATABASE_URL_PRODUCTION 自体にパスワードが含まれるため /proc/<pid>/environ の
#       漏洩リスクは残る。unset は DB_PASSWORD / DB_PASSWORD_ENCODED の残存を防ぐためのもの。
DB_HOST="${DB_HOST:-database}"
DB_USER="${DB_USER:-cooking_user}"
DB_NAME="${DB_NAME:-cooking_cost_system}"

DB_PASSWORD_ENCODED=$(printf '%s' "${DB_PASSWORD}" | python3 -c "
import urllib.parse, sys
print(urllib.parse.quote(sys.stdin.read().rstrip('\n'), safe=''))
")
export DATABASE_URL_PRODUCTION="mysql+pymysql://${DB_USER}:${DB_PASSWORD_ENCODED}@${DB_HOST}:3306/${DB_NAME}"

# パスワード変数をクリア（DATABASE_URL_PRODUCTION へ組み込み済みのため DB_PASSWORD_ENCODED も不要）
unset DB_PASSWORD
unset DB_PASSWORD_ENCODED

# --- 起動（CMD の引数は entrypoint.sh の "$@" に渡される）---
# デバッグ時は `docker run --entrypoint /bin/sh image` でシェル起動可能
if [ $# -eq 0 ]; then
    exec gunicorn --config gunicorn.conf.py wsgi:app
else
    exec "$@"
fi
