# 料理原価計算システム API仕様書

## 概要

料理原価計算システムのRESTful API仕様です。食材管理、料理管理、完成品管理、レポート機能を提供します。

**Base URL:** `http://localhost:3001/api`

**API Version:** v2.0

**Content-Type:** `application/json`

## 認証

現在のバージョンでは基本的な認証機能のみ実装されています。

```http
Authorization: Bearer 
```

## レスポンス形式

### 成功レスポンス
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "count": 10,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### エラーレスポンス
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Error message",
  "details": [
    {
      "field": "name",
      "message": "Name is required",
      "value": null
    }
  ],
  "timestamp": "2025-01-01T00:00:00.000Z",
  "path": "/api/ingredients",
  "method": "POST"
}
```

## エラーコード

| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| VALIDATION_ERROR | 400 | バリデーションエラー |
| UNAUTHORIZED | 401 | 認証エラー |
| FORBIDDEN | 403 | 権限不足 |
| NOT_FOUND | 404 | リソースが見つからない |
| CONFLICT | 409 | リソースの競合 |
| RATE_LIMIT_EXCEEDED | 429 | レート制限超過 |
| INTERNAL_ERROR | 500 | サーバー内部エラー |

---

## 食材管理 API

### 食材一覧取得

```http
GET /api/ingredients
```

#### クエリパラメータ

| パラメータ | 型 | 説明 | 例 |
|-----------|----|----|-----|
| name | string | 食材名での検索 | `name=豚肉` |
| store | string | 店舗名での検索 | `store=スーパー` |
| genre | string | ジャンルでの絞り込み | `genre=meat` |
| minPrice | number | 最低価格 | `minPrice=100` |
| maxPrice | number | 最高価格 | `maxPrice=1000` |
| sortBy | string | ソート項目 | `sortBy=name` |
| sortOrder | string | ソート順 | `sortOrder=ASC` |
| limit | number | 取得件数 | `limit=20` |
| offset | number | オフセット | `offset=0` |

#### ジャンル値
- `meat` - 肉類
- `vegetable` - 野菜類  
- `seasoning` - 調味料
- `sauce` - ソース・調味液
- `frozen` - 冷凍食品
- `drink` - 飲み物

#### レスポンス例

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "豚バラ肉",
      "store": "スーパーマルエツ",
      "quantity": 500.00,
      "unit": "g",
      "price": 450.00,
      "unit_price": 0.9000,
      "genre": "meat",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "count": 1,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### 食材詳細取得

```http
GET /api/ingredients/{id}
```

#### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|----|----|
| id | number | 食材ID |

### 食材作成

```http
POST /api/ingredients
```

#### リクエストボディ

```json
{
  "name": "豚バラ肉",
  "store": "スーパーマルエツ",
  "quantity": 500.00,
  "unit": "g",
  "price": 450.00,
  "genre": "meat"
}
```

#### バリデーション

| フィールド | 必須 | 型 | 制約 |
|-----------|------|----|----|
| name | ✓ | string | 1-255文字 |
| store | ✓ | string | 1-100文字 |
| quantity | ✓ | number | 正の数値、小数点2桁以内 |
| unit | ✓ | string | 1-20文字 |
| price | ✓ | number | 正の数値、小数点2桁以内 |
| genre | ✓ | string | 有効なジャンル値 |

### 食材更新

```http
PUT /api/ingredients/{id}
```

### 食材削除

```http
DELETE /api/ingredients/{id}
```

### 食材統計取得

```http
GET /api/ingredients/stats/genre
```

ジャンル別の食材統計を取得します。

### 人気食材取得

```http
GET /api/ingredients/popular?limit=10
```

使用頻度の高い食材ランキングを取得します。

---

## 料理管理 API

### 料理一覧取得

```http
GET /api/dishes
```

#### クエリパラメータ

| パラメータ | 型 | 説明 |
|-----------|----|----|
| name | string | 料理名での検索 |
| genre | string | ジャンルでの絞り込み |
| minCost | number | 最低原価 |
| maxCost | number | 最高原価 |
| sortBy | string | ソート項目 |
| sortOrder | string | ソート順 |
| limit | number | 取得件数 |
| offset | number | オフセット |

### 料理詳細取得

```http
GET /api/dishes/{id}
```

食材情報も含めて取得します。

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "豚の生姜焼き",
    "total_cost": 238.00,
    "genre": "main",
    "description": "ご飯が進む定番の豚の生姜焼き",
    "ingredients": [
      {
        "ingredient_id": 1,
        "used_quantity": 200.00,
        "used_cost": 180.00,
        "ingredient_name": "豚バラ肉",
        "ingredient_unit": "g",
        "ingredient_genre": "meat"
      }
    ],
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### 料理作成

```http
POST /api/dishes
```

#### リクエストボディ

```json
{
  "name": "豚の生姜焼き",
  "genre": "main",
  "description": "ご飯が進む定番の豚の生姜焼き",
  "ingredients": [
    {
      "ingredient_id": 1,
      "used_quantity": 200.00
    },
    {
      "ingredient_id": 2,
      "used_quantity": 100.00
    }
  ]
}
```

#### バリデーション

| フィールド | 必須 | 型 | 制約 |
|-----------|------|----|----|
| name | ✓ | string | 1-255文字 |
| genre |  | string | 50文字以内 |
| description |  | string | 1000文字以内 |
| ingredients | ✓ | array | 1つ以上の食材 |
| ingredients[].ingredient_id | ✓ | number | 正の整数 |
| ingredients[].used_quantity | ✓ | number | 正の数値 |

### 料理更新

```http
PUT /api/dishes/{id}
```

### 料理削除

```http
DELETE /api/dishes/{id}
```

### 料理統計取得

```http
GET /api/dishes/stats/genre
```

---

## 完成品管理 API

### 完成品一覧取得

```http
GET /api/foods
```

#### クエリパラメータ

| パラメータ | 型 | 説明 |
|-----------|----|----|
| name | string | 完成品名での検索 |
| minPrice | number | 最低販売価格 |
| maxPrice | number | 最高販売価格 |
| minCost | number | 最低原価 |
| maxCost | number | 最高原価 |

### 完成品詳細取得

```http
GET /api/foods/{id}
```

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "定食A（生姜焼き定食）",
    "price": 850.00,
    "total_cost": 283.35,
    "profit": 566.65,
    "profit_rate": 66.68,
    "description": "豚の生姜焼き、味噌汁、サラダのセット",
    "dishes": [
      {
        "dish_id": 1,
        "usage_quantity": 1.0000,
        "usage_unit": "serving",
        "usage_cost": 238.00,
        "description": "豚の生姜焼き 1人前",
        "dish_name": "豚の生姜焼き",
        "dish_genre": "main",
        "dish_total_cost": 238.00
      }
    ],
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### 完成品作成

```http
POST /api/foods
```

#### リクエストボディ

```json
{
  "name": "定食A（生姜焼き定食）",
  "price": 850.00,
  "description": "豚の生姜焼き、味噌汁、サラダのセット",
  "dishes": [
    {
      "dish_id": 1,
      "usage_quantity": 1.0000,
      "usage_unit": "serving",
      "description": "豚の生姜焼き 1人前"
    },
    {
      "dish_id": 4,
      "usage_quantity": 1.0000,
      "usage_unit": "serving",
      "description": "味噌汁 1杯"
    }
  ]
}
```

#### 使用単位 (usage_unit)
- `serving` - 人前単位
- `ratio` - 割合単位（0.5 = 半分）

### 完成品更新

```http
PUT /api/foods/{id}
```

### 完成品削除

```http
DELETE /api/foods/{id}
```

### 利益率ランキング

```http
GET /api/foods/stats/profit?limit=10
```

---

## レポート API

### ダッシュボード統計

```http
GET /api/reports/dashboard
```

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalIngredients": 30,
      "totalDishes": 8,
      "totalCompletedFoods": 4,
      "avgProfitRate": "66.68",
      "totalRevenue": 3380.00,
      "totalCost": 1133.40,
      "totalProfit": 2246.60
    },
    "recentActivity": [
      {
        "id": 1,
        "type": "food",
        "message": "完成品「定食A（生姜焼き定食）」を登録",
        "timestamp": "2025-01-01T00:00:00.000Z"
      }
    ]
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### ジャンル別統計

```http
GET /api/reports/genre-stats
```

### コスト推移

```http
GET /api/reports/cost-trends?days=30
```

### 人気アイテム

```http
GET /api/reports/popular-items
```

### レポートエクスポート

```http
GET /api/reports/export?format=json&type=summary
```

#### クエリパラメータ

| パラメータ | 型 | 説明 | 例 |
|-----------|----|----|-----|
| format | string | エクスポート形式 | `json`, `csv` |
| type | string | エクスポート種類 | `ingredients`, `dishes`, `foods`, `summary` |

---

## メモ API

### メモ一覧取得

```http
GET /api/memo
```

### メモ詳細取得

```http
GET /api/memo/{id}
```

### メモ作成

```http
POST /api/memo
```

#### リクエストボディ

```json
{
  "content": "今月の目標：食材ロス率を5%以下に抑える"
}
```

### メモ更新

```http
PUT /api/memo/{id}
```

### メモ削除

```http
DELETE /api/memo/{id}
```

---

## ファイルアップロード API

### 単一ファイルアップロード

```http
POST /api/upload/single
Content-Type: multipart/form-data
```

#### フォームデータ

| フィールド | 型 | 説明 |
|-----------|----|----|
| file | file | アップロードファイル |

#### 制限事項

- 最大ファイルサイズ: 10MB
- 許可されるファイル形式: jpeg, jpg, png, gif, pdf, xlsx, csv, json

### 複数ファイルアップロード

```http
POST /api/upload/multiple
Content-Type: multipart/form-data
```

#### フォームデータ

| フィールド | 型 | 説明 |
|-----------|----|----|
| files | file[] | アップロードファイル（最大5個） |

### ファイル削除

```http
DELETE /api/upload/{filename}
```

### ファイル一覧取得

```http
GET /api/upload/list
```

---

## 認証 API

### ログイン

```http
POST /api/auth/login
```

#### リクエストボディ

```json
{
  "username": "admin",
  "password": "admin123"
}
```

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@cooking-system.local",
      "role": "admin",
      "is_active": true
    },
    "token": "demo-token-1234567890",
    "expiresAt": "2025-01-02T00:00:00.000Z"
  },
  "message": "Login successful",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### ログアウト

```http
POST /api/auth/logout
```

### 現在のユーザー情報取得

```http
GET /api/auth/me
```

---

## ヘルスチェック API

### 基本ヘルスチェック

```http
GET /health
```

### 詳細ヘルスチェック

```http
GET /health/detailed
```

### メトリクス取得（Prometheus形式）

```http
GET /metrics
```

---

## レート制限

| エンドポイント | 制限 |
|---------------|------|
| 一般API | 100リクエスト/15分 |
| 厳密なAPI | 20リクエスト/5分 |
| アップロード | 10回/1時間 |
| 認証 | 5回/15分 |

---

## 注意事項

1. **データの整合性**: 食材を削除する際、その食材を使用している料理がある場合はエラーになります。
2. **原価計算**: 料理や完成品の原価は、使用している食材や料理の現在の価格に基づいて自動計算されます。
3. **利益率計算**: 利益率は `((販売価格 - 原価) / 販売価格) × 100` で計算されます。
4. **セキュリティ**: 本番環境では適切な認証・認可の実装が必要です。
5. **パフォーマンス**: 大量のデータを扱う際は、適切なページネーションの使用を推奨します。

---

## サポート

APIに関する質問やバグ報告は、GitHubのIssuesページでお受けしています。
