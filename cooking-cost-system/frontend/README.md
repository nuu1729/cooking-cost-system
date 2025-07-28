# 🍽️ 料理原価計算システム v2.0 - Frontend

モダンな料理原価計算システムのフロントエンドアプリケーションです。

## 🚀 主な機能

- **食材管理**: 食材の追加、編集、削除、ジャンル別分類
- **料理作成**: ドラッグ&ドロップで直感的な料理レシピ作成
- **完成品管理**: 複数の料理を組み合わせた完成品の登録
- **原価計算**: リアルタイムでの原価・利益率計算
- **レポート機能**: ダッシュボードでの統計・分析表示
- **レスポンシブデザイン**: PC・タブレット・スマートフォン対応

## 🛠️ 技術スタック

- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **State Management**: React Query + Context API
- **Routing**: React Router v6
- **Form Handling**: React Hook Form + Yup
- **Drag & Drop**: React DnD
- **Build Tool**: Vite
- **Testing**: Vitest + Testing Library
- **PWA**: Vite PWA Plugin

## 📦 セットアップ

### 前提条件

- Node.js 18.0.0以上
- npm 9.0.0以上

### インストール

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env

# 開発サーバーの起動
npm run dev
```

### 環境変数

`.env`ファイルで以下の環境変数を設定してください：

```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_TITLE=料理原価計算システム
VITE_APP_VERSION=2.0.0
VITE_ENABLE_DEV_TOOLS=true
```

## 🔧 開発

### 開発サーバー

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてください。

### ビルド

```bash
# 本番用ビルド
npm run build

# プレビュー
npm run preview
```

### テスト

```bash
# 単体テスト
npm run test

# テストUI
npm run test:ui

# カバレッジ
npm run test:coverage

# E2Eテスト
npm run test:e2e
```

### コード品質

```bash
# ESLint
npm run lint
npm run lint:fix

# TypeScript型チェック
npm run typecheck

# フォーマット
npm run format
```

## 📱 PWA対応

このアプリケーションはPWA（Progressive Web App）として動作します：

- オフライン対応
- インストール可能
- プッシュ通知対応
- レスポンシブデザイン

## 🏗️ プロジェクト構造

```
src/
├── components/          # 再利用可能なUIコンポーネント
│   ├── common/         # 共通コンポーネント
│   ├── dishes/         # 料理関連コンポーネント
│   ├── ingredients/    # 食材関連コンポーネント
│   └── reports/        # レポート関連コンポーネント
├── contexts/           # React Context
├── hooks/              # カスタムフック
├── pages/              # ページコンポーネント
├── services/           # API通信
├── types/              # TypeScript型定義
├── utils/              # ユーティリティ関数
└── test/               # テスト設定
```

## 🎨 デザインシステム

### カラーパレット

- **Primary**: #1976d2 (Material Blue)
- **Secondary**: #dc004e (Material Pink)
- **Success**: #4caf50 (Material Green)
- **Warning**: #ff9800 (Material Orange)
- **Error**: #f44336 (Material Red)

### ジャンル別カラー

- **肉類**: #d32f2f (赤)
- **野菜**: #388e3c (緑)
- **調味料**: #fbc02d (黄)
- **ソース**: #ff5722 (オレンジ)
- **冷凍**: #2196f3 (青)
- **ドリンク**: #9c27b0 (紫)

## 🚀 デプロイ

### Docker

```bash
# 開発用
docker build -f Dockerfile.dev -t cooking-cost-frontend:dev .
docker run -p 3000:3000 cooking-cost-frontend:dev

# 本番用
docker build -f Dockerfile -t cooking-cost-frontend:prod .
docker run -p 8080:8080 cooking-cost-frontend:prod
```

### Vercel / Netlify

1. GitHubリポジトリに接続
2. ビルドコマンド: `npm run build`
3. 出力ディレクトリ: `build`
4. 環境変数を設定

## 📋 使用方法

### 食材管理

1. 右下の「+」ボタンから食材を追加
2. 名前、購入場所、数量、単位、価格、ジャンルを入力
3. 自動的に単価が計算されます

### 料理作成

1. 食材一覧から料理作成エリアにドラッグ&ドロップ
2. 使用量を入力
3. 料理名を設定して作成

### 完成品登録

1. 料理一覧から完成品作成エリアにドラッグ&ドロップ
2. 使用量（割合または人前）を設定
3. 販売価格を入力して利益率を確認

## 🤝 コントリビューション

1. フォークしてください
2. 機能ブランチを作成してください (`git checkout -b feature/amazing-feature`)
3. 変更をコミットしてください (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュしてください (`git push origin feature/amazing-feature`)
5. プルリクエストを開いてください

## 📝 ライセンス

MIT License

## 🆘 サポート

問題が発生した場合は、GitHubのIssuesページでお知らせください。

## 🏆 謝辞

- Material-UI チーム
- React チーム
- Vite チーム
- TypeScript チーム
