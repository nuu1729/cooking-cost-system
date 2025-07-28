# 料理原価計算システム フロントエンド

## 概要

料理の原価を効率的に計算・管理するWebアプリケーションのフロントエンド部分です。食材の管理から料理の作成、完成品の価格設定まで、一連の原価計算フローをサポートします。

## 主な機能

- 🛒 **食材管理**: 食材の登録・編集・削除、単価計算
- 🍳 **料理作成**: ドラッグ&ドロップで食材を組み合わせた料理作成
- 🏆 **完成品管理**: 料理を組み合わせた完成品の価格設定と利益計算
- 📊 **レポート機能**: 原価分析、利益率計算、統計情報
- 📱 **PWA対応**: オフライン機能、モバイル対応
- 🎨 **直感的なUI**: Material-UIを使用したモダンなデザイン

## 技術スタック

- **フレームワーク**: React 18 + TypeScript
- **ビルドツール**: Vite
- **UIライブラリ**: Material-UI (MUI) v5
- **状態管理**: React Query v4
- **フォーム管理**: React Hook Form + Yup
- **ルーティング**: React Router Dom v6
- **アニメーション**: Framer Motion
- **ドラッグ&ドロップ**: React DnD
- **通知**: React Hot Toast
- **日付処理**: date-fns
- **HTTP通信**: Axios

## セットアップ

### 前提条件

- Node.js (v18.0.0以上)
- npm (v9.0.0以上)

### インストール

1. リポジトリをクローン
```bash
git clone [repository-url]
cd cooking-cost-system/frontend
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
```bash
cp .env.example .env
# .envファイルを編集して適切な値を設定
```

4. 開発サーバーを起動
```bash
npm run dev
```

5. ブラウザで `http://localhost:3000` にアクセス

## 利用可能なスクリプト

- `npm run dev` - 開発サーバーを起動
- `npm run build` - 本番用ビルドを作成
- `npm run preview` - ビルドしたアプリをプレビュー
- `npm run lint` - ESLintでコードをチェック
- `npm run format` - Prettierでコードをフォーマット
- `npm run type-check` - TypeScriptの型チェック
- `npm run test` - テストを実行
- `npm run test:coverage` - カバレッジ付きでテストを実行

## プロジェクト構造

```
src/
├── components/        # 再利用可能なコンポーネント
│   ├── common/       # 共通コンポーネント
│   ├── ingredients/  # 食材関連コンポーネント
│   ├── dishes/       # 料理関連コンポーネント
│   └── completedFoods/ # 完成品関連コンポーネント
├── contexts/         # React Context
├── hooks/            # カスタムフック
├── pages/            # ページコンポーネント
├── services/         # API通信関連
├── styles/           # スタイル関連
├── types/            # TypeScript型定義
└── utils/            # ユーティリティ関数
```

## 環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|--------------|
| `VITE_API_URL` | バックエンドAPIのURL | `http://localhost:3001/api` |
| `VITE_APP_NAME` | アプリケーション名 | `料理原価計算システム` |
| `VITE_ENABLE_AUTH` | 認証機能の有効化 | `false` |
| `VITE_PWA_ENABLED` | PWA機能の有効化 | `true` |

詳細は `.env.example` を参照してください。

## コードスタイル

このプロジェクトでは以下のツールを使用してコード品質を維持しています：

- **ESLint**: JavaScriptとTypeScriptのリンター
- **Prettier**: コードフォーマッター
- **TypeScript**: 型安全性の確保

コードをコミットする前に以下を実行してください：

```bash
npm run lint
npm run format
npm run type-check
```

## テスト

テストフレームワークとして Vitest を使用しています。

```bash
# テスト実行
npm run test

# カバレッジ付きテスト
npm run test:coverage

# テストUI
npm run test:ui
```

## ビルドとデプロイ

### 本番用ビルド

```bash
npm run build
```

ビルドされたファイルは `dist/` ディレクトリに出力されます。

### PWA機能

このアプリケーションはPWA（Progressive Web App）として構築されており、以下の機能を提供します：

- オフライン対応
- ホーム画面への追加
- プッシュ通知（実装済み）
- バックグラウンド同期

## ブラウザサポート

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## トラブルシューティング

### よくある問題

**Q: 開発サーバーが起動しない**
A: Node.jsのバージョンを確認してください（v18.0.0以上が必要）

**Q: ビルドエラーが発生する**
A: 依存関係を再インストールしてください
```bash
rm -rf node_modules package-lock.json
npm install
```

**Q: APIとの通信ができない**
A: バックエンドサーバーが起動していることと、`.env`の`VITE_API_URL`が正しいことを確認してください

## ライセンス

MIT License

## 変更履歴

### v2.0.0
- TypeScriptで完全リライト
- Material-UI v5にアップグレード
- React Query v4を採用
- PWA機能を追加
- ドラッグ&ドロップ機能を実装

### v1.0.0
- 初回リリース
- 基本的な原価計算機能を実装
