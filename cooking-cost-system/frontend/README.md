# フロントエンド開発ガイド

React 18 + TypeScript + Tailwind CSS による SPA です。

---

## 技術スタック

| カテゴリ | ライブラリ | 用途 |
|---------|-----------|------|
| フレームワーク | React 18 + TypeScript | UIコンポーネント |
| ビルドツール | Vite | 開発サーバー・バンドル |
| スタイリング | Tailwind CSS | ユーティリティクラス |
| アニメーション | Framer Motion | トランジション・モーション |
| ルーティング | React Router v6 | SPA ルーティング |
| HTTP通信 | Axios | APIクライアント |
| 通知 | React Hot Toast | トースト通知 |

---

## セットアップ

```bash
npm install
npm run dev
# → http://localhost:3000
```

### 環境変数（.env）

```
VITE_API_URL=http://localhost:3001/api
```

---

## ディレクトリ構成

```
src/
├── api/                       # APIクライアント（Axios ラッパー）
│   ├── index.ts               # エクスポート集約
│   ├── ingredients/           # 食材API
│   ├── stores/                # 購入先マスタAPI
│   └── genres/                # ジャンルマスタAPI
│
├── components/
│   ├── common/                # Layout, Header, Footer 等の共通コンポーネント
│   └── features/              # Header, AccountIcon 等の機能コンポーネント
│
├── pages/                     # ページコンポーネント（ルートに対応）
│   ├── 00signup/              # /signup
│   ├── 01login/               # /login
│   ├── 02home/                # /
│   ├── 03add/                 # /ingredients/add
│   ├── 04search/              # /ingredients/search
│   ├── 05edit/                # /ingredients/edit
│   ├── 06list/                # /list
│   ├── 07prep/                # /dishes/prep
│   ├── 08dish/                # /dishes/large
│   ├── 09calculator/          # /calculator
│   ├── 10account/             # /account
│   ├── 11stores/              # /stores
│   └── 12genres/              # /genres
│
├── stores/                    # 状態管理（MobXライク な accountStore）
├── types/                     # 共通型定義（index.ts）
└── utils/                     # ユーティリティ（URL変換等）
```

---

## ルーティング一覧

| パス | ページ | 説明 |
|-----|--------|------|
| `/` | ホーム | ダッシュボード・メモ |
| `/ingredients/add` | 食材追加 | 音声入力対応 |
| `/ingredients/search` | 食材検索 | リアルタイム検索・最安値比較 |
| `/ingredients/edit` | 食材編集 | インクリメンタル検索で選択 |
| `/list` | 一覧 | 食材・仕込み・お品タブ切替 |
| `/dishes/prep` | 仕込み管理 | 仕込み品の作成・編集 |
| `/dishes/large` | お品管理 | お品（完成品）の作成・編集 |
| `/stores` | 購入先管理 | 購入先マスタ CRUD |
| `/genres` | ジャンル管理 | ジャンルマスタ CRUD |
| `/calculator` | 販売価格計算 | 原価率・利益率の計算 |
| `/account` | アカウント | ユーザー情報・アイコン設定 |

---

## 主要な設計パターン

### 認証トークン

ログイン成功時に取得した JWT を `localStorage` の `authToken` に保存します。Axios インターセプターがリクエストごとに `Authorization: Bearer <token>` ヘッダーを自動付与します。

### API クライアント

```typescript
// src/api/ingredients/index.ts
export const ingredientApi = {
    getAll: (params?) => axiosInstance.get('/ingredients', { params }),
    getById: (id) => axiosInstance.get(`/ingredients/${id}`),
    create: (data) => axiosInstance.post('/ingredients', data),
    update: (id, data) => axiosInstance.put(`/ingredients/${id}`, data),
    delete: (id) => axiosInstance.delete(`/ingredients/${id}`),
};
```

### 型定義

共通型は `src/types/index.ts` に集約されています。`Ingredient`, `UnifiedItem`, `Store`, `Genre` など主要な型はここから import します。

---

## 開発サーバー

```bash
npm run dev       # 開発サーバー起動
npm run build     # 本番ビルド（dist/）
npm run lint      # ESLint チェック
```
