# 🍽️ 料理原価計算システム v2.0 - Makefile
# ===================================================

.PHONY: help dev build test clean logs restart backup frontend-shell backend-shell db-shell

# デフォルトターゲット
.DEFAULT_GOAL := help

# 色付きヘルプ
RED    := \033[31m
GREEN  := \033[32m
YELLOW := \033[33m
BLUE   := \033[34m
RESET  := \033[0m

## ヘルプ
help: ## 📖 使用可能なコマンドを表示
	@echo "$(GREEN)🍽️ 料理原価計算システム v2.0$(RESET)"
	@echo "$(BLUE)========================================$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "$(YELLOW)%-15s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(BLUE)📊 システム状況:$(RESET)"
	@echo "  Docker: $(shell docker --version 2>/dev/null || echo '$(RED)未インストール$(RESET)')"
	@echo "  Docker Compose: $(shell docker-compose --version 2>/dev/null || echo '$(RED)未インストール$(RESET)')"

## 🚀 開発環境
dev: ## 🔧 開発環境を起動
	@echo "$(GREEN)🚀 開発環境を起動中...$(RESET)"
	@docker-compose up -d --build
	@echo "$(GREEN)✅ 開発環境が起動しました$(RESET)"
	@echo "$(BLUE)📱 フロントエンド: http://localhost:3000$(RESET)"
	@echo "$(BLUE)🔧 API: http://localhost:3001$(RESET)"
	@echo "$(BLUE)🗄️ phpMyAdmin: http://localhost:8080$(RESET)"

dev-logs: ## 📋 開発環境のログを表示
	@docker-compose logs -f

dev-stop: ## ⏹️ 開発環境を停止
	@echo "$(YELLOW)⏹️ 開発環境を停止中...$(RESET)"
	@docker-compose down
	@echo "$(GREEN)✅ 開発環境が停止しました$(RESET)"

## 🏗️ ビルド
build: ## 🔨 本番用イメージをビルド
	@echo "$(GREEN)🔨 本番用イメージをビルド中...$(RESET)"
	@docker-compose -f docker-compose.prod.yml build
	@echo "$(GREEN)✅ ビルドが完了しました$(RESET)"

prod: ## 🚀 本番環境を起動
	@echo "$(GREEN)🚀 本番環境を起動中...$(RESET)"
	@docker-compose -f docker-compose.prod.yml up -d
	@echo "$(GREEN)✅本番環境が起動しました$(RESET)"

prod-stop: ## ⏹️ 本番環境を停止
	@docker-compose -f docker-compose.prod.yml down

## 🧪 テスト
test: ## ✅ 全テストを実行
	@echo "$(GREEN)🧪 テストを実行中...$(RESET)"
	@docker-compose exec backend npm test
	@docker-compose exec frontend npm test

test-coverage: ## 📊 テストカバレッジを確認
	@echo "$(GREEN)📊 テストカバレッジを確認中...$(RESET)"
	@docker-compose exec frontend npm run test:coverage

test-e2e: ## 🎯 E2Eテストを実行
	@echo "$(GREEN)🎯 E2Eテストを実行中...$(RESET)"
	@docker-compose exec frontend npm run test:e2e

## 🔧 開発ツール
frontend-shell: ## 💻 フロントエンドコンテナにログイン
	@docker-compose exec frontend sh

backend-shell: ## 🖥️ バックエンドコンテナにログイン
	@docker-compose exec backend sh

db-shell: ## 🗄️ データベースに接続
	@docker-compose exec database mysql -u cooking_user -pcooking_password cooking_cost_system

## 📋 ログ管理
logs: ## 📋 全サービスのログを表示
	@docker-compose logs -f

logs-backend: ## 📋 バックエンドログを表示
	@docker-compose logs -f backend

logs-frontend: ## 📋 フロントエンドログを表示
	@docker-compose logs -f frontend

logs-db: ## 📋 データベースログを表示
	@docker-compose logs -f database

## 🧹 クリーンアップ
clean: ## 🧹 未使用のDockerリソースを削除
	@echo "$(YELLOW)🧹 未使用のDockerリソースを削除中...$(RESET)"
	@docker system prune -f
	@docker volume prune -f
	@echo "$(GREEN)✅ クリーンアップが完了しました$(RESET)"

clean-all: ## 🗑️ 全Dockerリソースを削除（注意！）
	@echo "$(RED)⚠️ 全Dockerリソースを削除します（データも削除されます）$(RESET)"
	@read -p "本当に削除しますか？ (y/N): " confirm && [ "$$confirm" = "y" ]
	@docker-compose down -v --rmi all
	@docker system prune -af --volumes
	@echo "$(GREEN)✅ 全リソースが削除されました$(RESET)"

## 🔄 リスタート
restart: ## 🔄 全サービスを再起動
	@echo "$(YELLOW)🔄 サービスを再起動中...$(RESET)"
	@docker-compose restart
	@echo "$(GREEN)✅ 再起動が完了しました$(RESET)"

restart-backend: ## 🔄 バックエンドを再起動
	@docker-compose restart backend

restart-frontend: ## 🔄 フロントエンドを再起動
	@docker-compose restart frontend

restart-db: ## 🔄 データベースを再起動
	@docker-compose restart database

## 💾 バックアップ
backup: ## 💾 データベースをバックアップ
	@echo "$(GREEN)💾 データベースをバックアップ中...$(RESET)"
	@mkdir -p backups
	@docker-compose exec database mysqldump -u cooking_user -pcooking_password cooking_cost_system > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ バックアップが完了しました$(RESET)"

restore: ## 🔄 データベースを復元（backup.sqlが必要）
	@echo "$(YELLOW)🔄 データベースを復元中...$(RESET)"
	@docker-compose exec -T database mysql -u cooking_user -pcooking_password cooking_cost_system < backup.sql
	@echo "$(GREEN)✅ 復元が完了しました$(RESET)"

## 📦 依存関係管理
install: ## 📦 依存関係をインストール
	@echo "$(GREEN)📦 依存関係をインストール中...$(RESET)"
	@docker-compose exec backend npm install
	@docker-compose exec frontend npm install
	@echo "$(GREEN)✅ インストールが完了しました$(RESET)"

update: ## ⬆️ 依存関係を更新
	@echo "$(GREEN)⬆️ 依存関係を更新中...$(RESET)"
	@docker-compose exec backend npm update
	@docker-compose exec frontend npm update
	@echo "$(GREEN)✅ 更新が完了しました$(RESET)"

## 🛠️ セットアップ
setup: ## ⚙️ 初回セットアップ
	@echo "$(GREEN)⚙️ 初回セットアップを実行中...$(RESET)"
	@cp -n .env.example .env || true
	@cp -n backend/.env.example backend/.env || true
	@cp -n frontend/.env.example frontend/.env || true
	@make dev
	@echo "$(GREEN)✅ セットアップが完了しました$(RESET)"
	@echo "$(BLUE)🎉 システムにアクセスできます:$(RESET)"
	@echo "$(BLUE)📱 フロントエンド: http://localhost:3000$(RESET)"
	@echo "$(BLUE)🔧 API: http://localhost:3001$(RESET)"
	@echo "$(BLUE)🗄️ phpMyAdmin: http://localhost:8080$(RESET)"

## 💡 ユーティリティ
ps: ## 📊 コンテナ状況を表示
	@docker-compose ps

stats: ## 📈 リソース使用状況を表示
	@docker stats $(shell docker-compose ps -q)

ip: ## 🌐 コンテナIPアドレスを表示
	@echo "$(BLUE)Frontend: $(shell docker-compose exec frontend hostname -i 2>/dev/null || echo 'N/A')$(RESET)"
	@echo "$(BLUE)Backend:  $(shell docker-compose exec backend hostname -i 2>/dev/null || echo 'N/A')$(RESET)"
	@echo "$(BLUE)Database: $(shell docker-compose exec database hostname -i 2>/dev/null || echo 'N/A')$(RESET)"

health: ## 🏥 ヘルスチェック
	@echo "$(GREEN)🏥 ヘルスチェック実行中...$(RESET)"
	@curl -s http://localhost:3001/health > /dev/null && echo "$(GREEN)✅ Backend: OK$(RESET)" || echo "$(RED)❌ Backend: NG$(RESET)"
	@curl -s http://localhost:3000 > /dev/null && echo "$(GREEN)✅ Frontend: OK$(RESET)" || echo "$(RED)❌ Frontend: NG$(RESET)"

## 🚀 デプロイ
deploy-staging: ## 🎭 ステージング環境にデプロイ
	@echo "$(GREEN)🎭 ステージング環境にデプロイ中...$(RESET)"
	@echo "$(YELLOW)⚠️ ステージング環境のデプロイ設定が必要です$(RESET)"

deploy-prod: ## 🚀 本番環境にデプロイ
	@echo "$(GREEN)🚀 本番環境にデプロイ中...$(RESET)"
	@echo "$(RED)⚠️ 本番環境のデプロイ設定が必要です$(RESET)"

## 📊 監視
monitor: ## 📊 システム監視
	@echo "$(GREEN)📊 システム監視中...$(RESET)"
	@watch -n 2 'docker-compose ps && echo "" && docker stats --no-stream $(shell docker-compose ps -q)'