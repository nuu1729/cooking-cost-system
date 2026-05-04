# バックエンド開発ガイド

Python 3.11 + Flask + SQLAlchemy による REST API サーバーです。

---

## ディレクトリ構成

```
backend/
├── api/
│   ├── controllers/           # APIエンドポイント（Flask Blueprint）
│   │   ├── auth.py            # 認証 /api/auth
│   │   ├── ingredients.py     # 食材 /api/ingredients
│   │   ├── preps.py           # 仕込み /api/preps
│   │   ├── dishes.py          # お品 /api/dishes
│   │   ├── stores.py          # 購入先マスタ /api/stores
│   │   ├── genres.py          # ジャンルマスタ /api/genres
│   │   ├── memo.py            # メモ /api/memo
│   │   └── __init__.py        # Blueprint 登録
│   ├── models/                # SQLAlchemy ORM モデル
│   │   ├── item.py            # items テーブル（食材/仕込み/お品）
│   │   ├── store.py           # stores テーブル（購入先マスタ）
│   │   ├── genre.py           # genres テーブル（ジャンルマスタ・共有）
│   │   ├── user.py            # users テーブル
│   │   ├── memo.py            # memos テーブル
│   │   └── __init__.py
│   ├── utils/
│   │   ├── auth.py            # JWT 認証デコレータ（@require_auth）
│   │   ├── response.py        # success() / error() レスポンスヘルパー
│   │   ├── cascade.py         # 原価カスケード再計算
│   │   └── japanese.py        # かな・カナ揺れ検索ユーティリティ
│   └── database.py            # SQLAlchemy db インスタンス
├── app.py                     # Flask アプリケーション エントリポイント
├── config.py                  # 開発環境設定
├── config_staging.py          # ステージング環境設定
├── config_production.py       # 本番環境設定
└── requirements.txt           # パッケージ依存関係
```

---

## セットアップ

```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
python app.py
# → http://localhost:3001/api
```

---

## 主要な設計パターン

### 認証（JWT）

全エンドポイントに `@require_auth` デコレータを付与します。デコレータはリクエストヘッダーの Bearer トークンを検証し、`g.user_id` にユーザーIDをセットします。

```python
@ingredients_bp.route('', methods=['GET'])
@require_auth
def list_ingredients():
    items = Item.query.filter_by(user_id=g.user_id, item_type=1).all()
    ...
```

### データモデル（BOM構造）

食材・仕込み・お品は `items` テーブルに `item_type` で区別して統合管理します。

| item_type | 区分 |
|-----------|------|
| 1 | 食材 |
| 2 | 仕込み品 |
| 3 | お品 |

親子関係は `item_relations` テーブルで管理します（BOM: Bill of Materials）。

### マスタの設計方針

| マスタ | user_id | 備考 |
|--------|---------|------|
| stores（購入先） | あり | ユーザーごとに独立 |
| genres（ジャンル） | なし | 全ユーザー共有 |

### レスポンス形式

```python
# 成功
return success(data, status=200)       # {"success": true, "data": ...}
return success(data, status=201)       # 作成時

# エラー
return error('NOT_FOUND', 'メッセージ', 404)
return error('VALIDATION_ERROR', 'メッセージ')
```

---

## 環境設定（config.py）

```python
DB_HOST = 'localhost'
DB_PORT = 3306
DB_USER = 'root'
DB_PASSWORD = ''
DB_NAME = 'cooking_cost_db'
JWT_SECRET = 'your-secret-key'
PORT = 3001
```

---

## 原価カスケード

食材の価格・数量を変更すると、それを使用している仕込み品・お品の原価が自動的に再計算されます（`utils/cascade.py`）。

```
食材の単価変更
  → 仕込み品の total_cost 再計算
    → お品の total_cost 再計算
```
