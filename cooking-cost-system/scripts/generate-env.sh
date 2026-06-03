#!/bin/bash
# 本番環境変数ファイル（.env.production）の生成・ローテーションスクリプト
# 使用法:
#   bash generate-env.sh            # 新規生成
#   bash generate-env.sh --rotate   # シークレットのみ再生成
#   bash generate-env.sh --validate # 必須キーの存在を確認
#   bash generate-env.sh --help     # ヘルプを表示

set -euo pipefail

# bash 4.0+ が必要（readonly -a / BASH_REMATCH 等を使用）
if [[ "${BASH_VERSINFO[0]}" -lt 4 ]]; then
    echo "Error: bash 4.0 以上が必要です（現在: ${BASH_VERSION}）" >&2
    echo "macOS の場合: brew install bash" >&2
    exit 1
fi

# ────────────────────────────────────────────
# 定数
# ────────────────────────────────────────────
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_DIR="${SCRIPT_DIR}/.."
readonly ENV_FILE="${PROJECT_DIR}/backend/.env.production"

# デフォルト値
readonly DEFAULT_DB_HOST="database"
readonly DEFAULT_DB_USER="cooking_user"
readonly DEFAULT_DB_NAME="cooking_cost_system"
declare -ri SECRET_LENGTH=32  # 整数型を明示・32バイトのランダム性（base64url エンコード後は約43文字）

# 許可する環境変数キー（parse_env_file での既知キー制限に使用）
readonly -a ALLOWED_ENV_KEYS=(FLASK_ENV PORT DATABASE_URL_PRODUCTION JWT_SECRET SECRET_KEY CORS_ORIGIN)

# グローバル変数（prompt_values → generate_env 間で共有）
declare db_password=""
declare db_host=""
declare db_user=""
declare db_name=""
declare cors_origin=""
declare password_file_path=""  # cleanup で削除するためパスを記録

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
# クリーンアップ（EXIT トラップ）
# ────────────────────────────────────────────
cleanup() {
    # password_file_path で個別管理した一時ファイルを削除
    [[ -n "${password_file_path}" ]] && rm -f "${password_file_path}" 2>/dev/null || true
}
trap cleanup EXIT

# ────────────────────────────────────────────
# ユーティリティ
# ────────────────────────────────────────────

show_usage() {
    echo "使用法: bash generate-env.sh [オプション]"
    echo ""
    echo "オプション:"
    echo "  （引数なし） : .env.production を新規生成（対話形式）"
    echo "  --rotate    : JWT_SECRET / SECRET_KEY のみ再生成"
    echo "  --validate  : 必須キーの存在・形式を確認"
    echo "  --help, -h  : このヘルプを表示"
}

# URL-safe base64 のシークレットキーを生成（${SECRET_LENGTH} バイト）
generate_secret() {
    local secret
    secret="$(python3 -c "import secrets; print(secrets.token_urlsafe(${SECRET_LENGTH}))")" \
        || { log_error "シークレット生成に失敗しました"; exit 1; }
    [[ -n "${secret}" ]] || { log_error "シークレットが空です"; exit 1; }
    # token_urlsafe(32) は少なくとも 43 文字を返す
    [[ ${#secret} -ge 40 ]] || { log_error "シークレットが短すぎます（${#secret}文字）"; exit 1; }
    echo "${secret}"
}

check_prerequisites() {
    if ! command -v python3 &>/dev/null; then
        log_error "python3 が必要です"
        exit 1
    fi
}

# URL パーセントエンコード（手動入力パスワードに含まれる特殊文字を DATABASE_URL 用にエスケープ）
url_encode() {
    python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$1"
}

# source の代わりに安全なパーサーを使用（任意コード実行を防止）
# 既知のキー（ALLOWED_ENV_KEYS）のみを export する
parse_env_file() {
    local file="$1"
    # IFS= read で行全体を読み込み、= を最初の1つだけで分割する
    # → 値に = が含まれる場合（BASE64 等）も正しく処理できる
    while IFS= read -r line; do
        [[ -z "${line}" || "${line}" =~ ^[[:space:]]*# ]] && continue
        local key="${line%%=*}"
        local value="${line#*=}"
        key="${key#"${key%%[![:space:]]*}"}"  # key 前後の空白除去
        # 対称クォートのみ除去（if/elif で分離して BASH_REMATCH の曖昧さを回避）
        # [^\"]*・[^\']*: 非貪欲に対称クォート内のみ除去（不正な KEY="val"extra" 等はマッチしない）
        if [[ "${value}" =~ ^\"([^\"]*)\"$ ]]; then
            value="${BASH_REMATCH[1]}"
        elif [[ "${value}" =~ ^\'([^\']*)\'$ ]]; then
            value="${BASH_REMATCH[1]}"
        else
            value="${value#"${value%%[![:space:]]*}"}"  # value 前後の空白除去
            value="${value%"${value##*[![:space:]]}"}"
        fi
        local allowed=false
        for allowed_key in "${ALLOWED_ENV_KEYS[@]}"; do
            [[ "${key}" == "${allowed_key}" ]] && allowed=true && break
        done
        "${allowed}" && export "${key}=${value}"
    done < "${file}"
}

# ────────────────────────────────────────────
# CORS_ORIGIN の検証（カンマ区切り複数オリジン対応）
# ────────────────────────────────────────────
validate_cors_origins() {
    local origins="${1:-}"
    local IFS=','
    read -ra origin_array <<< "${origins}"
    for origin in "${origin_array[@]}"; do
        origin="${origin#"${origin%%[![:space:]]*}"}"
        origin="${origin%"${origin##*[![:space:]]}"}"
        if [[ "${origin}" != "https://"* ]]; then
            log_warn "不正なオリジン: '${origin}' （https:// で始まる必要があります）"
            return 1
        fi
        # プレースホルダー検知（大文字小文字を問わず https://your- または <...> を検知）
        local lower_origin="${origin,,}"
        if [[ "${lower_origin}" == "https://your-"* || "${lower_origin}" == *"<"*">"* ]]; then
            log_warn "プレースホルダーのオリジン: '${origin}'（実際のドメインに変更してください）"
            return 1
        fi
    done
    return 0
}

# DB名のバリデーション（英数字とアンダースコアのみ）
validate_db_name() {
    local name="$1"
    if [[ ! "${name}" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
        log_error "無効な DB 名: '${name}'（英数字とアンダースコアのみ使用可能）"
        return 1
    fi
    return 0
}

# DB ホスト名のバリデーション（英数字・ドット・ハイフン・アンダースコアのみ）
validate_db_host() {
    local host="$1"
    if [[ ! "${host}" =~ ^[a-zA-Z0-9._-]+$ ]]; then
        log_error "無効な DB ホスト名: '${host}'"
        return 1
    fi
    return 0
}

# DB ユーザー名のバリデーション（英数字とアンダースコアのみ）
validate_db_user() {
    local user="$1"
    if [[ ! "${user}" =~ ^[a-zA-Z0-9_]+$ ]]; then
        log_error "無効な DB ユーザー名: '${user}'"
        return 1
    fi
    return 0
}

# ────────────────────────────────────────────
# 既存 .env.production の検証
# ────────────────────────────────────────────

# 呼び出し前に parse_env_file 済みの変数を直接参照する（引数なし）
validate_env_file() {
    local required_keys=(FLASK_ENV PORT DATABASE_URL_PRODUCTION JWT_SECRET SECRET_KEY CORS_ORIGIN)
    local missing=()

    for key in "${required_keys[@]}"; do
        local value="${!key:-}"
        # *"<"*">"*: "your-" プレフィックス・URL 内の <placeholder> を統一して検知
        if [[ -z "${value}" || "${value}" == "your-"* || "${value}" == *"<"*">"* ]]; then
            missing+=("${key}")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        log_warn "以下の必須キーが未設定またはプレースホルダーのままです: ${missing[*]}"
        return 1
    fi

    # 本番環境では全オリジンが https:// であることを確認（プレースホルダー検知含む）
    if [[ "${FLASK_ENV:-}" == "production" ]]; then
        if ! validate_cors_origins "${CORS_ORIGIN:-}"; then
            log_warn "本番環境では CORS_ORIGIN の全オリジンが https:// である必要があります"
            return 1
        fi
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
    echo ""

    # CORS_ORIGIN（入力ループで形式・プレースホルダーを検証）
    while true; do
        read -r -p "CORS_ORIGIN（Cloudflare Pages のURL, 例: https://app.pages.dev）: " cors_origin
        if [[ -z "${cors_origin}" ]]; then
            log_error "CORS_ORIGIN は必須です。Ctrl+C で中断して後から ${ENV_FILE} を編集することもできます。"
        elif validate_cors_origins "${cors_origin}"; then
            break
        else
            log_error "https:// で始まる有効な URL を入力してください。"
        fi
    done

    # DATABASE_URL_PRODUCTION（CORS_ORIGIN と同様にループで再入力を促す）
    while true; do
        read -r -p "DB ホスト（デフォルト: ${DEFAULT_DB_HOST}）: " db_host
        db_host="${db_host:-${DEFAULT_DB_HOST}}"
        validate_db_host "${db_host}" && break
        log_error "再入力してください"
    done

    while true; do
        read -r -p "DB ユーザー名（デフォルト: ${DEFAULT_DB_USER}）: " db_user
        db_user="${db_user:-${DEFAULT_DB_USER}}"
        validate_db_user "${db_user}" && break
        log_error "再入力してください"
    done

    while true; do
        read -r -p "DB 名（デフォルト: ${DEFAULT_DB_NAME}）: " db_name
        db_name="${db_name:-${DEFAULT_DB_NAME}}"
        validate_db_name "${db_name}" && break
        log_error "再入力してください"
    done

    # DB パスワード: 既存パスワードを入力するか自動生成かを選択（グローバル変数に格納）
    # ※ 手動入力する場合、@ / : / / などの URL 特殊文字はパーセントエンコードが必要
    #    （例: p@ss → p%40ss）。自動生成（token_urlsafe）は URL 安全な文字のみ使用
    read -r -s -p "DB パスワード（空 Enter で自動生成）: " db_password
    echo ""
    if [[ -z "${db_password}" ]]; then
        db_password="$(generate_secret)"
        log_warn "DB パスワードを自動生成しました。MySQL 側にも同じパスワードを設定してください。"
    else
        log_info "入力したパスワードを使用します。"
    fi

    echo ""
}

# ────────────────────────────────────────────
# .env.production 生成（アトミックな一括書き込み）
# ────────────────────────────────────────────
generate_env() {
    prompt_values

    local jwt_secret secret_key
    jwt_secret="$(generate_secret)"
    secret_key="$(generate_secret)"

    log_info "シークレットを生成しました"

    # 一時ファイル経由でアトミックに書き込む（chmod → mv で隙間なく保護）
    local tmp_env
    tmp_env="$(mktemp "${ENV_FILE}.XXXXXX")"
    chmod 600 "${tmp_env}"
    {
        printf "# 本番環境変数 - generate-env.sh で生成 (%s)\n" "$(date '+%Y-%m-%d %H:%M:%S')"
        printf "# ⚠️  このファイルを Git にコミットしないこと（.gitignore で除外済み）\n"
        printf "FLASK_ENV=production\n"
        printf "PORT=3001\n"
        # 手動入力パスワードの特殊文字（@/:/ 等）を URL エンコード
        local db_password_encoded
        db_password_encoded="$(url_encode "${db_password}")"
        printf "DATABASE_URL_PRODUCTION=mysql+pymysql://%s:%s@%s:3306/%s\n" \
            "${db_user}" "${db_password_encoded}" "${db_host}" "${db_name}"
        printf "JWT_SECRET=%s\n"  "${jwt_secret}"
        printf "SECRET_KEY=%s\n"  "${secret_key}"
        printf "CORS_ORIGIN=%s\n" "${cors_origin}"
    } > "${tmp_env}"
    mv "${tmp_env}" "${ENV_FILE}"
    log_info ".env.production を生成しました: ${ENV_FILE}"

    # DB パスワードを mktemp で作成した一時ファイルに書き出す（固定名の競合を防止）
    local password_file
    # /dev/shm (RAM ファイルシステム) を優先してディスクへの書き込みを回避
    if [[ -d /dev/shm ]]; then
        password_file="$(mktemp /dev/shm/.db_password_XXXXXX)"
    else
        password_file="$(mktemp)"
    fi
    password_file_path="${password_file}"  # cleanup で確実に削除するためグローバルに記録
    printf '%s\n' "${db_password}" > "${password_file}"
    chmod 600 "${password_file}"
    db_password=""  # Bash グローバル変数を空文字で上書き（プロセスメモリ上に残る可能性は bash の限界）

    log_warn "DB パスワードを一時ファイルに保存しました: ${password_file}"
    log_warn "MySQL 側に同じパスワードを設定してください。"
    echo ""
    read -r -p "MySQL へのパスワード設定が完了したら Enter を押してください（その後ファイルを削除します）: "
    rm -f "${password_file}"
    password_file_path=""
    log_info "一時ファイルを削除しました"
}

# ────────────────────────────────────────────
# シークレットのみローテーション
# ────────────────────────────────────────────
rotate_secrets() {
    if [ ! -f "${ENV_FILE}" ]; then
        log_error "${ENV_FILE} が存在しません。先に generate-env.sh を実行してください。"
        exit 1
    fi

    # NOTE: --rotate は JWT_SECRET と SECRET_KEY のみ対象。
    #       DB パスワードのローテーションは DATABASE_URL_PRODUCTION を手動更新すること。
    log_warn "以下のシークレットを再生成します: JWT_SECRET, SECRET_KEY"
    log_warn "（DB パスワードはローテーション対象外。変更する場合は ${ENV_FILE} を直接編集してください）"
    read -r -p "続行しますか? [y/N]: " confirm
    [[ "${confirm}" == "y" || "${confirm}" == "Y" ]] || { log_info "キャンセルしました"; exit 0; }

    # ローテーション前にバックアップを作成（失敗時に既存シークレットを復元可能にする）
    local backup="${ENV_FILE}.backup.$(date +%Y%m%d%H%M%S)"
    cp "${ENV_FILE}" "${backup}"
    chmod 600 "${backup}"
    log_info "バックアップを作成しました: ${backup}"

    # 安全なパーサーで既存値を読み込む（source によるコード実行リスクを回避）
    parse_env_file "${ENV_FILE}"  # 1回目: 既存の DB・CORS・PORT 値を取得
    local current_db="${DATABASE_URL_PRODUCTION:-}"
    if [[ -z "${current_db}" ]]; then
        log_error "既存の DATABASE_URL_PRODUCTION が読み取れませんでした"
        exit 1
    fi
    local current_cors="${CORS_ORIGIN}"
    local current_port="${PORT:-3001}"

    local tmp_env
    tmp_env="$(mktemp "${ENV_FILE}.XXXXXX")"
    chmod 600 "${tmp_env}"
    {
        printf "# 本番環境変数 - generate-env.sh --rotate で更新 (%s)\n" "$(date '+%Y-%m-%d %H:%M:%S')"
        printf "# ⚠️  このファイルを Git にコミットしないこと（.gitignore で除外済み）\n"
        printf "FLASK_ENV=production\n"
        printf "PORT=%s\n"                    "${current_port}"
        printf "DATABASE_URL_PRODUCTION=%s\n" "${current_db}"
        printf "JWT_SECRET=%s\n"              "$(generate_secret)"
        printf "SECRET_KEY=%s\n"              "$(generate_secret)"
        printf "CORS_ORIGIN=%s\n"             "${current_cors}"
    } > "${tmp_env}"
    mv "${tmp_env}" "${ENV_FILE}"

    log_info "JWT_SECRET と SECRET_KEY をローテーションしました"

    # 2回目: ローテーション後の新ファイルを読み込み直し整合性を確認（1回目とは別ファイル内容）
    parse_env_file "${ENV_FILE}"
    if ! validate_env_file; then
        log_error "ローテーション後の検証に失敗しました"
        exit 1
    fi

    log_warn "アプリを再起動して新しいシークレットを反映してください"
    log_warn "既存の JWT トークンはすべて無効化されます"
}

# ────────────────────────────────────────────
# エントリポイント
# ────────────────────────────────────────────
main() {
    check_prerequisites

    # 引数は最大1つ
    [[ $# -gt 1 ]] && { log_error "引数は1つまでです"; show_usage; exit 1; }

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
            parse_env_file "${ENV_FILE}"
            if ! validate_env_file; then
                exit 1
            fi
            ;;
        "")
            if [ -f "${ENV_FILE}" ]; then
                log_warn "${ENV_FILE} は既に存在します"
                read -r -p "上書きしますか? [y/N]: " confirm
                [[ "${confirm}" == "y" || "${confirm}" == "Y" ]] || { log_info "キャンセルしました"; exit 0; }
                local backup="${ENV_FILE}.backup.$(date +%Y%m%d%H%M%S)"
                cp "${ENV_FILE}" "${backup}"
                chmod 600 "${backup}"
                log_info "既存ファイルをバックアップしました: ${backup}"
            fi
            generate_env
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        *)
            log_error "不明なオプション: ${mode}"
            show_usage
            exit 1
            ;;
    esac
}

main "$@"
