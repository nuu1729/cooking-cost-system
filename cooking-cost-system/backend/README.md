# 料理原価計算システム バックエンドAPI

モダンな料理原価計算システムのRESTful APIサーバーです。レストランや料理教室などで食材コストを効率的に管理し、料理の原価と利益率を正確に算出することができます。

## システム概要

このシステムは食材の購入情報から料理の原価を計算し、最終的な完成品の利益率を分析する包括的なコスト管理ソリューションです。TypeScriptとExpressを基盤として、高いパフォーマンスと開発効率を実現しています。

## 主要機能

食材管理機能では食材の購入情報（価格、数量、単位）を登録し、自動的に単価を計算します。料理管理機能では使用する食材とその分量から料理の総原価を算出します。完成品管理機能では複数の料理を組み合わせた完成品の原価と利益率を計算します。レポート機能では詳細な統計情報とコスト分析を提供し、経営判断をサポートします。

## 技術仕様

バックエンドはNode.js 18以上、TypeScript 5.1、Express.js 4.18を使用して構築されています。データベースはMySQL 8.0を採用し、認証とセッション管理にはRedisを活用しています。ファイル処理にはMulterを使用し、ログ管理にはWinstonを導入しています。バリデーションはJoiで実装し、テストフレームワークにはJestを使用しています。

## 環境要件

Node.js 18.0.0以上、MySQL 8.0以上、Redis 7.0以上（オプション）、Docker及びDocker Compose（推奨）が必要です。

## セットアップ手順

### Docker環境での起動（推奨）

プロジェクトをクローンした後、環境変数ファイルを作成します。

```bash
git clone 
cd cooking-cost-system/backend
cp .env.example .env
```

環境変数を適切に設定した後、Dockerコンテナを起動します。

```bash
# 開発環境での起動
docker-compose up backend-dev

# 本番環境での起動
docker-compose --profile production up backend-prod

# 管理ツール付きで起動
docker-compose --profile tools up
```

### ローカル環境でのセットアップ

依存関係をインストールし、データベースの準備を行います。

```bash
# 依存関係のインストール
npm install

# データベースの作成と初期化
mysql -u root -p < database/init/01_create_tables.sql

# 開発サーバーの起動
npm run dev
```

## 環境変数設定

以下の環境変数を .env ファイルで設定する必要があります。

```env
NODE_ENV=development
PORT=3001

# データベース設定
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cooking_cost_system
DB_USER=cooking_user
DB_PASSWORD=cooking_password

# セキュリティ設定
JWT_SECRET=your-secure-jwt-secret
CORS_ORIGIN=http://localhost:3000

# ファイルアップロード設定
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# ログ設定
LOG_LEVEL=info
```

## API エンドポイント

### 食材管理 (/api/ingredients)

GET /api/ingredients では食材一覧の取得が可能で、検索パラメータによる絞り込みに対応しています。POST /api/ingredients では新しい食材の登録を行います。PUT /api/ingredients/:id では既存食材の更新を、DELETE /api/ingredients/:id では食材の削除を実行します。

### 料理管理 (/api/dishes)

GET /api/dishes では料理一覧を取得でき、食材情報も含めて表示されます。POST /api/dishes では使用する食材を指定して新しい料理を作成します。料理の更新と削除も同様のRESTfulな操作で実行できます。

### 完成品管理 (/api/foods)

GET /api/foods では完成品の一覧取得と利益率の計算結果を確認できます。POST /api/foods では複数の料理を組み合わせた完成品を作成し、自動的に総原価と利益率を算出します。

### レポート機能 (/api/reports)

GET /api/reports/dashboard ではダッシュボード用の統計情報を取得できます。GET /api/reports/genre-stats ではジャンル別の分析データを提供します。GET /api/reports/cost-trends ではコストの推移データを確認できます。

## 開発用コマンド

```bash
# 開発サーバーの起動
npm run dev

# TypeScriptのビルド
npm run build

# 本番サーバーの起動
npm start

# テストの実行
npm test

# テストの監視モード
npm run test:watch

# カバレッジレポートの生成
npm run test:coverage

# コードの静的解析
npm run lint

# コードの自動修正
npm run lint:fix

# 型チェック
npm run typecheck
```

## データベース設計

ingredientsテーブルでは食材の基本情報と価格情報を管理し、dishesテーブルでは料理の基本情報を格納します。dish_ingredientsテーブルは料理と食材の関連を管理し、completed_foodsテーブルでは完成品の情報を保持します。food_dishesテーブルは完成品と料理の関連を定義し、memosテーブルではメモ機能を提供します。

## ログ管理

アプリケーションのログは logs ディレクトリに保存され、日別にローテーションされます。エラーログ、アクセスログ、アプリケーションログが分離されており、本番環境では適切なログレベルで出力されます。

## セキュリティ対策

CORS設定による適切なオリジン制限、Helmetによるセキュリティヘッダーの設定、レート制限による過剰なリクエストの防止、入力値の厳密なバリデーション、SQLインジェクション対策が実装されています。

## パフォーマンス最適化

データベースクエリの最適化、適切なインデックスの設定、レスポンス圧縮の有効化、ファイルアップロードの制限、メモリ使用量の監視が実装されています。

## トラブルシューティング

データベース接続エラーが発生する場合は、MySQL サービスの起動状況と認証情報を確認してください。ポートの競合が発生する場合は、docker-compose.yml のポート設定を変更してください。ファイルアップロードエラーが発生する場合は、uploads ディレクトリの権限とディスク容量を確認してください。

## 貢献とサポート

バグ報告や機能要望は GitHub Issues で受け付けています。プルリクエストを送信する前に、既存のテストが通過することを確認し、新しい機能には適切なテストを追加してください。

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細はLICENSEファイルを参照してください。
