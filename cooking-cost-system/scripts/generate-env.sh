#!/bin/bash
# 本番環境変数ファイル（.env.production）の生成・ローテーションスクリプト
# 使用法:
#   bash generate-env.sh            # 新規生成
#   bash generate-env.sh --rotate   # シークレットのみ再生成
#   bash generate-env.sh --validate # 必須キーの存在を確認
#   bash generate-env.sh --help     # ヘルプを表示

set -euo pipefail

# bash 4.2+ が必要（declare -g は 4.2 から対応 / readonly -a / BASH_REMATCH 等を使用）
if [[ "${BASH_VERSINFO[0]}" -lt 4 || ( "${BASH_VERSINFO[0]}" -eq 4 && "${BASH_VERSINFO[1]}" -lt 2 ) ]]; then
    echo "Error: bash 4.2 以上が必要です（現在: ${BASH_VERSION}）" >&2
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
# DATABASE_URL（開発用）は意図的に除外。このスクリプトは本番用 .env.production のみを対象とする。
# 開発環境の .env に対して --validate を実行した場合、DATABASE_URL はサイレントに無視される（仕様）。
readonly -a ALLOWED_ENV_KEYS=(FLASK_ENV PORT DATABASE_URL_PRODUCTION JWT_SECRET SECRET_KEY CORS_ORIGIN)

# グローバル変数（prompt_values → generate_env 間で共有）
# 連想配列でまとめて管理することで名前空間を整理
declare -A config=(
    [db_password]=""
    [db_host]=""
    [db_user]=""
    [db_name]=""
    [cors_origin]=""
)
declare password_file_path=""  # cleanup で削除するためパスを記録
declare tmp_env_path=""        # generate_env/rotate_secrets の一時ファイルを cleanup で確実に削除

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
    # generate_env / rotate_secrets の途中失敗時に tmp_env が残存しないよう削除
    [[ -n "${tmp_env_path}" ]] && rm -f "${tmp_env_path}" 2>/dev/null || true
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
    # token_urlsafe(32) は実際には43文字生成するが整数除算（32*4/3=42）で1文字分の余裕がなくなるため
    # SECRET_LENGTH * 4/3 - 2 を保守的下限として使用（将来の Python 実装変更にも対応）
    local min_length=$(( SECRET_LENGTH * 4 / 3 - 2 ))
    [[ ${#secret} -ge ${min_length} ]] || { log_error "シークレットが短すぎます（${#secret}文字）"; exit 1; }
    echo "${secret}"
}

check_prerequisites() {
    if ! command -v python3 &>/dev/null; then
        log_error "python3 が必要です"
        exit 1
    fi
    # jq は claude-review.yml（CI）で使用するが、このスクリプト自体は不要。
    # 将来 jq を使う拡張をする場合はここに追加すること。
}

# URL パーセントエンコード（手動入力パスワードに含まれる特殊文字を DATABASE_URL 用にエスケープ）
# 引数ではなく stdin から受け取る（引数はプロセスリストに表示され漏洩リスクがある）
# 呼び出し方: printf '%s' "${password}" | url_encode
url_encode() {
    python3 -c "
import urllib.parse, sys
# splitlines() で末尾・埋め込み改行（コピペ等）をすべて除去してからエンコード
raw = sys.stdin.read()
print(urllib.parse.quote(''.join(raw.splitlines()), safe=''))
"
}

# source の代わりに安全なパーサーを使用（任意コード実行を防止）
# 既知のキー（ALLOWED_ENV_KEYS）のみを declare -g で設定する
# （export は子プロセスに環境変数が漏洩するため使用しない）
parse_env_file() {
    local file="$1"
    # IFS= read で行全体を読み込み、= を最初の1つだけで分割する
    # → 値に = が含まれる場合（BASE64 等）も正しく処理できる
    while IFS= read -r line; do
        [[ -z "${line}" || "${line}" =~ ^[[:space:]]*# ]] && continue
        local key="${line%%=*}"
        local value="${line#*=}"
        key="${key#"${key%%[![:space:]]*}"}"  # key 前後の空白除去
        # 不正なキー名（空文字・config[x] のような配列参照・記号含む）はスキップして変数汚染を防ぐ
        [[ "${key}" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]] || continue
        # 対称クォートのみ除去（if/elif で分離して BASH_REMATCH の曖昧さを回避）
        # [^\"]*・[^\']*: 非貪欲に対称クォート内のみ除去（不正な KEY="val"extra" 等はマッチしない）
        # 注意: クォートあり（KEY=" value "）の場合は内側の空白を保持する（意図的）
        # BASE64 等の = 含む値:
        #   KEY=abc==     → key=KEY, value=abc==           ✅（clamp なし）
        #   KEY="abc=="   → BASH_REMATCH[1] で abc== を取得 ✅
        #   KEY='abc=='   → 同様                            ✅
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
        [[ "${allowed}" == "true" ]] && declare -g "${key}=${value}"
    done < "${file}"
}

# ────────────────────────────────────────────
# CORS_ORIGIN の検証（カンマ区切り複数オリジン対応）
# ────────────────────────────────────────────
validate_cors_origins() {
    local origins="${1:-}"
    [[ -z "${origins}" ]] && { log_warn "CORS_ORIGIN が設定されていません"; return 1; }
    IFS=',' read -ra origin_array <<< "${origins}"
    for origin in "${origin_array[@]}"; do
        origin="${origin#"${origin%%[![:space:]]*}"}"
        origin="${origin%"${origin##*[![:space:]]}"}"
        if [[ "${origin}" != "https://"* ]]; then
            log_warn "不正なオリジン: '${origin}' （https:// で始まる必要があります）"
            return 1
        fi
        # プレースホルダー検知（大文字小文字を問わず https://your* または <...> を検知）
        # "your-" だけでなく "yourdomain.com" のような形式も含めて検知するため "your" の前方一致にする
        local lower_origin="${origin,,}"
        if [[ "${lower_origin}" == "https://your"* || "${lower_origin}" == *"<"*">"* ]]; then
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
    # ALLOWED_ENV_KEYS を流用（2箇所での重複管理を避ける）
    local required_keys=("${ALLOWED_ENV_KEYS[@]}")
    local missing=()

    for key in "${required_keys[@]}"; do
        local value="${!key:-}"
        # プレースホルダーパターンを大文字小文字を問わず検知
        # - "your"*: your-xxx / yourdomain.com / Your-xxx 等（前方一致）
        # - *"replace"*: your-jwt-secret-replace-with-random-string 等
        # - *"<"*">"*: <user> / <password> 等の山括弧プレースホルダー
        local lower_value="${value,,}"
        if [[ -z "${value}" \
            || "${lower_value}" == "your"* \
            || "${lower_value}" == *"replace"* \
            || "${value}" == *"<"*">"* ]]; then
            missing+=("${key}")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        log_warn "以下の必須キーが未設定またはプレースホルダーのままです: ${missing[*]}"
        return 1
    fi

    # このスクリプトは .env.production 専用のため FLASK_ENV の値によらず常に CORS を検証する
    # （FLASK_ENV が誤設定されていても検証をスキップしないようにする）
    if ! validate_cors_origins "${CORS_ORIGIN:-}"; then
        log_warn "CORS_ORIGIN の全オリジンが https:// である必要があります"
        return 1
    fi

    log_info "すべての必須キーが設定されています"
    return 0
}

# ────────────────────────────────────────────
# 対話形式で入力を収集
# ────────────────────────────────────────────
prompt_values() {
    local db_password_confirm  # ループ前に宣言（ループ内 local は常に 0 を返すため混乱を避ける）
    echo ""
    echo "本番環境の設定を入力してください。"
    echo ""

    # CORS_ORIGIN（入力ループで形式・プレースホルダーを検証）
    while true; do
        read -r -p "CORS_ORIGIN（Cloudflare Pages のURL, 例: https://app.pages.dev）: " config[cors_origin]
        if [[ -z "${config[cors_origin]}" ]]; then
            log_error "CORS_ORIGIN は必須です。Ctrl+C で中断して後から ${ENV_FILE} を編集することもできます。"
        elif validate_cors_origins "${config[cors_origin]}"; then
            break
        else
            log_error "https:// で始まる有効な URL を入力してください。"
        fi
    done

    # DATABASE_URL_PRODUCTION（CORS_ORIGIN と同様にループで再入力を促す）
    while true; do
        read -r -p "DB ホスト（デフォルト: ${DEFAULT_DB_HOST}）: " config[db_host]
        config[db_host]="${config[db_host]:-${DEFAULT_DB_HOST}}"
        validate_db_host "${config[db_host]}" && break
        log_error "再入力してください"
    done

    while true; do
        read -r -p "DB ユーザー名（デフォルト: ${DEFAULT_DB_USER}）: " config[db_user]
        config[db_user]="${config[db_user]:-${DEFAULT_DB_USER}}"
        validate_db_user "${config[db_user]}" && break
        log_error "再入力してください"
    done

    while true; do
        read -r -p "DB 名（デフォルト: ${DEFAULT_DB_NAME}）: " config[db_name]
        config[db_name]="${config[db_name]:-${DEFAULT_DB_NAME}}"
        validate_db_name "${config[db_name]}" && break
        log_error "再入力してください"
    done

    # DB パスワード: 既存パスワードを入力するか自動生成かを選択
    # ※ 手動入力する場合、@ / : などの URL 特殊文字はパーセントエンコードが必要
    #    （例: p@ss → p%40ss）。自動生成（token_urlsafe）は URL 安全な文字のみ使用
    while true; do
        read -r -s -p "DB パスワード（空 Enter で自動生成）: " config[db_password]
        echo ""
        if [[ -z "${config[db_password]}" ]]; then
            config[db_password]="$(generate_secret)"
            log_warn "DB パスワードを自動生成しました。MySQL 側にも同じパスワードを設定してください。"
            break
        fi
        read -r -s -p "DB パスワード（確認）: " db_password_confirm
        echo ""
        if [[ "${config[db_password]}" == "${db_password_confirm}" ]]; then
            log_info "入力したパスワードを使用します。"
            break
        fi
        log_error "パスワードが一致しません。再入力してください。"
    done

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
    # tmp_env_path にグローバル登録して cleanup トラップで確実に削除（途中失敗時の残存を防ぐ）
    local tmp_env
    tmp_env="$(mktemp "${ENV_FILE}.XXXXXX")"
    tmp_env_path="${tmp_env}"
    chmod 600 "${tmp_env}"
    {
        printf "# 本番環境変数 - generate-env.sh で生成 (%s)\n" "$(date '+%Y-%m-%d %H:%M:%S')"
        printf "# ⚠️  このファイルを Git にコミットしないこと（.gitignore で除外済み）\n"
        printf "FLASK_ENV=production\n"
        printf "PORT=3001\n"
        # 手動入力パスワードの特殊文字（@/:/ 等）を URL エンコード
        local db_password_encoded
        db_password_encoded="$(printf '%s' "${config[db_password]}" | url_encode)"
        printf "DATABASE_URL_PRODUCTION=mysql+pymysql://%s:%s@%s:3306/%s\n" \
            "${config[db_user]}" "${db_password_encoded}" "${config[db_host]}" "${config[db_name]}"
        printf "JWT_SECRET=%s\n"  "${jwt_secret}"
        printf "SECRET_KEY=%s\n"  "${secret_key}"
        printf "CORS_ORIGIN=%s\n" "${config[cors_origin]}"
    } > "${tmp_env}"
    mv "${tmp_env}" "${ENV_FILE}"
    tmp_env_path=""  # mv 成功後は cleanup 対象から外す
    log_info ".env.production を生成しました: ${ENV_FILE}"

    # DB パスワードを mktemp で作成した一時ファイルに書き出す（固定名の競合を防止）
    local password_file
    # /dev/shm (RAM ファイルシステム) を優先してディスクへの書き込みを回避
    # mktemp のランダムサフィックス（XXXXXX）により他ユーザーからのシンボリックリンクアタックを防止
    if [[ -d /dev/shm ]]; then
        password_file="$(mktemp /dev/shm/.db_password_XXXXXX)"
    else
        password_file="$(mktemp)"
    fi
    password_file_path="${password_file}"  # cleanup で確実に削除するためグローバルに記録
    printf '%s\n' "${config[db_password]}" > "${password_file}"
    chmod 600 "${password_file}"
    # config[db_password] を連想配列から削除（空文字代入より確実にエントリを除去）
    # db_password_encoded はローカル変数のため関数終了時に自動破棄される（unset 不要）
    # 注意: jwt_secret・secret_key も同様にローカル変数のため bash 側に委ねている
    unset 'config[db_password]'

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

    # ローテーション前にバックアップを作成（ローテーション中の失敗時のみ復元用途）
    # ローテーション成功後は旧シークレットが平文で残存しないよう即削除する（下部参照）
    # ※ バックアップは generate_env 時と同じパターン（.backup.YYYYMMDDHHmmSS）を使用するため
    #    main() 内の世代管理グロブと混在することがある（設計上許容済み）
    local backup="${ENV_FILE}.backup.$(date +%Y%m%d%H%M%S)"
    cp "${ENV_FILE}" "${backup}"
    chmod 600 "${backup}"
    log_info "バックアップを作成しました（ローテーション失敗時の復元用）: ${backup}"

    # 安全なパーサーで既存値を読み込む（source によるコード実行リスクを回避）
    parse_env_file "${ENV_FILE}"  # 1回目: 既存の DB・CORS・PORT 値を取得
    local current_db="${DATABASE_URL_PRODUCTION:-}"
    if [[ -z "${current_db}" ]]; then
        log_error "既存の DATABASE_URL_PRODUCTION が読み取れませんでした"
        exit 1
    fi
    local current_cors="${CORS_ORIGIN:-}"
    if [[ -z "${current_cors}" ]]; then
        log_error "既存の CORS_ORIGIN が読み取れませんでした"
        exit 1
    fi
    local current_port="${PORT:-3001}"

    # tmp_env_path にグローバル登録して cleanup トラップで確実に削除
    local tmp_env
    tmp_env="$(mktemp "${ENV_FILE}.XXXXXX")"
    tmp_env_path="${tmp_env}"
    chmod 600 "${tmp_env}"
    # シークレットを事前生成してから書き込む（途中で失敗してもファイルが壊れない）
    local new_jwt new_secret_key
    new_jwt="$(generate_secret)"
    new_secret_key="$(generate_secret)"
    # FLASK_ENV は既存ファイルから引き継ぐ（開発環境で --rotate した際に production に上書きされるのを防ぐ）
    local current_flask_env="${FLASK_ENV:-production}"
    {
        printf "# 本番環境変数 - generate-env.sh --rotate で更新 (%s)\n" "$(date '+%Y-%m-%d %H:%M:%S')"
        printf "# ⚠️  このファイルを Git にコミットしないこと（.gitignore で除外済み）\n"
        printf "FLASK_ENV=%s\n"               "${current_flask_env}"
        printf "PORT=%s\n"                    "${current_port}"
        printf "DATABASE_URL_PRODUCTION=%s\n" "${current_db}"
        printf "JWT_SECRET=%s\n"              "${new_jwt}"
        printf "SECRET_KEY=%s\n"              "${new_secret_key}"
        printf "CORS_ORIGIN=%s\n"             "${current_cors}"
    } > "${tmp_env}"
    mv "${tmp_env}" "${ENV_FILE}"
    tmp_env_path=""  # mv 成功後は cleanup 対象から外す

    log_info "JWT_SECRET と SECRET_KEY をローテーションしました"

    # 2回目: ローテーション後の新ファイルを読み込み直し整合性を確認（1回目とは別ファイル内容）
    parse_env_file "${ENV_FILE}"
    if ! validate_env_file; then
        log_error "ローテーション後の検証に失敗しました"
        log_warn "バックアップから復元: cp -p ${backup} ${ENV_FILE}"
        exit 1
    fi

    # ローテーション成功 → バックアップには旧シークレットが平文で残るため安全削除
    # shred が使える環境ではディスク上のデータを上書きしてから削除（より安全）
    if command -v shred &>/dev/null; then
        shred -u "${backup}"
    else
        rm -f "${backup}"
    fi
    log_info "バックアップを削除しました（旧シークレット除去済み）"
    log_warn "ロールバックが必要な場合はバックアップが削除済みのため、新しいシークレットを手動で設定してください"

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
                # 直近3世代より古いバックアップを自動削除
                # rotate_secrets が作成するバックアップも同じパターンのため混在することがある（設計上許容済み）
                # find + mapfile で NUL 区切りを使いファイル名に空白・改行が含まれる場合も安全に処理
                mapfile -d '' _backups < <(
                    find "$(dirname "${ENV_FILE}")" -maxdepth 1 \
                        -name "$(basename "${ENV_FILE}").backup.*" \
                        -print0 | sort -z -r
                )
                for (( _i=3; _i<${#_backups[@]}; _i++ )); do
                    rm -f -- "${_backups[$_i]}"
                done
                unset _backups _i
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
