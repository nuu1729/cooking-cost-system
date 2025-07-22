#!/bin/bash

# 🍽️ 料理原価計算システム v2.0 - 開発環境セットアップスクリプト

set -e

echo "🍽️ 料理原価計算システム v2.0 - 開発環境セットアップ"
echo "=================================================="

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 関数定義
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 必要なコマンドのチェック
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 がインストールされていません"
        exit 1
    fi
}

# 前提条件チェック
log_info "前提条件をチェック中..."
check_command "docker"
check_command "docker-compose"
check_command "git"

# Docker動作確認
if ! docker info &> /dev/null; then
    log_error "Dockerが起動していません"
    exit 1
fi

log_success "前提条件チェック完了"

# 環境変数ファイルの作成
log_info "環境変数ファイルを作成中..."

if [ ! -f .env ]; then
    cp .env.example .env
    log_success ".env を作成しました"
else
    log_warning ".env は既に存在します"
fi

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    log_success "backend/.env を作成しました"
else
    log_warning "backend/.env は既に存在します"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    log_success "frontend/.env を作成しました"
else
    log_warning "frontend/.env は既に存在します"
fi

# シークレットディレクトリの作成
log_info "シークレットファイルを作成中..."
mkdir -p secrets

if [ ! -f secrets/mysql_root_password.txt ]; then
    echo "rootpassword" > secrets/mysql_root_password.txt
    log_success "MySQL root password を作成しました"
fi

if [ ! -f secrets/mysql_password.txt ]; then
    echo "cooking_password" > secrets/mysql_password.txt
    log_success "MySQL password を作成しました"
fi

if [ ! -f secrets/jwt_secret.txt ]; then
    openssl rand -base64 32 > secrets/jwt_secret.txt
    log_success "JWT secret を作成しました"
fi

if [ ! -f secrets/redis_password.txt ]; then
    openssl rand -base64 16 > secrets/redis_password.txt
    log_success "Redis password を作成しました"
fi

# ディレクトリ作成
log_info "必要なディレクトリを作成中..."
mkdir -p logs backups uploads

# 権限設定
chmod 600 secrets/*
log_success "シークレットファイルの権限を設定しました"

# Docker イメージのビルド
log_info "Docker イメージをビルド中..."
docker-compose build --no-cache

# Docker コンテナの起動
log_info "Docker コンテナを起動中..."
docker-compose up -d

# ヘルスチェック
log_info "サービスの起動を待機中..."
sleep 30

# バックエンドのヘルスチェック
for i in {1..30}; do
    if curl -f http://localhost:3001/health &> /dev/null; then
        log_success "バックエンドが起動しました"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "バックエンドの起動に失敗しました"
        docker-compose logs backend
        exit 1
    fi
    sleep 2
done

# フロントエンドのヘルスチェック
for i in {1..30}; do
    if curl -f http://localhost:3000 &> /dev/null; then
        log_success "フロントエンドが起動しました"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "フロントエンドの起動に失敗しました"
        docker-compose logs frontend
        exit 1
    fi
    sleep 2
done

# 完了メッセージ
echo ""
log_success "🎉 開発環境のセットアップが完了しました！"
echo ""
echo "📱 フロントエンド: http://localhost:3000"
echo "🔧 API: http://localhost:3001"
echo "🗄️  phpMyAdmin: http://localhost:8080"
echo ""
echo "📚 便利なコマンド:"
echo "  make logs          # ログを表示"
echo "  make restart       # サービスを再起動"
echo "  make clean         # 未使用リソースを削除"
echo "  make backend-shell # バックエンドコンテナにログイン"
echo "  make db-shell      # データベースに接続"
echo ""