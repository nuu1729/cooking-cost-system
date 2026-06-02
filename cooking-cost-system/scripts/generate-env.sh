#!/bin/bash
# 本番環境変数ファイル（.env.production）の生成・ローテーションスクリプト
# 使用法:
#   bash generate-env.sh            # 新規生成
#   bash generate-env.sh --rotate   # シークレットのみ再生成

set -euo pipefail

# ────────────────────────────────────────────
# 定数
# ────────────────────────────────────────────
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_DIR="${SCRIPT_DIR}/.."
readonly ENV_FILE="${PROJECT_DIR}/backend/.env.production"
readonly ENV_EXAMPLE="${PROJECT_DIR}/backend/.env.example"

# ────────────────────────────────────────────
# ログ
# ────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
log_info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ────────────────────────────────────────────
# ユーティリティ
# ────────────────────────────────────────────
generate_secret() {
    python3 -c "import secrets; print(secrets.token_urlsafe(32))"
}

check_prerequisites() {
    if ! command -v python3 &>/dev/null; then
        log_error "python3 が必要です"
        exit 1
    fi
}

# ────────────────────────────────────────────
# 既存 .env.production の検証
# ────────────────────────────────────────────
validate_env_file() {  # 引数なし: 呼び出し前に source 済みの変数を直接参照する
    local required_keys=(FLASK_ENV PORT DATABASE_URL_PRODUCTION JWT_SECRET SECRET_KEY CORS_ORIGIN)
    local missing=()

    # --validate モードでは呼び出し前に source 済みのため、変数を直接確認する
    for key in "${required_keys[@]}"; do
        local value="${!key:-}"
        if [[ -z "${value}" || "${value}" == "your-"* || "${value}" == "<"*">" ]]; then
            missing+=("${key}")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        log_warn "以下の必須キーが未設定またはプレースホルダーのままです: ${missing[*]}"
        return 1
    fi

    log_info "すべての必須キーが設定されています"
    return 0
}

# ────────────────────────────────────────────
# 対話形式で入力を収集
# ────────────────────────────────────────────
prompt_values() {
    echo ""
    echo "本番環境の設定を入力してください。"
    echo "（空のままEnterで .env.example のコメントを参照）"
    echo ""

    # CORS_ORIGIN
    read -r -p "CORS_ORIGIN（Cloudflare Pages のURL, 例: https://your-project.pages.dev）: " cors_origin
    if [[ -z "${cors_origin}" ]]; then
        cors_origin="https://your-project.pages.dev"
        log_warn "CORS_ORIGIN が未入力です。後から ${ENV_FILE} を編集してください。"
    fi

    # DATABASE_URL_PRODUCTION
    read -r -p "DB ホスト（Docker Composeサービス名 or IP, デフォルト: database）: " db_host
    db_host="${db_host:-database}"

    read -r -p "DB ユーザー名（デフォルト: cooking_user）: " db_user
    db_user="${db_user:-cooking_user}"

    read -r -p "DB 名（デフォルト: cooking_cost_system）: " db_name
    db_name="${db_name:-cooking_cost_system}"

    echo ""
}

# ────────────────────────────────────────────
# .env.production 生成
# ────────────────────────────────────────────
generate_env() {
    prompt_values

    local jwt_secret secret_key db_password
    jwt_secret="$(generate_secret)"
    secret_key="$(generate_secret)"
    db_password="$(generate_secret)"

    log_info "シークレットを生成しました"

    cat > "${ENV_FILE}" <<ENV_HEADER
# 本番環境変数 - generate-env.sh で生成 ($(date '+%Y-%m-%d %H:%M:%S'))
# ⚠️  このファイルを Git にコミットしないこと（.gitignore で除外済み）
FLASK_ENV=production
PORT=3001
ENV_HEADER

    {
        printf "DATABASE_URL_PRODUCTION=mysql+pymysql://%s:%s@%s:3306/%s\n" \
            "${db_user}" "${db_password}" "${db_host}" "${db_name}"
        printf "JWT_SECRET=%s\n"   "${jwt_secret}"
        printf "SECRET_KEY=%s\n"   "${secret_key}"
        printf "CORS_ORIGIN=%s\n"  "${cors_origin}"
    } >> "${ENV_FILE}"

    chmod 600 "${ENV_FILE}"
    log_info ".env.production を生成しました: ${ENV_FILE}"

    # DB パスワードを一時ファイルに書き出す（画面・ログに残さないため）
    local password_file="${PROJECT_DIR}/.db_password_temp"
    printf '%s\n' "${db_password}" > "${password_file}"
    chmod 600 "${password_file}"
    unset db_password

    log_warn "DB パスワードを一時ファイルに保存しました: ${password_file}"
    log_warn "MySQL 側に同じパスワードを設定後、以下のコマンドで削除してください:"
    echo "  rm -f ${password_file}"
}

# ────────────────────────────────────────────
# シークレットのみローテーション
# ────────────────────────────────────────────
rotate_secrets() {
    if [ ! -f "${ENV_FILE}" ]; then
        log_error "${ENV_FILE} が存在しません。先に generate-env.sh を実行してください。"
        exit 1
    fi

    log_warn "以下のシークレットを再生成します: JWT_SECRET, SECRET_KEY"
    read -r -p "続行しますか? [y/N]: " confirm
    [[ "${confirm}" == "y" || "${confirm}" == "Y" ]] || { log_info "キャンセルしました"; exit 0; }

    # 既存の値を保持してからファイル全体を再生成（sed インジェクション回避）
    # shellcheck disable=SC1090
    set -a; source "${ENV_FILE}"; set +a
    local current_db="${DATABASE_URL_PRODUCTION}"
    local current_cors="${CORS_ORIGIN}"
    local current_port="${PORT:-3001}"

    {
        printf "# 本番環境変数 - generate-env.sh --rotate で更新 (%s)\n" "$(date '+%Y-%m-%d %H:%M:%S')"
        printf "# ⚠️  このファイルを Git にコミットしないこと（.gitignore で除外済み）\n"
        printf "FLASK_ENV=production\n"
        printf "PORT=%s\n"                        "${current_port}"
        printf "DATABASE_URL_PRODUCTION=%s\n"     "${current_db}"
        printf "JWT_SECRET=%s\n"                  "$(generate_secret)"
        printf "SECRET_KEY=%s\n"                  "$(generate_secret)"
        printf "CORS_ORIGIN=%s\n"                 "${current_cors}"
    } > "${ENV_FILE}"
    chmod 600 "${ENV_FILE}"

    log_info "JWT_SECRET と SECRET_KEY をローテーションしました"
    log_warn "アプリを再起動して新しいシークレットを反映してください"
    log_warn "既存の JWT トークンはすべて無効化されます"
}

# ────────────────────────────────────────────
# エントリポイント
# ────────────────────────────────────────────
main() {
    check_prerequisites

    local mode="${1:-}"

    case "${mode}" in
        --rotate)
            log_info "シークレットローテーションモード"
            rotate_secrets
            ;;
        --validate)
            log_info "検証モード: ${ENV_FILE}"
            if [ ! -f "${ENV_FILE}" ]; then
                log_error "${ENV_FILE} が存在しません"
                exit 1
            fi
            # shellcheck disable=SC1090
            set -a; source "${ENV_FILE}"; set +a
            validate_env_file
            ;;
        "")
            if [ -f "${ENV_FILE}" ]; then
                log_warn "${ENV_FILE} は既に存在します"
                read -r -p "上書きしますか? [y/N]: " confirm
                [[ "${confirm}" == "y" || "${confirm}" == "Y" ]] || { log_info "キャンセルしました"; exit 0; }
            fi
            generate_env
            ;;
        *)
            echo "使用法: bash generate-env.sh [--rotate|--validate]"
            echo "  （引数なし） : .env.production を新規生成"
            echo "  --rotate    : JWT_SECRET / SECRET_KEY のみ再生成"
            echo "  --validate  : 必須キーの存在を確認"
            exit 1
            ;;
    esac
}

main "$@"
