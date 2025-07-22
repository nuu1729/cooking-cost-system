# cooking-cost-system/Makefile
# 料理原価計算システム v2.0 タスク自動化

.PHONY: help dev build test clean logs backend-shell db-shell frontend-shell stop restart

# デフォルトターゲット
help: ## ヘルプを表示
	@echo "🍽️ 料理原価計算システム v2.0"
	@echo ""
	@echo "利用可能なコマンド:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# 開発環境
dev: ## 開発環境を起動
	@echo "🚀 開発環境を起動しています..."
	docker-compose up -d
	@echo "✅ 起動完了！"
	@echo "📱 フロントエンド: http://localhost:3000"
	@echo "🔧 API: http://localhost:3001"
	@echo "🗄️ phpMyAdmin: http://localhost:8080"

# 本番環境
prod: ## 本番環境を起動
	@echo "🚀 本番環境を起動しています..."
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✅ 起動完了！"

# ビルド
build: ## イメージをビルド
	@echo "🔨 イメージをビルドしています..."
	docker-compose build
	@echo "✅ ビルド完了！"

# テスト実行
test: ## テストを実行
	@echo "🧪 テストを実行しています..."
	docker-compose exec backend npm test
	docker-compose exec frontend npm test
	@echo "✅ テスト完了！"

# ログ表示
logs: ## ログを表示
	docker-compose logs -f

# バックエンドログ
backend-logs: ## バックエンドログを表示
	docker-compose logs -f backend

# フロントエンドログ
frontend-logs: ## フロントエンドログを表示
	docker-compose logs -f frontend

# データベースログ
db-logs: ## データベースログを表示
	docker-compose logs -f database

# シェル接続
backend-shell: ## バックエンドコンテナに接続
	docker-compose exec backend sh

frontend-shell: ## フロントエンドコンテナに接続
	docker-compose exec frontend sh

db-shell: ## データベースに接続
	docker-compose exec database mysql -u cooking_user -p cooking_cost_system

# 停止・再起動
stop: ## サービスを停止
	@echo "⏹️ サービスを停止しています..."
	docker-compose down
	@echo "✅ 停止完了！"

restart: ## サービスを再起動
	@echo "🔄 サービスを再起動しています..."
	docker-compose restart
	@echo "✅ 再起動完了！"

# クリーンアップ
clean: ## コンテナとボリュームを削除
	@echo "🧹 クリーンアップしています..."
	docker-compose down -v
	docker system prune -f
	@echo "✅ クリーンアップ完了！"

# データリセット
reset-db: ## データベースをリセット
	@echo "⚠️ データベースをリセットしています..."
	docker-compose down
	docker volume rm cooking-cost-system_db_data || true
	docker-compose up -d database
	@echo "✅ データベースリセット完了！"

# バックアップ
backup: ## データベースをバックアップ
	@echo "💾 データベースをバックアップしています..."
	mkdir -p backups
	docker-compose exec database mysqldump -u cooking_user -pcooking_password cooking_cost_system > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ バックアップ完了！"

# インストール
install: ## 初回セットアップ
	@echo "🛠️ 初回セットアップを実行しています..."
	cp .env.example .env || true
	cp backend/.env.example backend/.env || true  
	cp frontend/.env.example frontend/.env || true
	docker-compose build
	docker-compose up -d
	@echo "⏳ データベース初期化を待機中..."
	sleep 30
	@echo "✅ セットアップ完了！"
	@echo "📱 http://localhost:3000 にアクセスしてください"

# アップデート
update: ## システムを更新
	@echo "🔄 システムを更新しています..."
	git pull origin main
	docker-compose build
	docker-compose up -d
	@echo "✅ 更新完了！"

# ステータス確認
status: ## サービス状態を確認
	@echo "📊 サービス状態:"
	docker-compose ps

# 統計情報
stats: ## システム統計を表示
	@echo "📈 システム統計:"
	docker stats --no-stream

# 開発用 - ホットリロード有効化
dev-watch: ## 開発モード（ファイル監視）
	docker-compose -f docker-compose.yml up --build

# 本番デプロイ準備
deploy-prep: ## 本番デプロイ準備
	@echo "📦 本番デプロイ準備..."
	docker-compose -f docker-compose.prod.yml build
	@echo "✅ 準備完了！"

# セキュリティスキャン
security-scan: ## セキュリティスキャン実行
	@echo "🔒 セキュリティスキャンを実行..."
	docker run --rm -v $(PWD):/app securecodewarrior/docker-security-scan /app

# 依存関係更新
update-deps: ## 依存関係を更新
	@echo "📦 依存関係を更新..."
	docker-compose exec backend npm update
	docker-compose exec frontend npm update
	@echo "✅ 更新完了！"

# パフォーマンステスト
perf-test: ## パフォーマンステスト実行
	@echo "⚡ パフォーマンステストを実行..."
	docker-compose exec frontend npm run build
	@echo "✅ パフォーマンステスト完了！"

# ドキュメント生成
docs: ## ドキュメントを生成
	@echo "📚 ドキュメントを生成..."
	docker-compose exec backend npm run docs || true
	docker-compose exec frontend npm run docs || true