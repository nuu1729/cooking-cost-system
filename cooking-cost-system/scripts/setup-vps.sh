#!/bin/bash
# Hetzner VPS (CAX11: ARM / 2vCPU / 4GB) 初期セットアップスクリプト
# 前提: Ubuntu 22.04 LTS, root で実行
# 使用法: bash setup-vps.sh <your-domain>
# 例:     bash setup-vps.sh api.example.com

set -euo pipefail

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
    log_error "セットアップ中にエラーが発生しました（終了コード: $?）"
    log_error "ログを確認してください: journalctl -xe"
}
trap cleanup ERR

# ────────────────────────────────────────────
# 引数・権限チェック
# ────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
    log_error "このスクリプトは root で実行してください（sudo bash setup-vps.sh <domain>）"
    exit 1
fi

DOMAIN="${1:?使用法: bash setup-vps.sh <api-domain> (例: api.example.com)}"

if ! [[ "${DOMAIN}" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$ ]]; then
    log_error "無効なドメイン形式です: ${DOMAIN}"
    exit 1
fi

APP_DIR="/opt/cooking-cost"
REPO_URL="https://github.com/nuu1729/cooking-cost-system.git"
DEPLOY_USER="deploy"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CADDY_KEYRING="/usr/share/keyrings/caddy-stable-archive-keyring.gpg"

echo "========================================"
echo " 料理原価計算システム VPS セットアップ"
echo " ドメイン: ${DOMAIN}"
echo "========================================"

# ────────────────────────────────────────────
# 1. システム初期化
# ────────────────────────────────────────────
log_info "[1/5] システム初期化..."

# システムパッケージのリストを更新（1回目: システム全体）
apt-get update -q
apt-get upgrade -y -q
apt-get install -y -q curl git ufw fail2ban unattended-upgrades \
    debian-keyring debian-archive-keyring apt-transport-https

# 自動セキュリティアップデート有効化
dpkg-reconfigure -f noninteractive unattended-upgrades
log_info "  -> 自動セキュリティアップデートを有効化しました"

# deploy ユーザー作成（既存の場合はスキップ）
if ! id "${DEPLOY_USER}" &>/dev/null; then
    useradd -m -s /bin/bash "${DEPLOY_USER}"
    usermod -aG sudo "${DEPLOY_USER}"
    log_info "  -> ${DEPLOY_USER} ユーザーを作成しました"
fi

# sudoers: Caddy 操作のみ（docker は docker グループで対応するため不要）
cat > "/etc/sudoers.d/${DEPLOY_USER}" <<EOF
${DEPLOY_USER} ALL=(ALL) NOPASSWD: /bin/systemctl restart caddy
${DEPLOY_USER} ALL=(ALL) NOPASSWD: /bin/systemctl reload caddy
EOF
chmod 440 "/etc/sudoers.d/${DEPLOY_USER}"
log_info "  -> sudoers: Caddy 操作のみ許可"

# SSH セキュリティ設定（ロックアウト防止のため事前確認）
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
read -r -p "SSH 設定を変更しますか? [y/N]: " confirm
if [[ "${confirm}" == "y" || "${confirm}" == "Y" ]]; then
    sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
    sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
    systemctl reload sshd
    log_info "  -> SSH: root ログイン・パスワード認証を無効化しました"
else
    log_warn "SSH 設定の変更をスキップしました。後から手動で設定してください。"
fi

# UFW ファイアウォール
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   comment "SSH"
ufw allow 80/tcp   comment "HTTP (Caddy ACME)"
ufw allow 443/tcp  comment "HTTPS"
ufw --force enable
log_info "  -> UFW: 22/80/443 のみ許可"

# fail2ban: SSH ブルートフォース対策
cat > /etc/fail2ban/jail.local <<EOF
[sshd]
enabled  = true
port     = 22
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 3
bantime  = 3600
findtime = 600
EOF
systemctl enable --now fail2ban
log_info "  -> fail2ban: SSH 保護を有効化（3回失敗で1時間 BAN）"

# ────────────────────────────────────────────
# 2. Docker インストール
# ────────────────────────────────────────────
log_info "[2/5] Docker インストール..."

if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
    log_info "  -> Docker をインストールしました"
else
    log_info "  -> Docker は既にインストール済みです"
fi

# deploy ユーザーを docker グループに追加（sudo なしで docker 実行可能に）
usermod -aG docker "${DEPLOY_USER}"
log_info "  -> ${DEPLOY_USER} を docker グループに追加しました"
log_info "  -> Docker: $(docker --version)"

# ────────────────────────────────────────────
# 3. Caddy インストール
# ────────────────────────────────────────────
log_info "[3/5] Caddy インストール..."

if ! command -v caddy &>/dev/null; then
    # GPG キーリングが未登録の場合のみ追加（冪等性を確保）
    if [ ! -f "${CADDY_KEYRING}" ]; then
        curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
            | gpg --dearmor -o "${CADDY_KEYRING}"
    fi
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
        | tee /etc/apt/sources.list.d/caddy-stable.list

    # Caddy リポジトリ追加後に再更新（2回目: 新規リポジトリのパッケージリスト取得）
    apt-get update -q
    apt-get install -y -q caddy
    log_info "  -> Caddy をインストールしました"
else
    log_info "  -> Caddy は既にインストール済みです"
fi

# ログディレクトリを Caddy ユーザーで所有（書き込み権限を確保）
mkdir -p /var/log/caddy
chown caddy:caddy /var/log/caddy
chmod 750 /var/log/caddy

# Caddyfile をテンプレートから生成（DRY: スクリプト内でのハードコードを排除）
CADDYFILE_TEMPLATE="${SCRIPT_DIR}/Caddyfile.template"
if [ -f "${CADDYFILE_TEMPLATE}" ]; then
    sed "s/YOUR_DOMAIN/${DOMAIN}/g" "${CADDYFILE_TEMPLATE}" > /etc/caddy/Caddyfile
    log_info "  -> Caddyfile をテンプレートから生成しました"
else
    log_warn "  -> Caddyfile.template が見つかりません。デフォルト設定を使用します。"
    cat > /etc/caddy/Caddyfile <<CADDYFILE
${DOMAIN} {
    reverse_proxy localhost:3001 {
        health_uri      /health
        health_interval 30s
    }
    log {
        output file /var/log/caddy/access.log {
            roll_size 10mb
            roll_keep 5
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

# Caddy 起動・設定検証・リロード
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

# ────────────────────────────────────────────
# 4. アプリディレクトリ・シークレット作成
# ────────────────────────────────────────────
log_info "[4/5] アプリのセットアップ..."

mkdir -p "${APP_DIR}"

# リポジトリクローン（既存の場合は pull）
if [ -d "${APP_DIR}/app/.git" ]; then
    git -C "${APP_DIR}/app" pull
    log_info "  -> リポジトリを更新しました"
else
    git clone "${REPO_URL}" "${APP_DIR}/app"
    log_info "  -> リポジトリをクローンしました"
fi

# secrets ディレクトリ
SECRETS_DIR="${APP_DIR}/secrets"
mkdir -p "${SECRETS_DIR}"
chmod 700 "${SECRETS_DIR}"

# URL-safe な文字のみ使用（MySQL URL・envファイル内での特殊文字エスケープ不要）
generate_secret() {
    python3 -c "import secrets; print(secrets.token_urlsafe(32))"
}

# シークレットファイル生成（既存の場合は上書きしない）
for secret_file in mysql_root_password mysql_password jwt_secret secret_key; do
    if [ ! -f "${SECRETS_DIR}/${secret_file}.txt" ]; then
        generate_secret > "${SECRETS_DIR}/${secret_file}.txt"
        chmod 600 "${SECRETS_DIR}/${secret_file}.txt"
        log_info "  -> ${secret_file}.txt を生成しました"
    else
        log_info "  -> ${secret_file}.txt は既に存在します（スキップ）"
    fi
done

# .env.production 作成
# NOTE: シークレットは現在ファイルから直接参照しています。
#       issue #86 (docker-compose.prod.yml 更新) 完了後、
#       Docker Secrets (secrets: / secret_file: ...) を使用する方式に移行してください。
# NOTE: DATABASE_URL のホスト名は docker-compose.prod.yml の構成次第で変更が必要です。
#       - バックエンドが Docker Compose 内で動く場合: サービス名（例: database）
#       - バックエンドがホスト上で直接動く場合: localhost
#       issue #86 完了後に確認・修正してください。
ENV_FILE="${APP_DIR}/app/cooking-cost-system/.env.production"
if [ ! -f "${ENV_FILE}" ]; then
    MYSQL_PASS=$(cat "${SECRETS_DIR}/mysql_password.txt")
    JWT_SECRET=$(cat "${SECRETS_DIR}/jwt_secret.txt")
    SECRET_KEY=$(cat "${SECRETS_DIR}/secret_key.txt")
    cat > "${ENV_FILE}" <<ENV
FLASK_ENV=production
PORT=3001
# NOTE: issue #86 完了後、Docker Secrets に移行予定。ホスト名も要確認。
DATABASE_URL_PRODUCTION=mysql+pymysql://cooking_user:${MYSQL_PASS}@localhost:3306/cooking_cost_system
JWT_SECRET=${JWT_SECRET}
SECRET_KEY=${SECRET_KEY}
# 本番の Cloudflare Pages ドメインに書き換えてください
CORS_ORIGIN=https://your-project.pages.dev
ENV
    chmod 600 "${ENV_FILE}"
    unset MYSQL_PASS JWT_SECRET SECRET_KEY
    log_info "  -> .env.production を作成しました"
    log_warn "  !! CORS_ORIGIN を正しいドメインに書き換えてください: ${ENV_FILE}"
else
    log_info "  -> .env.production は既に存在します（スキップ）"
fi

# オーナー変更
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_DIR}"

# ────────────────────────────────────────────
# 5. Docker Compose 起動
# ────────────────────────────────────────────
log_info "[5/5] Docker Compose でアプリを起動..."

COMPOSE_DIR="${APP_DIR}/app/cooking-cost-system"

if [ ! -f "${COMPOSE_DIR}/docker-compose.prod.yml" ]; then
    log_warn "  !! docker-compose.prod.yml が見つかりません。issue #86 の対応後に再実行してください。"
    log_warn "     手動起動: cd ${COMPOSE_DIR} && docker compose -f docker-compose.prod.yml up -d"
else
    # サブシェルで env を読み込み、親シェルにシークレットを残さない
    (
        set -a
        # shellcheck disable=SC1090
        source "${ENV_FILE}"
        set +a
        cd "${COMPOSE_DIR}"
        docker compose -f docker-compose.prod.yml up -d --build
    )
    log_info "  -> コンテナを起動しました"
fi

# ────────────────────────────────────────────
# 完了
# ────────────────────────────────────────────
echo ""
echo "========================================"
log_info " セットアップ完了"
echo "========================================"
echo ""
echo "次のステップ:"
echo "  1. ${ENV_FILE} の CORS_ORIGIN を Cloudflare Pages のドメインに更新"
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
echo "シークレットファイル: ${SECRETS_DIR}/"
echo "アプリディレクトリ  : ${APP_DIR}/app/"
