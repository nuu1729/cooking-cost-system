# ================================
# 料理原価計算システム - Makefile
# ================================

.PHONY: help install build start dev test lint clean docker-build docker-run deploy

# デフォルトターゲット
.DEFAULT_GOAL := help

# 環境変数
NODE_ENV ?= development
PORT ?= 3001
DOCKER_IMAGE_NAME = cooking-cost-backend
DOCKER_TAG ?= latest
REGISTRY ?= ghcr.io/cooking-cost-system

# ヘルプ表示
help: ## ヘルプを表示
	@echo "料理原価計算システム - バックエンド"
	@echo "=================================="
	@echo ""
	@echo "利用可能なコマンド:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ================================
# 開発環境セットアップ
# ================================

install: ## 依存関係をインストール
	@echo "📦 依存関係をインストール中..."
	npm ci
	@echo "✅ インストール完了"

install-dev: ## 開発用依存関係をインストール
	@echo "📦 開発用依存関係をインストール中..."
	npm install
	@echo "✅ 開発用インストール完了"

setup: install ## 初期セットアップ
	@echo "🔧 初期セットアップ中..."
	cp .env.example .env
	mkdir -p logs uploads
	@echo "✅ セットアップ完了"

# ================================
# ビルド
# ================================

build: ## TypeScriptをビルド
	@echo "🔨 ビルド中..."
	npm run build
	@echo "✅ ビルド完了"

build-clean: clean build ## クリーンビルド
	@echo "✅ クリーンビルド完了"

typecheck: ## 型チェック
	@echo "🔍 型チェック中..."
	npm run typecheck
	@echo "✅ 型チェック完了"

# ================================
# 実行
# ================================

start: build ## 本番モードで起動
	@echo "🚀 本番モードで起動中..."
	NODE_ENV=production npm start

dev: ## 開発モードで起動
	@echo "🚀 開発モードで起動中..."
	npm run dev

dev-debug: ## デバッグモードで起動
	@echo "🐛 デバッグモードで起動中..."
	NODE_ENV=development DEBUG=* npm run dev

# ================================
# テスト
# ================================

test: ## テストを実行
	@echo "🧪 テスト実行中..."
	npm test

test-watch: ## テストを監視モードで実行
	@echo "👀 テスト監視モード..."
	npm run test:watch

test-coverage: ## カバレッジ付きでテスト実行
	@echo "📊 カバレッジテスト実行中..."
	npm run test:coverage

test-integration: ## 統合テストを実行
	@echo "🔗 統合テスト実行中..."
	npm run test:integration

test-e2e: ## E2Eテストを実行
	@echo "🎯 E2Eテスト実行中..."
	npm run test:e2e

# ================================
# コード品質
# ================================

lint: ## リンターを実行
	@echo "🔍 リンター実行中..."
	npm run lint

lint-fix: ## リンターで修正可能な問題を自動修正
	@echo "🔧 リンター自動修正中..."
	npm run lint:fix

format: ## コードフォーマット
	@echo "✨ コードフォーマット中..."
	npx prettier --write "src/**/*.{ts,js,json}"

audit: ## セキュリティ監査
	@echo "🔒 セキュリティ監査中..."
	npm audit --audit-level=moderate

audit-fix: ## セキュリティ問題の自動修正
	@echo "🔧 セキュリティ問題修正中..."
	npm audit fix

# ================================
# データベース
# ================================

db-create: ## データベースを作成
	@echo "🗄️ データベース作成中..."
	mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cooking_cost_system;"
	mysql -u root -p -e "CREATE USER IF NOT EXISTS 'cooking_user'@'localhost' IDENTIFIED BY 'cooking_password';"
	mysql -u root -p -e "GRANT ALL PRIVILEGES ON cooking_cost_system.* TO 'cooking_user'@'localhost';"
	mysql -u root -p -e "FLUSH PRIVILEGES;"

db-migrate: ## データベースマイグレーション実行
	@echo "🔄 マイグレーション実行中..."
	mysql -u cooking_user -pcooking_password cooking_cost_system < database/init/01_create_tables.sql

db-seed: ## サンプルデータを投入
	@echo "🌱 サンプルデータ投入中..."
	mysql -u cooking_user -pcooking_password cooking_cost_system < database/init/02_sample_data.sql

db-reset: ## データベースをリセット
	@echo "🔄 データベースリセット中..."
	mysql -u root -p -e "DROP DATABASE IF EXISTS cooking_cost_system;"
	$(MAKE) db-create db-migrate db-seed

db-backup: ## データベースバックアップ
	@echo "💾 データベースバックアップ中..."
	mkdir -p backups
	mysqldump -u cooking_user -pcooking_password cooking_cost_system > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ バックアップ完了: backups/backup_$(shell date +%Y%m%d_%H%M%S).sql"

# ================================
# Docker
# ================================

docker-build: ## Dockerイメージをビルド
	@echo "🐳 Dockerイメージビルド中..."
	docker build -t $(DOCKER_IMAGE_NAME):$(DOCKER_TAG) .
	@echo "✅ Dockerイメージビルド完了"

docker-build-dev: ## 開発用Dockerイメージをビルド
	@echo "🐳 開発用Dockerイメージビルド中..."
	docker build -f Dockerfile.dev -t $(DOCKER_IMAGE_NAME):dev .

docker-run: ## Dockerコンテナを起動
	@echo "🐳 Dockerコンテナ起動中..."
	docker run -p $(PORT):$(PORT) --env-file .env $(DOCKER_IMAGE_NAME):$(DOCKER_TAG)

docker-run-dev: ## 開発用Dockerコンテナを起動
	@echo "🐳 開発用Dockerコンテナ起動中..."
	docker run -it -p $(PORT):$(PORT) -v $(PWD):/app --env-file .env $(DOCKER_IMAGE_NAME):dev

docker-compose-up: ## Docker Composeで起動
	@echo "🐳 Docker Compose起動中..."
	docker-compose up --build

docker-compose-dev: ## 開発用Docker Composeで起動
	@echo "🐳 開発用Docker Compose起動中..."
	docker-compose -f docker-compose.yml up backend-dev

docker-compose-down: ## Docker Composeを停止
	@echo "🐳 Docker Compose停止中..."
	docker-compose down

docker-push: docker-build ## Dockerイメージをプッシュ
	@echo "📤 Dockerイメージプッシュ中..."
	docker tag $(DOCKER_IMAGE_NAME):$(DOCKER_TAG) $(REGISTRY)/$(DOCKER_IMAGE_NAME):$(DOCKER_TAG)
	docker push $(REGISTRY)/$(DOCKER_IMAGE_NAME):$(DOCKER_TAG)

# ================================
# クリーンアップ
# ================================

clean: ## ビルド成果物を削除
	@echo "🧹 クリーンアップ中..."
	rm -rf dist/
	rm -rf coverage/
	rm -rf .nyc_output/
	rm -rf node_modules/.cache/
	@echo "✅ クリーンアップ完了"

clean-all: clean ## 全ての生成ファイルを削除
	@echo "🧹 完全クリーンアップ中..."
	rm -rf node_modules/
	rm -rf logs/
	rm -rf uploads/
	rm -rf backups/
	@echo "✅ 完全クリーンアップ完了"

clean-docker: ## Dockerリソースを削除
	@echo "🐳 Dockerクリーンアップ中..."
	docker system prune -f
	docker volume prune -f
	docker network prune -f

# ================================
# 本番デプロイメント
# ================================

deploy-staging: ## ステージング環境にデプロイ
	@echo "🚀 ステージング環境デプロイ中..."
	kubectl apply -f deploy/kubernetes.yaml --namespace=cooking-cost-staging
	kubectl rollout status deployment/cooking-cost-backend --namespace=cooking-cost-staging

deploy-production: ## 本番環境にデプロイ
	@echo "🚀 本番環境デプロイ中..."
	kubectl apply -f deploy/kubernetes.yaml --namespace=cooking-cost-production
	kubectl rollout status deployment/cooking-cost-backend --namespace=cooking-cost-production

rollback-staging: ## ステージング環境をロールバック
	@echo "⏪ ステージング環境ロールバック中..."
	kubectl rollout undo deployment/cooking-cost-backend --namespace=cooking-cost-staging

rollback-production: ## 本番環境をロールバック
	@echo "⏪ 本番環境ロールバック中..."
	kubectl rollout undo deployment/cooking-cost-backend --namespace=cooking-cost-production

# ================================
# 監視・ログ
# ================================

logs: ## アプリケーションログを表示
	@echo "📋 ログ表示中..."
	tail -f logs/combined-*.log

logs-error: ## エラーログを表示
	@echo "🚨 エラーログ表示中..."
	tail -f logs/error-*.log

logs-docker: ## Dockerコンテナのログを表示
	@echo "🐳 Dockerログ表示中..."
	docker logs -f cooking_cost_backend_dev

status: ## システムステータスを確認
	@echo "📊 システムステータス:"
	@echo "Node.js version: $(shell node --version)"
	@echo "NPM version: $(shell npm --version)"
	@echo "TypeScript version: $(shell npx tsc --version)"
	@echo "Docker version: $(shell docker --version 2>/dev/null || echo 'Docker not installed')"
	@echo "Kubectl version: $(shell kubectl version --client --short 2>/dev/null || echo 'kubectl not installed')"

health-check: ## ヘルスチェック実行
	@echo "🏥 ヘルスチェック実行中..."
	curl -f http://localhost:$(PORT)/health || echo "サーバーが起動していません"

# ================================
# 開発ツール
# ================================

update-deps: ## 依存関係を更新
	@echo "📦 依存関係更新中..."
	npm update
	npm audit fix --force

check-deps: ## 依存関係の脆弱性をチェック
	@echo "🔍 依存関係チェック中..."
	npm audit
	npx npm-check-updates

generate-docs: ## APIドキュメントを生成
	@echo "📚 APIドキュメント生成中..."
	npx typedoc src/ --out docs/api/

benchmark: ## パフォーマンステストを実行
	@echo "⚡ パフォーマンステスト実行中..."
	npx clinic doctor -- node dist/server.js &
	sleep 5
	curl -X GET http://localhost:$(PORT)/api/ingredients
	pkill -f "node dist/server.js"

# ================================
# 環境別コマンド
# ================================

dev-full: ## 完全な開発環境を起動（DB含む）
	@echo "🚀 完全な開発環境起動中..."
	$(MAKE) docker-compose-dev

production-build: ## 本番用ビルド
	@echo "🏭 本番用ビルド中..."
	NODE_ENV=production npm run build
	npm prune --production

staging-deploy: test lint docker-build deploy-staging ## ステージング環境への完全デプロイ
	@echo "✅ ステージング環境デプロイ完了"

production-deploy: test lint docker-build deploy-production ## 本番環境への完全デプロイ
	@echo "✅ 本番環境デプロイ完了"

# ================================
# CI/CD関連
# ================================

ci-test: ## CI用テスト（軽量版）
	@echo "🧪 CI用テスト実行中..."
	npm run lint
	npm run typecheck
	npm run test -- --ci --coverage --watchAll=false

ci-build: ## CI用ビルド
	@echo "🔨 CI用ビルド中..."
	NODE_ENV=production npm run build

ci-security: ## CI用セキュリティチェック
	@echo "🔒 CI用セキュリティチェック中..."
	npm audit --audit-level=high
	npx snyk test

# ================================
# ユーティリティ
# ================================

port-check: ## ポート使用状況をチェック
	@echo "🔍 ポート$(PORT)の使用状況:"
	@lsof -i :$(PORT) || echo "ポート$(PORT)は使用されていません"

kill-port: ## 指定ポートのプロセスを終了
	@echo "💀 ポート$(PORT)のプロセスを終了中..."
	@lsof -ti:$(PORT) | xargs kill -9 || echo "ポート$(PORT)にプロセスが見つかりません"

env-check: ## 環境変数をチェック
	@echo "🔍 環境変数チェック:"
	@echo "NODE_ENV: $(NODE_ENV)"
	@echo "PORT: $(PORT)"
	@echo "DB_HOST: $${DB_HOST:-未設定}"
	@echo "DB_NAME: $${DB_NAME:-未設定}"

backup-rotate: ## 古いバックアップを削除（30日以上）
	@echo "🗑️ 古いバックアップ削除中..."
	find backups/ -name "*.sql" -mtime +30 -delete 2>/dev/null || true

# ================================
# 特殊ターゲット
# ================================

version: ## バージョン情報を表示
	@echo "料理原価計算システム v2.0.0"
	@echo "Node.js: $(shell node --version)"
	@echo "NPM: $(shell npm --version)"

quick-start: setup db-create db-migrate db-seed dev ## クイックスタート（初回用）
	@echo "🎉 クイックスタート完了！"
	@echo "ブラウザで http://localhost:$(PORT) にアクセスしてください"
