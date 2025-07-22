# 🍽️ 料理原価計算システム v2.0

> **食材管理から完成品まで、包括的な原価計算を実現するモダンWebアプリケーション**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-orange)](https://mysql.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)

## 🚀 概要

料理原価計算システムv2.0は、Node.js + React + TypeScriptで完全に再構築された、モダンで高機能な原価管理Webアプリケーションです。飲食業界や家庭での料理原価管理を効率化し、直感的なドラッグ&ドロップ操作で簡単に原価計算ができます。

### ✨ 主な特徴

- **🎨 モダンUI**: React + Material-UI によるレスポンシブデザイン
- **🖱️ ドラッグ&ドロップ**: 直感的な操作で料理・完成品作成
- **⚡ リアルタイム計算**: 原価・利益率の即座に計算
- **📊 データ分析**: 統計・グラフ・レポート機能
- **🔒 セキュリティ**: TypeScript + バリデーションによる堅牢性
- **📱 レスポンシブ**: PC・タブレット・スマートフォン完全対応
- **🐳 Docker対応**: コンテナ化による簡単デプロイ
- **☁️ クラウド準備完了**: AWS対応のインフラ構成

## 🏗️ アーキテクチャ

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │────│   Backend API    │────│   Database      │
│   React + TS    │    │   Node.js + TS   │    │   MySQL 8.0     │
│   Material-UI   │    │   Express        │    │   (Container)   │
│   React Query   │    │   TypeORM        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Docker        │    │   Docker         │    │   Docker        │
│   Container     │    │   Container      │    │   Container     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🎯 機能一覧

### 1. 食材管理 🛒
- ✅ 食材の登録・編集・削除
- ✅ 購入場所・価格・数量管理
- ✅ ジャンル別分類（肉・野菜・調味料・ソース・冷凍・ドリンク）
- ✅ 単価自動計算
- ✅ 検索・フィルタリング機能

### 2. 料理作成 🍳
- ✅ 食材をドラッグ&ドロップで料理作成
- ✅ 使用量と原価の自動計算
- ✅ 料理の保存・管理
- ✅ レシピ情報の表示

### 3. 完成品管理 🏆
- ✅ 料理を組み合わせて完成品作成
- ✅ 販売価格設定
- ✅ 利益率自動計算
- ✅ 原価分析・詳細表示

### 4. 分析・レポート 📊
- ✅ 統計ダッシュボード
- ✅ ジャンル別分布チャート
- ✅ コスト効率分析
- ✅ 管理者パネル

## 🚀 クイックスタート

### 前提条件
- [Docker Desktop](https://www.docker.com/products/docker-desktop) がインストール済み
- [Git](https://git-scm.com/) がインストール済み

### 30秒でスタート！

```bash
# 1. リポジトリクローン
git clone <repository-url>
cd cooking-cost-system

# 2. 環境変数設定
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Docker起動（全て自動セットアップ）
make dev
# または
docker-compose up -d

# 4. アクセス
echo "🎉 セットアップ完了！"
echo "📱 フロントエンド: http://localhost:3000"
echo "🔧 API: http://localhost:3001"
echo "🗄️ phpMyAdmin: http://localhost:8080"
```

### 手動セットアップ（詳細制御したい場合）

<details>
<summary>展開して表示</summary>

```bash
# Node.js環境でのセットアップ
# 1. バックエンド
cd backend
npm install
npm run build
npm start

# 2. フロントエンド（別ターミナル）
cd frontend
npm install
npm run build
npm run preview

# 3. データベース（MySQL 8.0）
mysql -u root -p
CREATE DATABASE cooking_cost_system;
SOURCE setup.sql;
```

</details>

## 📁 プロジェクト構成

```
cooking-cost-system/
├── 📂 backend/                    # Node.js Express API
│   ├── 📂 src/
│   │   ├── 📂 routes/             # APIエンドポイント
│   │   ├── 📂 models/             # データモデル
│   │   ├── 📂 services/           # ビジネスロジック
│   │   └── 📄 app.ts              # Express アプリ
│   └── 📄 package.json
│
├── 📂 frontend/                   # React TypeScript SPA
│   ├── 📂 src/
│   │   ├── 📂 components/         # React コンポーネント
│   │   ├── 📂 pages/              # ページコンポーネント
│   │   ├── 📂 services/           # API通信
│   │   └── 📄 App.tsx             # メインアプリ
│   └── 📄 package.json
│
├── 📄 docker-compose.yml          # 開発環境
├── 📄 setup.sql                   # DB初期化
├── 📄 Makefile                    # タスク自動化
└── 📄 README.md                   # このファイル
```

## 🎮 使用方法

### 基本ワークフロー

1. **食材登録** 🛒
   - ➕ボタンで食材追加
   - 名前、店舗、数量、価格、ジャンルを入力

2. **料理作成** 🍳
   - 食材を料理作成エリアにドラッグ&ドロップ
   - 使用量を入力して料理を保存

3. **完成品登録** 🏆
   - 料理を完成品エリアにドラッグ&ドロップ
   - 販売価格を設定して利益率を確認

4. **分析確認** 📊
   - 管理画面で統計・グラフを確認
   - 利益率や効率性を分析

### キーボードショートカット

| 操作 | ショートカット |
|------|-------------|
| 食材追加 | `Ctrl + N` |
| データ保存 | `Ctrl + S` |
| モーダル閉じる | `Esc` |

## 🔧 開発者向け情報

### 利用可能なコマンド

```bash
make help          # ヘルプ表示
make dev           # 開発環境起動
make build         # ビルド
make test          # テスト実行
make logs          # ログ表示
make clean         # クリーンアップ
make backend-shell # バックエンドコンテナ接続
make db-shell      # データベース接続
```

### API エンドポイント

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/ingredients` | 食材一覧取得 |
| POST | `/api/ingredients` | 食材追加 |
| PUT | `/api/ingredients/:id` | 食材更新 |
| DELETE | `/api/ingredients/:id` | 食材削除 |
| GET | `/api/dishes` | 料理一覧取得 |
| POST | `/api/dishes` | 料理作成 |
| GET | `/api/foods` | 完成品一覧取得 |
| POST | `/api/foods` | 完成品登録 |

### 環境変数

#### Backend (.env)
```bash
NODE_ENV=development
PORT=3001
DB_HOST=database
DB_USER=cooking_user
DB_PASSWORD=cooking_password
DB_NAME=cooking_cost_system
JWT_SECRET=your-secret-key
```

#### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3001/api
VITE_APP_TITLE=料理原価計算システム
```

## 🐳 Docker デプロイ

### 開発環境
```bash
docker-compose up -d
```

### 本番環境
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### AWS デプロイ
詳細な AWS デプロイ手順は [AWS デプロイメントガイド](docs/DEPLOYMENT.md) を参照してください。

## 🧪 テスト

```bash
# 全テスト実行
make test

# バックエンドテスト
docker-compose exec backend npm test

# フロントエンドテスト
docker-compose exec frontend npm test

# カバレッジ確認
docker-compose exec frontend npm run test:coverage
```

## 📊 パフォーマンス

- **初期ロード時間**: < 2秒
- **API レスポンス**: < 100ms
- **メモリ使用量**: < 512MB
- **同時接続数**: 100+

## 🔐 セキュリティ

- ✅ SQLインジェクション対策
- ✅ XSS対策
- ✅ CSRF対策
- ✅ 入力値検証
- ✅ レート制限
- ✅ HTTPS対応

## 🤝 貢献

1. Fork このリポジトリ
2. フィーチャーブランチ作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Request 作成

## 📄 ライセンス

このプロジェクトは MIT License の下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🙏 謝辞

- [React](https://reactjs.org/) - UI フレームワーク
- [Material-UI](https://mui.com/) - UI コンポーネント
- [Node.js](https://nodejs.org/) - バックエンドランタイム
- [Express](https://expressjs.com/) - Web フレームワーク
- [MySQL](https://mysql.com/) - データベース
- [Docker](https://docker.com/) - コンテナ化

## 📞 サポート

- 📧 Email: haya.take23@icloud.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 📖 Documentation: [Wiki](https://github.com/your-repo/wiki)

---

<div align="center">

**🍽️ 料理原価計算システム v2.0**

Made with ❤️ using modern web technologies

[⬆ Back to top](#料理原価計算システム-v20)

</div>