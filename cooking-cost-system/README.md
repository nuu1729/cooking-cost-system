# 料理原価計算システム

> 食材の仕入れから完成品の販売価格計算まで、飲食業の原価管理を一気通貫で支援するWebアプリケーション

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?logo=flask)](https://flask.palletsprojects.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)](https://mysql.com)

---

## 概要

食材（仕入れ）→ 仕込み品（下ごしらえ）→ お品（完成品）という飲食業の原価フローを管理します。各工程の単価・原価を自動計算し、販売価格に対する原価率を可視化します。ユーザーごとにデータが独立するマルチテナント構成です。

## 機能一覧

| 機能 | 説明 |
|------|------|
| **食材管理** | 仕入れ食材の登録・編集・削除。購入先・ジャンル・単価を管理 |
| **食材検索** | 名前・購入先・ジャンルでリアルタイム検索。最安値ハイライト表示 |
| **仕込み管理** | 複数食材を組み合わせた仕込み品の原価計算・構成管理 |
| **お品管理** | 仕込み品を組み合わせた完成品の登録と販売価格管理 |
| **一覧** | 食材・仕込み・お品の一覧表示。縦スクロール対応テーブル |
| **購入先管理** | 購入先（スーパー等）のマスタ管理 |
| **ジャンル管理** | 食材ジャンルの共有マスタ管理（全ユーザー共通） |
| **販売価格計算** | 原価率・利益・利益率の計算ツール |
| **音声入力** | Web Speech API による食材登録の音声操作 |
| **アカウント管理** | ユーザー情報・アイコン・背景画像の設定 |

## アーキテクチャ

```
┌──────────────────┐     HTTP/JSON     ┌──────────────────┐     SQLAlchemy     ┌─────────────────┐
│   フロントエンド   │ ────────────────▶ │   バックエンド API  │ ─────────────────▶ │   MySQL 8.0     │
│   React + TS     │                   │   Python Flask   │                   │   (XAMPP)       │
│   Tailwind CSS   │ ◀──────────────── │   JWT 認証        │                   │                 │
└──────────────────┘                   └──────────────────┘                   └─────────────────┘
  localhost:3000                          localhost:3001                          localhost:3306
```

## セットアップ

### 前提条件

- Node.js 18+
- Python 3.11+
- XAMPP（MySQL 8.0 + phpMyAdmin）

### 1. データベース

XAMPPのMySQLを起動し、phpMyAdmin で以下を実行します：

```sql
CREATE DATABASE cooking_cost_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

その後、`docs/` に記載のDDLを参照してテーブルを作成してください。

### 2. バックエンド

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python app.py
# → http://localhost:3001/api
```

### 3. フロントエンド

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

## プロジェクト構成

```
cooking-cost-system/
├── backend/                   # Python Flask API
│   ├── api/
│   │   ├── controllers/       # APIエンドポイント（Blueprint）
│   │   ├── models/            # SQLAlchemy モデル
│   │   ├── utils/             # 認証・レスポンス・カスケード処理
│   │   └── database.py        # DB接続設定
│   ├── app.py                 # Flask エントリポイント
│   ├── config.py              # 環境設定
│   └── requirements.txt
│
├── frontend/                  # React TypeScript SPA
│   └── src/
│       ├── api/               # Axios API クライアント
│       ├── components/        # 共通・機能コンポーネント
│       ├── pages/             # ページコンポーネント
│       ├── stores/            # 状態管理（accountStore）
│       ├── types/             # 型定義
│       └── utils/
│
├── docs/                      # 設計書
│   ├── 01_画面設計書/
│   ├── 02_テーブル定義/
│   ├── 03_OAS定義書/
│   └── 04_API処理定義書/
│
└── rules/                     # 開発規約・AIルール
    ├── app/                   # アプリケーション開発規約
    └── docs/                  # ドキュメント作成規約
```

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/auth/login` | ログイン |
| POST | `/api/auth/register` | ユーザー登録 |
| GET | `/api/auth/me` | 認証ユーザー取得 |
| GET/POST | `/api/ingredients` | 食材一覧取得・追加 |
| GET/PUT/DELETE | `/api/ingredients/:id` | 食材取得・更新・削除 |
| GET/POST | `/api/preps` | 仕込み一覧・作成 |
| GET/PUT/DELETE | `/api/preps/:id` | 仕込み取得・更新・削除 |
| GET/POST | `/api/dishes` | お品一覧・作成 |
| GET/PUT/DELETE | `/api/dishes/:id` | お品取得・更新・削除 |
| GET/POST/PUT/DELETE | `/api/stores` | 購入先マスタ CRUD |
| GET/POST/PUT/DELETE | `/api/genres` | ジャンルマスタ CRUD |

## 開発フロー

```
issue作成 → feat/fix ブランチ → PR作成 → レビュー → main マージ
```

- ブランチ命名：`feat/<機能名>` / `fix/<修正内容>`
- PR マージ後はブランチを削除する
