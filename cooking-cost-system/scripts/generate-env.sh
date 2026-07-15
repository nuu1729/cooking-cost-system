#!/bin/bash
# Cloudflare Wrangler secrets（本番/staging）の生成・設定スクリプト
# JWT_SECRET / SECRET_KEY は自動生成、CF_D1_API_TOKEN / R2_ACCESS_KEY_ID /
# R2_SECRET_ACCESS_KEY は Cloudflare ダッシュボードで事前に発行したものを入力する。
#
# 使用法:
#   bash generate-env.sh --env staging              # 全 secrets を新規設定
#   bash generate-env.sh --env production
#   bash generate-env.sh --env staging --rotate     # JWT_SECRET/SECRET_KEY のみ再生成
#   bash generate-env.sh --help

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_DIR="${SCRIPT_DIR}/.."
readonly WRANGLER_CONFIG="${PROJECT_DIR}/wrangler.toml"

declare -ri SECRET_LENGTH=32  # 32バイトのランダム性（base64url エンコード後は約43文字）

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
log_info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

show_usage() {
    echo "使用法: bash generate-env.sh --env <staging|production> [オプション]"
    echo ""
    echo "オプション:"
    echo "  --env <name>  : 対象環境（staging または production）。必須。"
    echo "  --rotate      : JWT_SECRET / SECRET_KEY のみ再生成（他の secrets は変更しない）"
    echo "  --help, -h    : このヘルプを表示"
    echo ""
    echo "設定する secrets（wrangler secret put --env <name> で登録）:"
    echo "  自動生成: JWT_SECRET, SECRET_KEY"
    echo "  手動入力: CF_D1_API_TOKEN, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY"
    echo "            （事前に dash.cloudflare.com で発行しておくこと）"
}

check_prerequisites() {
    command -v npx >/dev/null 2>&1 || { log_error "npx（Node.js）が必要です"; exit 1; }
    command -v python3 >/dev/null 2>&1 || { log_error "python3 が必要です"; exit 1; }
    [[ -f "${WRANGLER_CONFIG}" ]] || { log_error "wrangler.toml が見つかりません: ${WRANGLER_CONFIG}"; exit 1; }
}

# URL-safe base64 のシークレットキーを生成（${SECRET_LENGTH} バイト）
generate_secret() {
    local secret
    secret="$(python3 -c "import secrets; print(secrets.token_urlsafe(${SECRET_LENGTH}))")" \
        || { log_error "シークレット生成に失敗しました"; exit 1; }
    [[ -n "${secret}" ]] || { log_error "シークレットが空です"; exit 1; }
    echo "${secret}"
}

# 値を引数ではなく stdin 経由で渡す（引数はプロセスリストに表示され漏洩リスクがあるため）
put_secret() {
    # $1: シークレット名  $2: 値  $3: 環境名
    printf '%s' "$2" | npx wrangler secret put "$1" --env "$3" --config "${WRANGLER_CONFIG}"
}

put_secret_prompt() {
    # $1: シークレット名  $2: 環境名  $3: プロンプトメッセージ
    local value
    read -r -s -p "$3: " value
    echo ""
    [[ -n "${value}" ]] || { log_error "$1 は空にできません"; exit 1; }
    put_secret "$1" "${value}" "$2"
}

main() {
    check_prerequisites

    local env_name="" rotate_only=false
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --env) env_name="${2:-}"; shift 2 ;;
            --rotate) rotate_only=true; shift ;;
            --help|-h) show_usage; exit 0 ;;
            *) log_error "不明なオプション: $1"; show_usage; exit 1 ;;
        esac
    done

    case "${env_name}" in
        staging|production) ;;
        *) log_error "--env staging または --env production を指定してください"; show_usage; exit 1 ;;
    esac

    log_info "JWT_SECRET / SECRET_KEY を生成して ${env_name} に設定します"
    put_secret JWT_SECRET "$(generate_secret)" "${env_name}"
    put_secret SECRET_KEY "$(generate_secret)" "${env_name}"

    if [[ "${rotate_only}" == "true" ]]; then
        log_info "ローテーション完了。既存の JWT トークンはすべて無効化されます。"
        log_warn "Worker を再デプロイして反映してください: npx wrangler deploy --env ${env_name}"
        exit 0
    fi

    log_info "続けて、Cloudflare ダッシュボードで事前発行済みのトークンを設定します"
    put_secret_prompt CF_D1_API_TOKEN "${env_name}" "CF_D1_API_TOKEN（D1:Edit 権限の Cloudflare API トークン）"
    put_secret_prompt R2_ACCESS_KEY_ID "${env_name}" "R2_ACCESS_KEY_ID"
    put_secret_prompt R2_SECRET_ACCESS_KEY "${env_name}" "R2_SECRET_ACCESS_KEY"

    log_info "すべての secrets を ${env_name} に設定しました"
    log_warn "Worker を再デプロイして反映してください: npx wrangler deploy --env ${env_name}"
}

main "$@"
