#!/bin/sh
# Docker secrets からパスワードを読み込み、DATABASE_URL_PRODUCTION を構築してから
# Gunicorn を起動する。引数でシークレットをプロセスに渡さないことで漏洩を防ぐ。
# pipefail は /bin/sh では非対応のため、パイプ内エラーは個別に確認する
# ⚠️ set -x をデバッグ目的で有効にしないこと。DB_PASSWORD 等の変数値がログに平文で出力される。
set -eu

# --- ヘルパー関数 ---
check_python3() {
    if ! command -v python3 > /dev/null 2>&1; then
        echo "Error: python3 not found. Required for URL encoding." >&2
        exit 1
    fi
}

read_secret() {
    # $1: シークレット名（/run/secrets/$1 を読み込む）
    # ファイルの存在・非空・先頭1行取得・末尾 whitespace 除去を一括で行い stdout に返す。
    # check_secret を廃止してこの関数に統合することで TOCTOU 競合状態を排除している。
    # NOTE: local は POSIX 非標準だが ash/dash/bash で広くサポートされている。
    #       python:3.11-slim の /bin/sh（dash）でも動作確認済み。
    local _name="$1" _val
    if [ ! -f "/run/secrets/${_name}" ]; then
        echo "Error: Docker secret '/run/secrets/${_name}' not found." >&2
        echo "  Check the 'secrets' section in docker-compose.prod.yml and secrets/*.txt files." >&2
        exit 1
    fi
    # 先頭1行のみ取得し末尾 whitespace・CRLF を除去する。
    # 複数行ファイルで内部改行が URL エンコード（%0A）されて接続失敗するのを防ぐ。
    # [ ! -s ] はバイト数チェックのため whitespace-only を通過させる。[ -n ] で補完する。
    _val=$(sed -n '1{s/[[:space:]]*$//;p}' "/run/secrets/${_name}") || {
        echo "Error: Failed to read ${_name} secret." >&2
        exit 1
    }
    [ -n "${_val}" ] || {
        echo "Error: ${_name} secret is empty or whitespace-only." >&2
        exit 1
    }
    printf '%s' "${_val}"
}

# --- 前提チェック ---
check_python3

# --- Docker secrets を読み込む ---
# DB_PASSWORD は意図的に export しない（DATABASE_URL_PRODUCTION 構築後に unset する）
DB_PASSWORD=$(read_secret mysql_password) || exit 1
JWT_SECRET=$(read_secret jwt_secret)      || exit 1
export JWT_SECRET
# NOTE: JWT_SECRET は環境変数として /proc/<pid>/environ から読み取り可能。
# 同一ホストの root または docker inspect 権限所持者がアクセスできる点に注意。
# Flask 側でファイルから直接読み込む方式への移行は issue #148 で追跡。

SECRET_KEY=$(read_secret secret_key) || exit 1
export SECRET_KEY

# --- DATABASE_URL_PRODUCTION を構築（パスワードを URL エンコード）---
# デフォルト値は docker-compose.prod.yml で管理する（entrypoint.sh 側は必須チェックのみ）
DB_HOST="${DB_HOST:?DB_HOST must be set}"
DB_USER="${DB_USER:?DB_USER must be set}"
DB_NAME="${DB_NAME:?DB_NAME must be set}"
DB_PORT="${DB_PORT:-3306}"
# DB_PORT のバリデーション: :-3306 の後なので空文字は到達しない。非数字・範囲外をチェック。
case "${DB_PORT}" in
    *[!0-9]*)
        echo "Error: DB_PORT must be a positive integer (got: '${DB_PORT}')" >&2
        exit 1
        ;;
esac
if [ "${DB_PORT}" -lt 1 ] || [ "${DB_PORT}" -gt 65535 ]; then
    echo "Error: DB_PORT must be between 1 and 65535 (got: ${DB_PORT})" >&2
    exit 1
fi

# NOTE: DATABASE_URL_PRODUCTION 自体にパスワードが含まれるため /proc/<pid>/environ の
#       漏洩リスクは残る（同一ホストの root または docker inspect 権限所持者がアクセス可能）。
#       unset は DB_PASSWORD / DB_PASSWORD_ENCODED の残存を防ぐためのもの。
#       根本的な解消は issue #148（Flask 側でファイルから直接読み込む）で対応予定。
# printf の失敗は通常発生しないが、pipefail 非対応のため python3 側のエラーのみ || で捕捉する。
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
