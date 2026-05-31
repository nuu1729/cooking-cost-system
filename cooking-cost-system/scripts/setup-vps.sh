#!/bin/bash
# Hetzner VPS (CAX11: ARM / 2vCPU / 4GB) 初期セットアップスクリプト
# 前提: Ubuntu 22.04 LTS, root で実行
# 使用法: bash setup-vps.sh <your-domain>
# 例:     bash setup-vps.sh api.example.com

set -euo pipefail

# セットアップログをファイルにも保存
exec > >(tee -a /var/log/vps-setup.log) 2>&1

# ────────────────────────────────────────────
# 定数
# ────────────────────────────────────────────
readonly APP_DIR="/opt/cooking-cost"
readonly REPO_URL="https://github.com/nuu1729/cooking-cost-system.git"
readonly DEPLOY_USER="deploy"
readonly APP_PORT=3001
readonly CADDY_KEYRING="/usr/share/keyrings/caddy-stable-archive-keyring.gpg"
readonly DOCKER_KEYRING="/etc/apt/keyrings/docker.gpg"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# fail2ban 設定値
readonly FAIL2BAN_MAXRETRY=3
readonly FAIL2BAN_BANTIME=3600
readonly FAIL2BAN_FINDTIME=600

# Caddy ログ設定値
readonly LOG_ROLL_SIZE="10mb"
readonly LOG_ROLL_KEEP=5

# ────────────────────────────────────────────
# ログ出力ユーティリティ
# ────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $(date '+%H:%M:%S') $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $(date '+%H:%M:%S') $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') $1"; }

cleanup() {
    local exit_code=$?
    log_error "セットアップ中にエラーが発生しました（終了コード: ${exit_code}）"
    log_error "ログを確認してください: journalctl -xe または /var/log/vps-setup.log"
}
trap cleanup ERR

# ────────────────────────────────────────────
# ユーティリティ関数
# ────────────────────────────────────────────
generate_secret() {
    python3 -c "import secrets; print(secrets.token_urlsafe(32))"
}

validate_domain() {
    local domain="$1"
    if ! [[ "${domain}" =~ ^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$ ]]; then
        log_error "無効なドメイン形式です: ${domain}"
        exit 1
    fi
    # DNS 解決チェック（VPS 設定直後は未設定の場合があるため warning のみ）
    if command -v host &>/dev/null && ! host "${domain}" &>/dev/null; then
        log_warn "DNS が解決できません: ${domain}（後から DNS レコードを設定する場合は問題ありません）"
    fi
}

# ────────────────────────────────────────────
# 引数・権限チェック
# ────────────────────────────────────────────
check_prerequisites() {
    if [[ $EUID -ne 0 ]]; then
        log_error "このスクリプトは root で実行してください（sudo bash setup-vps.sh <domain>）"
        exit 1
    fi

    if ! command -v python3 &>/dev/null; then
        log_error "python3 が必要です。apt-get install -y python3 を実行してから再試行してください"
        exit 1
    fi

    DOMAIN="${1:?使用法: bash setup-vps.sh <api-domain> (例: api.example.com)}"
    validate_domain "${DOMAIN}"
    readonly DOMAIN
}

# ────────────────────────────────────────────
# 1. システム初期化
# ────────────────────────────────────────────
setup_system() {
    log_info "[1/5] システム初期化..."
    install_base_packages
    configure_auto_updates
    create_deploy_user
    configure_sudoers
    setup_ssh
    setup_firewall
    setup_fail2ban
}

install_base_packages() {
    # システムパッケージのリストを更新（1回目: システム全体）
    apt-get update -q
    apt-get upgrade -y -q
    apt-get install -y -q \
        curl git ufw fail2ban unattended-upgrades python3 \
        debian-keyring debian-archive-keyring apt-transport-https \
        dnsutils lsb-release
    log_info "  -> 基本パッケージをインストールしました"
}

configure_auto_updates() {
    dpkg-reconfigure -f noninteractive unattended-upgrades
    log_info "  -> 自動セキュリティアップデートを有効化しました"
}

create_deploy_user() {
    if ! id "${DEPLOY_USER}" &>/dev/null; then
        useradd -m -s /bin/bash "${DEPLOY_USER}"
        usermod -aG sudo "${DEPLOY_USER}"
        log_info "  -> ${DEPLOY_USER} ユーザーを作成しました"
    else
        log_info "  -> ${DEPLOY_USER} ユーザーは既に存在します（スキップ）"
    fi
}

configure_sudoers() {
    # sudoers: Caddy 操作のみ root として実行に限定
    # docker は docker グループで対応するため sudo 不要
    cat > "/etc/sudoers.d/${DEPLOY_USER}" <<EOF
${DEPLOY_USER} ALL=(root) NOPASSWD: /bin/systemctl restart caddy
${DEPLOY_USER} ALL=(root) NOPASSWD: /bin/systemctl reload caddy
EOF
    chmod 440 "/etc/sudoers.d/${DEPLOY_USER}"
    log_info "  -> sudoers: Caddy 操作のみ root 権限で許可"
}

setup_ssh() {
    echo ""
    log_warn "========================================================"
    log_warn " SSH セキュリティ設定について"
    log_warn " root ログインとパスワード認証を無効化します。"
    log_warn " 続行前に以下を必ず確認してください:"
    log_warn "   1. ${DEPLOY_USER} ユーザーに SSH 公開鍵を登録済みである"
    log_warn "      mkdir -p /home/${DEPLOY_USER}/.ssh"
    log_warn "      echo '<your-pubkey>' >> /home/${DEPLOY_USER}/.ssh/authorized_keys"
    log_warn "      chmod 700 /home/${DEPLOY_USER}/.ssh"
    log_warn "      chmod 600 /home/${DEPLOY_USER}/.ssh/authorized_keys"
    log_warn "   2. 別ターミナルで SSH 鍵ログインが成功することを確認済みである"
    log_warn "========================================================"
    echo ""

    local confirm
    if ! read -r -t 60 -p "SSH 設定を変更しますか? [y/N]: " confirm; then
        log_warn "タイムアウト: SSH 設定の変更をスキップしました"
        return
    fi

    if [[ "${confirm}" == "y" || "${confirm}" == "Y" ]]; then
        sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
        sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
        systemctl reload sshd
        log_info "  -> SSH: root ログイン・パスワード認証を無効化しました"
    else
        log_warn "SSH 設定の変更をスキップしました。後から手動で設定してください。"
    fi
}

setup_firewall() {
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp   comment "SSH"
    ufw allow 80/tcp   comment "HTTP (Caddy ACME)"
    ufw allow 443/tcp  comment "HTTPS"
    ufw --force enable
    log_info "  -> UFW: 22/80/443 のみ許可"
}

setup_fail2ban() {
    cat > /etc/fail2ban/jail.local <<EOF
[sshd]
enabled  = true
port     = 22
filter   = sshd
logpath  = /var/log/auth.log
maxretry = ${FAIL2BAN_MAXRETRY}
bantime  = ${FAIL2BAN_BANTIME}
findtime = ${FAIL2BAN_FINDTIME}
EOF
    systemctl enable --now fail2ban
    log_info "  -> fail2ban: SSH 保護を有効化（${FAIL2BAN_MAXRETRY}回失敗で${FAIL2BAN_BANTIME}秒 BAN）"
}

# ────────────────────────────────────────────
# 2. Docker インストール（公式 APT リポジトリ方式）
# ────────────────────────────────────────────
install_docker() {
    log_info "[2/5] Docker インストール..."

    if ! command -v docker &>/dev/null; then
        # GPG キーリング（冪等性確保）
        install -m 0755 -d /etc/apt/keyrings
        if [ ! -f "${DOCKER_KEYRING}" ]; then
            curl -fsSL "https://download.docker.com/linux/ubuntu/gpg" \
                | gpg --dearmor -o "${DOCKER_KEYRING}"
            chmod a+r "${DOCKER_KEYRING}"
        fi

        # Docker APT リポジトリ追加
        echo "deb [arch=$(dpkg --print-architecture) signed-by=${DOCKER_KEYRING}] \
https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
            | tee /etc/apt/sources.list.d/docker.list > /dev/null

        # Docker リポジトリ追加後に更新（2回目）
        apt-get update -q
        apt-get install -y -q docker-ce docker-ce-cli containerd.io docker-compose-plugin
        systemctl enable --now docker
        log_info "  -> Docker を公式 APT リポジトリからインストールしました"
    else
        log_info "  -> Docker は既にインストール済みです"
    fi

    # deploy ユーザーを docker グループに追加（sudo なしで実行可能に）
    usermod -aG docker "${DEPLOY_USER}"
    log_info "  -> ${DEPLOY_USER} を docker グループに追加しました"
    log_info "  -> Docker: $(docker --version)"
}

# ────────────────────────────────────────────
# 3. Caddy インストール
# ────────────────────────────────────────────
install_caddy() {
    log_info "[3/5] Caddy インストール..."

    if ! command -v caddy &>/dev/null; then
        # GPG キーリングが未登録の場合のみ追加（冪等性を確保）
        if [ ! -f "${CADDY_KEYRING}" ]; then
            curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
                | gpg --dearmor -o "${CADDY_KEYRING}"
        fi
        curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
            | tee /etc/apt/sources.list.d/caddy-stable.list

        # Caddy リポジトリ追加後に更新（3回目）
        apt-get update -q
        apt-get install -y -q caddy
        log_info "  -> Caddy をインストールしました"
    else
        log_info "  -> Caddy は既にインストール済みです"
    fi

    configure_caddy
}

configure_caddy() {
    # ログディレクトリを Caddy ユーザーで所有
    mkdir -p /var/log/caddy
    chown caddy:caddy /var/log/caddy
    chmod 750 /var/log/caddy

    # Caddyfile をテンプレートから生成（{{DOMAIN}} を置換）
    local caddyfile_template="${SCRIPT_DIR}/Caddyfile.template"
    if [ -f "${caddyfile_template}" ]; then
        sed "s/{{DOMAIN}}/${DOMAIN}/g" "${caddyfile_template}" > /etc/caddy/Caddyfile
        log_info "  -> Caddyfile をテンプレートから生成しました"
    else
        log_warn "  -> Caddyfile.template が見つかりません。デフォルト設定を使用します。"
        cat > /etc/caddy/Caddyfile <<CADDYFILE
${DOMAIN} {
    reverse_proxy localhost:${APP_PORT} {
        health_uri      /health
        health_interval 30s
    }
    log {
        output file /var/log/caddy/access.log {
            roll_size ${LOG_ROLL_SIZE}
            roll_keep ${LOG_ROLL_KEEP}
        }
    }
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server
    }
}
CADDYFILE
    fi

    systemctl enable --now caddy

    if ! systemctl is-active --quiet caddy; then
        log_error "Caddy の起動に失敗しました"
        journalctl -u caddy --no-pager -n 20
        exit 1
    fi

    caddy validate --config /etc/caddy/Caddyfile
    systemctl reload caddy
    log_info "  -> Caddyfile を設定しました（自動 SSL: ${DOMAIN}）"
    log_info "  -> Caddy: $(caddy version)"
}

# ────────────────────────────────────────────
# 4. アプリディレクトリ・シークレット作成
# ────────────────────────────────────────────
setup_app() {
    log_info "[4/5] アプリのセットアップ..."

    mkdir -p "${APP_DIR}"

    if [ -d "${APP_DIR}/app/.git" ]; then
        git -C "${APP_DIR}/app" pull
        log_info "  -> リポジトリを更新しました"
    else
        git clone "${REPO_URL}" "${APP_DIR}/app"
        log_info "  -> リポジトリをクローンしました"
    fi

    setup_secrets
    setup_env
    chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_DIR}"
}

setup_secrets() {
    local secrets_dir="${APP_DIR}/secrets"
    mkdir -p "${secrets_dir}"
    chmod 700 "${secrets_dir}"

    for secret_file in mysql_root_password mysql_password jwt_secret secret_key; do
        if [ ! -f "${secrets_dir}/${secret_file}.txt" ]; then
            generate_secret > "${secrets_dir}/${secret_file}.txt"
            chmod 600 "${secrets_dir}/${secret_file}.txt"
            log_info "  -> ${secret_file}.txt を生成しました"
        else
            log_info "  -> ${secret_file}.txt は既に存在します（スキップ）"
        fi
    done
}

setup_env() {
    local secrets_dir="${APP_DIR}/secrets"
    local env_file="${APP_DIR}/app/cooking-cost-system/.env.production"

    if [ -f "${env_file}" ]; then
        log_info "  -> .env.production は既に存在します（スキップ）"
        return
    fi

    # NOTE: issue #86 (docker-compose.prod.yml 更新) 完了後、Docker Secrets に移行予定。
    # NOTE: DATABASE_URL のホスト名は docker-compose.prod.yml の構成次第で変更が必要。
    #   - バックエンドが Docker Compose 内で動く場合 → サービス名（例: database）
    #   - バックエンドがホスト上で直接動く場合    → localhost
    #   issue #86 完了後に必ず確認・修正してください。
    cat > "${env_file}" <<'ENV_HEADER'
FLASK_ENV=production
# NOTE: issue #86 完了後 Docker Secrets に移行予定。ホスト名も要確認（#86 参照）。
ENV_HEADER

    # シークレットを直接 cat で展開し、シェル変数に保持しない
    {
        echo "PORT=${APP_PORT}"
        echo "DATABASE_URL_PRODUCTION=mysql+pymysql://cooking_user:$(cat "${secrets_dir}/mysql_password.txt")@localhost:3306/cooking_cost_system"
        echo "JWT_SECRET=$(cat "${secrets_dir}/jwt_secret.txt")"
        echo "SECRET_KEY=$(cat "${secrets_dir}/secret_key.txt")"
        echo "# 本番の Cloudflare Pages ドメインに書き換えてください"
        echo "CORS_ORIGIN=https://your-project.pages.dev"
    } >> "${env_file}"

    chmod 600 "${env_file}"
    log_info "  -> .env.production を作成しました"
    log_warn "  !! CORS_ORIGIN を正しいドメインに書き換えてください: ${env_file}"
}

# ────────────────────────────────────────────
# 5. Docker Compose 起動
# ────────────────────────────────────────────
start_app() {
    log_info "[5/5] Docker Compose でアプリを起動..."

    local compose_dir="${APP_DIR}/app/cooking-cost-system"
    local env_file="${APP_DIR}/app/cooking-cost-system/.env.production"

    if [ ! -f "${compose_dir}/docker-compose.prod.yml" ]; then
        log_warn "  !! docker-compose.prod.yml が見つかりません。issue #86 の対応後に再実行してください。"
        log_warn "     手動起動: cd ${compose_dir} && docker compose -f docker-compose.prod.yml up -d"
        return
    fi

    # サブシェルで env を読み込み、親シェルにシークレットを残さない
    (
        set -a
        # shellcheck disable=SC1090
        source "${env_file}"
        set +a
        cd "${compose_dir}"
        docker compose -f docker-compose.prod.yml up -d --build
    )
    log_info "  -> コンテナを起動しました"
}

# ────────────────────────────────────────────
# 完了サマリー
# ────────────────────────────────────────────
print_summary() {
    local env_file="${APP_DIR}/app/cooking-cost-system/.env.production"

    echo ""
    echo "========================================"
    log_info " セットアップ完了"
    echo "========================================"
    echo ""
    echo "次のステップ:"
    echo "  1. ${env_file} の CORS_ORIGIN を Cloudflare Pages のドメインに更新"
    echo "  2. ${DOMAIN} の DNS A レコードをこの VPS の IP に向ける"
    echo "  3. curl https://${DOMAIN}/health で疎通確認"
    echo "  4. deploy ユーザーに SSH 公開鍵を設定（未実施の場合）:"
    echo "     mkdir -p /home/${DEPLOY_USER}/.ssh"
    echo "     echo '<your-pubkey>' >> /home/${DEPLOY_USER}/.ssh/authorized_keys"
    echo "     chmod 700 /home/${DEPLOY_USER}/.ssh && chmod 600 /home/${DEPLOY_USER}/.ssh/authorized_keys"
    echo ""
    echo "インストール済みバージョン:"
    log_info "  Docker: $(docker --version)"
    log_info "  Caddy:  $(caddy version)"
    echo ""
    echo "シークレットファイル: ${APP_DIR}/secrets/"
    echo "アプリディレクトリ  : ${APP_DIR}/app/"
    echo "セットアップログ    : /var/log/vps-setup.log"
}

# ────────────────────────────────────────────
# エントリポイント
# ────────────────────────────────────────────
main() {
    check_prerequisites "$@"
    setup_system
    install_docker
    install_caddy
    setup_app
    start_app
    print_summary
}

main "$@"
