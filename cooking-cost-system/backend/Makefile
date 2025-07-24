# 料理原価計算システム - Makefile
# 開発・運用タスクの自動化

.PHONY: help install build test lint clean dev prod backup restore logs

# デフォルトターゲット
.DEFAULT_GOAL := help

# 変数定義
PROJECT_NAME := cooking-cost-system
BACKEND_DIR := backend
DOCKER_COMPOSE_DEV := docker-compose -f docker-compose.yml -f docker-compose.dev.yml
DOCKER_COMPOSE_PROD := docker-compose -f docker-compose.yml -f docker-compose.prod.yml
DOCKER_COMPOSE_TEST := docker-compose -f docker-compose.yml -f docker-compose.test.yml

# カラー定義
RED := \033[31m
GREEN := \033[32m
YELLOW := \033[33m
BLUE := \033[34m
MAGENTA := \033[35m
CYAN := \033[36m
WHITE := \033[37m
RESET := \033[0m

# ================================
# ヘルプ
# ================================
help: ## このヘルプメッセージを表示
	@echo "$(CYAN)料理原価計算システム - 開発コマンド$(RESET)"
	@echo "$(CYAN)=====================================$(RESET)"
	@echo ""
	@echo "$(YELLOW)開発関連:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "(install|dev|build|test|lint)"
	@echo ""
	@echo "$(YELLOW)運用関連:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "(prod|backup|restore|logs)"
	@echo ""
	@echo "$(YELLOW)ユーティリティ:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "(clean|check|init)"

# ================================
# セットアップ・インストール
# ================================
install: ## 依存関係をインストール
	@echo "$(BLUE)依存関係をインストール中...$(RESET)"
	cd $(BACKEND_DIR) && npm ci
	@echo "$(GREEN)✅ インストール完了$(RESET)"

install-dev: ## 開発用依存関係をインストール
	@echo "$(BLUE)開発用依存関係をインストール中...$(RESET)"
	cd $(BACKEND_DIR) && npm install
	@echo "$(GREEN)✅ 開発用インストール完了$(RESET)"

init: ## プロジェクト初期化
	@echo "$(BLUE)プロジェクトを初期化中...$(RESET)"
	@make install
	@make setup-env
	@make setup-dirs
	@echo "$(GREEN)✅ プロジェクト初期化完了$(RESET)"

setup-env: ## 環境変数ファイルをセットアップ
	@echo "$(BLUE)環境変数ファイルをセットアップ中...$(RESET)"
	@if [ ! -f $(BACKEND_DIR)/.env ]; then \
		cp $(BACKEND_DIR)/.env.example $(BACKEND_DIR)/.env; \
		echo "$(YELLOW)⚠️  .env ファイルを作成しました。適切な値に設定してください。$(RESET)"; \
	else \
		echo "$(GREEN)✅ .env ファイルは既に存在します$(RESET)"; \
	fi

setup-dirs: ## 必要なディレクトリを作成
	@echo "$(BLUE)ディレクトリを作成中...$(RESET)"
	@mkdir -p $(BACKEND_DIR)/logs
	@mkdir -p $(BACKEND_DIR)/uploads
	@mkdir -p $(BACKEND_DIR)/backups
	@mkdir -p $(BACKEND_DIR)/temp
	@echo "$(GREEN)✅ ディレクトリ作成完了$(RESET)"

# ================================
# 開発環境
# ================================
dev: ## 開発環境を起動
	@echo "$(BLUE)開発環境を起動中...$(RESET)"
	$(DOCKER_COMPOSE_DEV) up --build

dev-daemon: ## 開発環境をバックグラウンドで起動
	@echo "$(BLUE)開発環境をバックグラウンドで起動中...$(RESET)"
	$(DOCKER_COMPOSE_DEV) up -d --build
	@echo "$(GREEN)✅ 開発環境が起動しました$(RESET)"
	@echo "$(CYAN)API: http://localhost:3001$(RESET)"
	@echo "$(CYAN)phpMyAdmin: http://localhost:8080$(RESET)"
	@echo "$(CYAN)Redis Commander: http://localhost:8081$(RESET)"
	@echo "$(CYAN)MailHog: http://localhost:8025$(RESET)"

dev-local: ## ローカルで開発サーバーを起動
	@echo "$(BLUE)ローカル開発サーバーを起動中...$(RESET)"
	cd $(BACKEND_DIR) && npm run dev

dev-stop: ## 開発環境を停止
	@echo "$(BLUE)開発環境を停止中...$(RESET)"
	$(DOCKER_COMPOSE_DEV) down
	@echo "$(GREEN)✅ 開発環境を停止しました$(RESET)"

dev-restart: ## 開発環境を再起動
	@make dev-stop
	@make dev-daemon

# ================================
# ビルド・テスト
# ================================
build: ## アプリケーションをビルド
	@echo "$(BLUE)アプリケーションをビルド中...$(RESET)"
	cd $(BACKEND_DIR) && npm run build
	@echo "$(GREEN)✅ ビルド完了$(RESET)"

test: ## テストを実行
	@echo "$(BLUE)テストを実行中...$(RESET)"
	cd $(BACKEND_DIR) && npm test
	@echo "$(GREEN)✅ テスト完了$(RESET)"

test-watch: ## テストを監視モードで実行
	@echo "$(BLUE)テスト監視モードを開始中...$(RESET)"
	cd $(BACKEND_DIR) && npm run test:watch

test-coverage: ## カバレッジレポート付きでテスト実行
	@echo "$(BLUE)カバレッジテストを実行中...$(RESET)"
	cd $(BACKEND_DIR) && npm run test:coverage
	@echo "$(GREEN)✅ カバレッジテスト完了$(RESET)"

test-integration: ## 統合テストを実行
	@echo "$(BLUE)統合テストを実行中...$(RESET)"
	$(DOCKER_COMPOSE_TEST) up --build --abort-on-container-exit
	$(DOCKER_COMPOSE_TEST) down -v
	@echo "$(GREEN)✅ 統合テスト完了$(RESET)"

# ================================
# コード品質
# ================================
lint: ## コードの静的解析を実行
	@echo "$(BLUE)Lintを実行中...$(RESET)"
	cd $(BACKEND_DIR) && npm run lint
	@echo "$(GREEN)✅ Lint完了$(RESET)"

lint-fix: ## コードの自動修正を実行
	@echo "$(BLUE)コードを自動修正中...$(RESET)"
	cd $(BACKEND_DIR) && npm run lint:fix
	@echo "$(GREEN)✅ 自動修正完了$(RESET)"

typecheck: ## TypeScriptの型チェック
	@echo "$(BLUE)型チェックを実行中...$(RESET)"
	cd $(BACKEND_DIR) && npm run typecheck
	@echo "$(GREEN)✅ 型チェック完了$(RESET)"

check: ## 全ての品質チェックを実行
	@echo "$(BLUE)全ての品質チェックを実行中...$(RESET)"
	@make typecheck
	@make lint
	@make test
	@echo "$(GREEN)✅ 全ての品質チェック完了$(RESET)"

# ================================
# 本番環境
# ================================
prod: ## 本番環境を起動
	@echo "$(BLUE)本番環境を起動中...$(RESET)"
	$(DOCKER_COMPOSE_PROD) up --build

prod-daemon: ## 本番環境をバックグラウンドで起動
	@echo "$(BLUE)本番環境をバックグラウンドで起動中...$(RESET)"
	$(DOCKER_COMPOSE_PROD) up -d --build
	@echo "$(GREEN)✅ 本番環境が起動しました$(RESET)"

prod-stop: ## 本番環境を停止
	@echo "$(BLUE)本番環境を停止中...$(RESET)"
	$(DOCKER_COMPOSE_PROD) down
	@echo "$(GREEN)✅ 本番環境を停止しました$(RESET)"

prod-restart: ## 本番環境を再起動
	@make prod-stop
	@make prod-daemon

# ================================
# データベース
# ================================
db-migrate: ## データベースマイグレーションを実行
	@echo "$(BLUE)データベースマイグレーションを実行中...$(RESET)"
	cd $(BACKEND_DIR) && npm run db:migrate
	@echo "$(GREEN)✅ マイグレーション完了$(RESET)"

db-seed: ## サンプルデータを投入
	@echo "$(BLUE)サンプルデータを投入中...$(RESET)"
	docker exec -i cooking_cost_db_dev mysql -ucooking_user -pcooking_password cooking_cost_system < $(BACKEND_DIR)/database/init/02_sample_data.sql
	@echo "$(GREEN)✅ サンプルデータ投入完了$(RESET)"

db-reset: ## データベースをリセット
	@echo "$(BLUE)データベースをリセット中...$(RESET)"
	docker exec -i cooking_cost_db_dev mysql -ucooking_user -pcooking_password cooking_cost_system < $(BACKEND_DIR)/database/init/01_create_tables.sql
	@make db-seed
	@echo "$(GREEN)✅ データベースリセット完了$(RESET)"

db-backup: ## データベースバックアップ
	@echo "$(BLUE)データベースバックアップを実行中...$(RESET)"
	$(BACKEND_DIR)/scripts/backup.sh
	@echo "$(GREEN)✅ バックアップ完了$(RESET)"

# ================================
# バックアップ・リストア
# ================================
backup: ## 完全バックアップを実行
	@echo "$(BLUE)完全バックアップを実行中...$(RESET)"
	cd $(BACKEND_DIR) && ./scripts/backup.sh
	@echo "$(GREEN)✅ バックアップ完了$(RESET)"

restore: ## バックアップからリストア
	@echo "$(BLUE)バックアップからリストア中...$(RESET)"
	@echo "$(YELLOW)使用方法: make restore BACKUP_FILE=backup_file.sql.gz$(RESET)"
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "$(RED)❌ BACKUP_FILEを指定してください$(RESET)"; \
		exit 1; \
	fi
	cd $(BACKEND_DIR) && ./scripts/restore.sh $(BACKUP_FILE)
	@echo "$(GREEN)✅ リストア完了$(RESET)"

# ================================
# ログ・監視
# ================================
logs: ## 全サービスのログを表示
	$(DOCKER_COMPOSE_DEV) logs -f

logs-api: ## APIサーバーのログを表示
	$(DOCKER_COMPOSE_DEV) logs -f backend

logs-db: ## データベースのログを表示
	$(DOCKER_COMPOSE_DEV) logs -f database

logs-nginx: ## Nginxのログを表示
	$(DOCKER_COMPOSE_DEV) logs -f nginx-dev

status: ## サービスの状態を確認
	@echo "$(BLUE)サービスの状態を確認中...$(RESET)"
	$(DOCKER_COMPOSE_DEV) ps
	@echo ""
	@echo "$(BLUE)ヘルスチェック:$(RESET)"
	@curl -s http://localhost:3001/health | jq . || echo "$(RED)❌ APIサーバーに接続できません$(RESET)"

# ================================
# メンテナンス
# ================================
maintenance: ## メンテナンス作業を実行
	@echo "$(BLUE)メンテナンス作業を実行中...$(RESET)"
	cd $(BACKEND_DIR) && ./scripts/maintenance.sh all
	@echo "$(GREEN)✅ メンテナンス完了$(RESET)"

optimize: ## データベース最適化
	@echo "$(BLUE)データベースを最適化中...$(RESET)"
	cd $(BACKEND_DIR) && ./scripts/maintenance.sh optimize
	@echo "$(GREEN)✅ 最適化完了$(RESET)"

# ================================
# クリーンアップ
# ================================
clean: ## 一時ファイルとキャッシュを削除
	@echo "$(BLUE)クリーンアップ中...$(RESET)"
	cd $(BACKEND_DIR) && rm -rf node_modules dist coverage temp logs/*.log
	docker system prune -f
	@echo "$(GREEN)✅ クリーンアップ完了$(RESET)"

clean-all: ## 全てのDockerリソースを削除
	@echo "$(BLUE)全てのDockerリソースを削除中...$(RESET)"
	$(DOCKER_COMPOSE_DEV) down -v --rmi all
	$(DOCKER_COMPOSE_PROD) down -v --rmi all
	docker system prune -af --volumes
	@echo "$(GREEN)✅ 全てのリソースを削除しました$(RESET)"

# ================================
# デプロイメント
# ================================
deploy-staging: ## ステージング環境にデプロイ
	@echo "$(BLUE)ステージング環境にデプロイ中...$(RESET)"
	@make check
	@make build
	@echo "$(GREEN)✅ ステージングデプロイ完了$(RESET)"

deploy-prod: ## 本番環境にデプロイ
	@echo "$(BLUE)本番環境にデプロイ中...$(RESET)"
	@echo "$(RED)⚠️  本番デプロイは慎重に行ってください$(RESET)"
	@read -p "本当に本番環境にデプロイしますか? [y/N]: " confirm && [ "$$confirm" = "y" ]
	@make check
	@make backup
	@make build
	@echo "$(GREEN)✅ 本番デプロイ完了$(RESET)"

# ================================
# 開発ツール
# ================================
shell: ## コンテナにシェルでアクセス
	docker exec -it cooking_cost_backend_dev sh

db-shell: ## データベースにアクセス
	docker exec -it cooking_cost_db_dev mysql -ucooking_user -pcooking_password cooking_cost_system

redis-cli: ## Redis CLIにアクセス
	docker exec -it cooking_cost_redis_dev redis-cli

generate-docs: ## API ドキュメントを生成
	@echo "$(BLUE)API ドキュメントを生成中...$(RESET)"
	cd $(BACKEND_DIR) && npm run docs:generate
	@echo "$(GREEN)✅ ドキュメント生成完了$(RESET)"

# ================================
# 監視・分析
# ================================
performance: ## パフォーマンステストを実行
	@echo "$(BLUE)パフォーマンステストを実行中...$(RESET)"
	cd $(BACKEND_DIR)/tests/performance && k6 run performance-test.js
	@echo "$(GREEN)✅ パフォーマンステスト完了$(RESET)"

security-scan: ## セキュリティスキャンを実行
	@echo "$(BLUE)セキュリティスキャンを実行中...$(RESET)"
	cd $(BACKEND_DIR) && npm audit
	@echo "$(GREEN)✅ セキュリティスキャン完了$(RESET)"

analyze: ## コード分析を実行
	@echo "$(BLUE)コード分析を実行中...$(RESET)"
	cd $(BACKEND_DIR) && npm run analyze
	@echo "$(GREEN)✅ コード分析完了$(RESET)"

# ================================
# ユーティリティ
# ================================
update-deps: ## 依存関係を更新
	@echo "$(BLUE)依存関係を更新中...$(RESET)"
	cd $(BACKEND_DIR) && npm update
	@echo "$(GREEN)✅ 依存関係更新完了$(RESET)"

check-outdated: ## 古くなった依存関係をチェック
	@echo "$(BLUE)古くなった依存関係をチェック中...$(RESET)"
	cd $(BACKEND_DIR) && npm outdated

version: ## バージョン情報を表示
	@echo "$(CYAN)料理原価計算システム v2.0.0$(RESET)"
	@echo "$(BLUE)Node.js:$(RESET) $(shell node --version)"
	@echo "$(BLUE)npm:$(RESET) $(shell npm --version)"
	@echo "$(BLUE)Docker:$(RESET) $(shell docker --version)"
	@echo "$(BLUE)Docker Compose:$(RESET) $(shell docker-compose --version)"

# ================================
# ヘルパー関数
# ================================
.PHONY: _check-env
_check-env:
	@if [ ! -f $(BACKEND_DIR)/.env ]; then \
		echo "$(RED)❌ .env ファイルが見つかりません。make setup-env を実行してください$(RESET)"; \
		exit 1; \
	fi
