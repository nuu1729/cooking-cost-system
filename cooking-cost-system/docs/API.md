# 🍽️ 料理原価計算システム API 仕様書

## 概要

料理原価計算システム v2.0 の REST API 仕様書です。

### ベースURL
- 開発環境: `http://localhost:3001/api`
- 本番環境: `https://your-domain.com/api`

### 認証
現在のバージョンでは認証は実装されていませんが、将来的に JWT ベースの認証を予定しています。

### レスポンス形式
全てのAPIレスポンスは以下の形式に従います：

```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

エラー時：
```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## エンドポイント

### 食材 (Ingredients)

#### GET /api/ingredients
食材一覧を取得

**クエリパラメータ:**
- `name` (string): 食材名での部分検索
- `store` (string): 店舗名での部分検索
- `genre` (string): ジャンルでのフィルタ
- `sortBy` (string): ソート項目 (name, price, unit_price, created_at)
- `sortOrder` (string): ソート順 (ASC, DESC)
- `limit` (number): 取得件数
- `offset` (number): オフセット

**レスポンス例:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "鶏もも肉",
      "store": "DIO",
      "quantity": 300,
      "unit": "g",
      "price": 250,
      "unit_price": 0.8333,
      "genre": "meat",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### POST /api/ingredients
食材を新規作成

**リクエストボディ:**
```json
{
  "name": "鶏もも肉",
  "store": "DIO",
  "quantity": 300,
  "unit": "g",
  "price": 250,
  "genre": "meat"
}
```

#### PUT /api/ingredients/:id
食材を更新

#### DELETE /api/ingredients/:id
食材を削除

### 料理 (Dishes)

#### GET /api/dishes
料理一覧を取得

#### GET /api/dishes/:id
料理詳細を取得（食材情報付き）

#### POST /api/dishes
料理を新規作成

**リクエストボディ:**
```json
{
  "name": "鶏の唐揚げ",
  "genre": "meat",
  "description": "定番の唐揚げ",
  "ingredients": [
    {
      "ingredient_id": 1,
      "used_quantity": 200
    }
  ]
}
```

### 完成品 (Completed Foods)

#### GET /api/foods
完成品一覧を取得

#### POST /api/foods
完成品を新規作成

**リクエストボディ:**
```json
{
  "name": "唐揚げ定食",
  "price": 650,
  "description": "人気の定食",
  "dishes": [
    {
      "dish_id": 1,
      "usage_quantity": 1.0,
      "usage_unit": "serving"
    }
  ]
}
```

### レポート (Reports)

#### GET /api/reports/dashboard
ダッシュボード統計を取得

#### GET /api/reports/genre-stats
ジャンル別統計を取得

## エラーコード

| コード | 説明 |
|--------|------|
| VALIDATION_ERROR | バリデーションエラー |
| NOT_FOUND | リソースが見つからない |
| DATABASE_ERROR | データベースエラー |
| RATE_LIMIT_EXCEEDED | レート制限超過 |
| INTERNAL_ERROR | 内部サーバーエラー |

---

# docs/DEPLOYMENT.md
# 🚀 デプロイメントガイド

## 開発環境セットアップ

### 前提条件
- Docker Desktop
- Git
- Make (推奨)

### クイックスタート
```bash
git clone 
cd cooking-cost-system
chmod +x scripts/dev-setup.sh
./scripts/dev-setup.sh
```

または

```bash
make setup
```

## 本番環境デプロイ

### AWS 環境での推奨構成

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │────│   ALB           │────│   ECS Cluster   │
│   (CDN)         │    │   (Load Balancer│    │   (Containers)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Route 53      │    │   RDS MySQL     │
                       │   (DNS)         │    │   (Database)    │
                       └─────────────────┘    └─────────────────┘
```

### 手順

1. **AWS リソースの作成**
```bash
aws cloudformation create-stack \
  --stack-name cooking-cost-system \
  --template-body file://aws/cloudformation.yml \
  --capabilities CAPABILITY_IAM
```

2. **Docker イメージのビルド**
```bash
docker-compose -f docker-compose.prod.yml build
```

3. **本番環境へのデプロイ**
```bash
./scripts/deploy.sh production
```

### 環境変数設定

本番環境では以下の環境変数を設定してください：

```bash
# バックエンド
NODE_ENV=production
DB_HOST=your-rds-endpoint
JWT_SECRET=your-jwt-secret
SENTRY_DSN=your-sentry-dsn

# フロントエンド
VITE_API_URL=https://your-domain.com/api
```

## 監視・ログ

### ヘルスチェック
- バックエンド: `GET /health`
- フロントエンド: `GET /health`

### ログ出力
```bash
# 全サービスのログ
make logs

# 特定サービスのログ
make logs-backend
make logs-frontend
```

### メトリクス
- CPU使用率
- メモリ使用率
- レスポンス時間
- エラー率

---

# scripts/test.sh
#!/bin/bash

# テスト実行スクリプト

set -e

echo "🧪 テストを実行中..."

# バックエンドテスト
echo "📡 バックエンドテスト実行中..."
cd backend
npm test -- --coverage
cd ..

# フロントエンドテスト
echo "🎨 フロントエンドテスト実行中..."
cd frontend
npm test -- --coverage
cd ..

# E2Eテスト
echo "🎯 E2Eテスト実行中..."
cd frontend
npm run test:e2e
cd ..

echo "✅ 全てのテストが完了しました"

# --------------------------------

# scripts/build.sh
#!/bin/bash

# ビルドスクリプト

set -e

echo "🔨 ビルドを実行中..."

# バックエンドビルド
echo "📡 バックエンドビルド中..."
cd backend
npm run build
cd ..

# フロントエンドビルド
echo "🎨 フロントエンドビルド中..."
cd frontend
npm run build
cd ..

echo "✅ ビルドが完了しました"

# --------------------------------

# scripts/cleanup.sh
#!/bin/bash

# クリーンアップスクリプト

set -e

echo "🧹 クリーンアップを実行中..."

# Docker リソースの削除
echo "🐳 Docker リソースを削除中..."
docker system prune -f
docker volume prune -f

# 一時ファイルの削除
echo "📄 一時ファイルを削除中..."
find . -name "*.tmp" -delete
find . -name "*.log" -delete 2>/dev/null || true

# node_modules の削除（オプション）
read -p "node_modules を削除しますか？ (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 node_modules を削除中..."
    rm -rf backend/node_modules
    rm -rf frontend/node_modules
fi

echo "✅ クリーンアップが完了しました"

# --------------------------------

# package.json (Root)
{
  "name": "cooking-cost-system",
  "version": "2.0.0",
  "description": "🍽️ 料理原価計算システム v2.0 - モダンな料理原価管理アプリケーション",
  "private": true,
  "workspaces": [
    "backend",
    "frontend"
  ],
  "scripts": {
    "dev": "make dev",
    "build": "./scripts/build.sh",
    "test": "./scripts/test.sh",
    "clean": "./scripts/cleanup.sh",
    "setup": "./scripts/dev-setup.sh",
    "deploy:staging": "./scripts/deploy.sh staging",
    "deploy:production": "./scripts/deploy.sh production",
    "backup": "./scripts/backup.sh",
    "install:all": "npm install && npm run install:backend && npm run install:frontend",
    "install:backend": "cd backend && npm install",
    "install:frontend": "cd frontend && npm install",
    "lint": "npm run lint:backend && npm run lint:frontend",
    "lint:backend": "cd backend && npm run lint",
    "lint:frontend": "cd frontend && npm run lint",
    "lint:fix": "npm run lint:backend -- --fix && npm run lint:frontend -- --fix"
  },
  "devDependencies": {
    "concurrently": "^8.2.0",
    "cross-env": "^7.0.3"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/your-username/cooking-cost-system.git"
  },
  "keywords": [
    "cooking",
    "cost-calculation",
    "restaurant",
    "food-service",
    "nodejs",
    "react",
    "typescript",
    "docker"
  ],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/your-username/cooking-cost-system/issues"
  },
  "homepage": "https://github.com/your-username/cooking-cost-system#readme"
}

# --------------------------------

# docs/TROUBLESHOOTING.md
# 🔧 トラブルシューティング

## よくある問題と解決方法

### Docker関連

#### 問題: コンテナが起動しない
```bash
# ログを確認
docker-compose logs

# 個別サービスのログ
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database
```

#### 問題: ポートが既に使用されている
```bash
# ポート使用状況確認
lsof -i :3000
lsof -i :3001
lsof -i :3306

# プロセス終了
kill -9 
```

### データベース関連

#### 問題: データベース接続エラー
1. MySQL コンテナが起動しているか確認
2. 環境変数が正しく設定されているか確認
3. ネットワーク設定を確認

#### 問題: データが消失した
```bash
# バックアップから復元
docker-compose exec -T database mysql -u cooking_user -pcooking_password cooking_cost_system < backups/backup_YYYYMMDD.sql
```

### パフォーマンス関連

#### 問題: 動作が重い
1. Docker Desktop のリソース割り当てを確認
2. 不要なコンテナを停止
3. システムリソースを確認

### 開発関連

#### 問題: ホットリロードが動作しない
1. ファイル監視の設定を確認
2. Dockerのボリュームマウントを確認
3. Node.js のバージョンを確認

## ログファイルの場所

- アプリケーションログ: `logs/app.log`
- エラーログ: `logs/error.log`
- アクセスログ: `logs/access.log`
- Docker ログ: `docker-compose logs`

## サポート

問題が解決しない場合は、以下の情報と共にIssueを作成してください：

1. 環境情報（OS、Docker バージョンなど）
2. エラーメッセージ
3. 再現手順
4. ログファイル