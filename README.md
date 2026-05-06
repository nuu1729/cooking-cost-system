# 料理原価計算システム

> 飲食店・家庭向けの包括的な原価管理Webアプリケーション

## リポジトリ構成

```
cooking-cost-system/          ← このリポジトリのルート
└── cooking-cost-system/      ← プロジェクト本体
    ├── backend/              # Python Flask API
    ├── frontend/             # React + TypeScript SPA
    ├── docs/                 # 設計書・仕様書
    └── rules/                # 開発規約・AIルール
```

詳細は [cooking-cost-system/README.md](cooking-cost-system/README.md) を参照してください。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 18 + TypeScript, Tailwind CSS, Framer Motion |
| バックエンド | Python 3.11, Flask, SQLAlchemy, PyJWT |
| データベース | MySQL 8.0（XAMPP） |

## クイックスタート

```bash
cd cooking-cost-system
# backend: python app.py
# frontend: npm run dev
```
