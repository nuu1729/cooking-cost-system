#!/bin/sh
# Docker secrets からパスワードを読み込み、DATABASE_URL_PRODUCTION を構築してから
# Gunicorn を起動する。引数でシークレットをプロセスに渡さないことで漏洩を防ぐ。
# pipefail は /bin/sh では非対応のため、パイプ内エラーは個別に確認する
# ⚠️ set -x をデバッグ目的で有効にしないこと。DB_PASSWORD 等の変数値がログに平文で出力される。
set -eu

# --- ヘルパー関数 ---
check_secret() {
    if [ ! -f "/run/secrets/$1" ]; then
        echo "Error: Docker secret '/run/secrets/$1' not found." >&2
        echo "  Check the 'secrets' section in docker-compose.prod.yml and secrets/*.txt files." >&2
        exit 1
    fi
    if [ ! -s "/run/secrets/$1" ]; then
        echo "Error: Docker secret '/run/secrets/$1' is empty." >&2
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
# sed -n '1{...;p}': 先頭1行のみ取得し末尾の空白・CRLF を除去する。
#   複数行ファイルで内部改行が URL エンコード（%0A）されて接続失敗するのを防ぐ。
#   tr -d '\r\n' はパスワード内部の改行まで削除するため使わない。
# DB_PASSWORD は意図的に export しない（DATABASE_URL_PRODUCTION 構築後に unset する）
DB_PASSWORD=$(sed -n '1{s/[[:space:]]*$//;p}' /run/secrets/mysql_password) || {
    echo "Error: Failed to read mysql_password secret." >&2
    exit 1
}
if [ -z "$DB_PASSWORD" ]; then
    # check_secret はバイト数チェック（[ ! -s ]）のため whitespace-only を通過させる。
    # sed 後の空文字列チェックで補完する。
    echo "Error: mysql_password secret is empty or whitespace-only." >&2
    exit 1
fi

JWT_SECRET=$(sed -n '1{s/[[:space:]]*$//;p}' /run/secrets/jwt_secret) || {
    echo "Error: Failed to read jwt_secret secret." >&2
    exit 1
}
if [ -z "$JWT_SECRET" ]; then
    echo "Error: jwt_secret secret is empty or whitespace-only." >&2
    exit 1
fi
export JWT_SECRET
# NOTE: JWT_SECRET は環境変数として /proc/<pid>/environ から読み取り可能。
# Flask 側でファイルから直接読み込む方式への移行は issue #148 で追跡。

SECRET_KEY=$(sed -n '1{s/[[:space:]]*$//;p}' /run/secrets/secret_key) || {
    echo "Error: Failed to read secret_key secret." >&2
    exit 1
}
if [ -z "$SECRET_KEY" ]; then
    echo "Error: secret_key secret is empty or whitespace-only." >&2
    exit 1
fi
export SECRET_KEY

# --- DATABASE_URL_PRODUCTION を構築（パスワードを URL エンコード）---
# デフォルト値は docker-compose.prod.yml で管理する（entrypoint.sh 側は必須チェックのみ）
DB_HOST="${DB_HOST:?DB_HOST must be set}"
DB_USER="${DB_USER:?DB_USER must be set}"
DB_NAME="${DB_NAME:?DB_NAME must be set}"
DB_PORT="${DB_PORT:-3306}"

# NOTE: DATABASE_URL_PRODUCTION 自体にパスワードが含まれるため /proc/<pid>/environ の
#       漏洩リスクは残る。unset は DB_PASSWORD / DB_PASSWORD_ENCODED の残存を防ぐためのもの。
#       根本的な解消は issue #148（Flask 側でファイルから直接読み込む）で対応予定。
# sys.stdout.write を使って print() の末尾改行を避ける
DB_PASSWORD_ENCODED=$(printf '%s' "${DB_PASSWORD}" | python3 -c "
import urllib.parse, sys
sys.stdout.write(urllib.parse.quote(sys.stdin.read(), safe=''))
") || {
    echo "Error: Failed to URL-encode password." >&2
    exit 1
}
export DATABASE_URL_PRODUCTION="mysql+pymysql://${DB_USER}:${DB_PASSWORD_ENCODED}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# パスワード変数をクリア（DATABASE_URL 構築済みの変数残存防止）
unset DB_PASSWORD
unset DB_PASSWORD_ENCODED

# --- 起動 ---
# CMD のデフォルト引数（gunicorn ...）が "$@" に渡される
# デバッグ時は `docker run --entrypoint /bin/sh image` でシェル起動可能
if [ $# -eq 0 ]; then
    echo "Error: No command provided. Check CMD in Dockerfile." >&2
    exit 1
fi
exec "$@"
