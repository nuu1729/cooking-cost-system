# 料理原価計算システム API ドキュメント

## 概要

料理原価計算システムのRESTful APIの詳細仕様書です。このAPIを使用して、食材管理、料理作成、完成品の原価計算、レポート生成などの機能を利用できます。

## 基本情報

- **ベースURL**: `http://localhost:3001/api`
- **API バージョン**: 2.0.0
- **認証方式**: Bearer Token (JWT)
- **レスポンス形式**: JSON
- **文字エンコーディング**: UTF-8

## 認証

現在のバージョンでは簡易認証を実装しています。将来的にはJWTベースの認証に移行予定です。

```bash
# ログイン
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

# レスポンス
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    },
    "token": "demo-token-xxxxx",
    "expiresAt": "2025-01-02T00:00:00.000Z"
  }
}
```

## レスポンス形式

### 成功レスポンス

```json
{
  "success": true,
  "data": { /* レスポンスデータ */ },
  "message": "操作が成功しました",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "count": 10
}
```

### エラーレスポンス

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "入力データが無効です",
  "details": [
    {
      "field": "name",
      "message": "名前は必須です",
      "value": ""
    }
  ],
  "timestamp": "2025-01-01T12:00:00.000Z",
  "path": "/api/ingredients",
  "method": "POST"
}
```

## エンドポイント一覧

### 1. 食材管理 (`/api/ingredients`)

#### 食材一覧取得

```
GET /api/ingredients
```

**クエリパラメータ:**

| パラメータ | 型 | 説明 | デフォルト |
|------------|----|----|-----------|
| `name` | string | 食材名での部分一致検索 | - |
| `store` | string | 店舗名での部分一致検索 | - |
| `genre` | string | ジャンル（meat/vegetable/seasoning/sauce/frozen/drink） | - |
| `minPrice` | number | 最低価格 | - |
| `maxPrice` | number | 最高価格 | - |
| `sortBy` | string | ソート項目（name/price/unit_price/created_at） | created_at |
| `sortOrder` | string | ソート順序（ASC/DESC） | DESC |
| `limit` | number | 取得件数上限 | 50 |
| `offset` | number | 取得開始位置 | 0 |

**レスポンス例:**

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
      "created_at": "2025-01-01T10:00:00.000Z",
      "updated_at": "2025-01-01T10:00:00.000Z"
    }
  ],
  "count": 1,
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### 食材詳細取得

```
GET /api/ingredients/{id}
```

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|------------|----|----|
| `id` | number | 食材ID |

#### 食材作成

```
POST /api/ingredients
```

**リクエストボディ:**

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

**フィールド詳細:**

| フィールド | 型 | 必須 | 説明 |
|------------|----|----|------|
| `name` | string | ✓ | 食材名（1-255文字） |
| `store` | string | ✓ | 購入店舗名（1-100文字） |
| `quantity` | number | ✓ | 購入数量（正の数値） |
| `unit` | string | ✓ | 単位（1-20文字） |
| `price` | number | ✓ | 価格（正の数値） |
| `genre` | string | ✓ | ジャンル |

#### 食材更新

```
PUT /api/ingredients/{id}
```

#### 食材削除

```
DELETE /api/ingredients/{id}
```

#### ジャンル別統計

```
GET /api/ingredients/stats/genre
```

#### 人気食材

```
GET /api/ingredients/popular?limit=10
```

### 2. 料理管理 (`/api/dishes`)

#### 料理一覧取得

```
GET /api/dishes
```

**クエリパラメータ:**

| パラメータ | 型 | 説明 | デフォルト |
|------------|----|----|-----------|
| `name` | string | 料理名での部分一致検索 | - |
| `genre` | string | ジャンル | - |
| `minCost` | number | 最低原価 | - |
| `maxCost` | number | 最高原価 | - |
| `sortBy` | string | ソート項目 | created_at |
| `sortOrder` | string | ソート順序 | DESC |
| `limit` | number | 取得件数上限 | 50 |
| `offset` | number | 取得開始位置 | 0 |

#### 料理詳細取得

```
GET /api/dishes/{id}
```

食材情報も含めて取得されます。

**レスポンス例:**

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
    "created_at": "2025-01-01T10:00:00.000Z",
    "updated_at": "2025-01-01T10:00:00.000Z"
  }
}
```

#### 料理作成

```
POST /api/dishes
```

**リクエストボディ:**

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

#### ジャンル別統計

```
GET /api/dishes/stats/genre
```

### 3. 完成品管理 (`/api/foods`)

#### 完成品一覧取得

```
GET /api/foods
```

**クエリパラメータ:**

| パラメータ | 型 | 説明 |
|------------|----|----|
| `name` | string | 完成品名での検索 |
| `minPrice` | number | 最低販売価格 |
| `maxPrice` | number | 最高販売価格 |
| `minCost` | number | 最低原価 |
| `maxCost` | number | 最高原価 |

#### 完成品作成

```
POST /api/foods
```

**リクエストボディ:**

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

**フィールド詳細:**

| フィールド | 説明 |
|-----------|------|
| `usage_unit` | `ratio`: 割合指定, `serving`: 人前指定 |
| `usage_quantity` | 使用量（ratioなら0.0-1.0、servingなら人前数） |

#### 利益率順取得

```
GET /api/foods/stats/profit?limit=10
```

### 4. レポート機能 (`/api/reports`)

#### ダッシュボード統計

```
GET /api/reports/dashboard
```

**レスポンス例:**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalIngredients": 30,
      "totalDishes": 8,
      "totalCompletedFoods": 4,
      "avgProfitRate": "32.45",
      "totalRevenue": 3380.00,
      "totalCost": 1113.40,
      "totalProfit": 2266.60
    },
    "recentActivity": [
      {
        "id": 1,
        "type": "ingredient",
        "message": "食材「豚バラ肉」を追加",
        "timestamp": "2025-01-01T10:00:00.000Z"
      }
    ]
  }
}
```

#### ジャンル別統計

```
GET /api/reports/genre-stats
```

#### コスト推移

```
GET /api/reports/cost-trends?days=30
```

#### レポートエクスポート

```
GET /api/reports/export?type=summary&format=json
```

**パラメータ:**

| パラメータ | 値 | 説明 |
|------------|-----|-----|
| `type` | ingredients/dishes/foods/summary | エクスポート対象 |
| `format` | json/csv | エクスポート形式 |

### 5. メモ機能 (`/api/memo`)

#### メモ一覧取得

```
GET /api/memo
```

#### メモ作成

```
POST /api/memo
```

**リクエストボディ:**

```json
{
  "content": "今月の目標：食材ロス率を5%以下に抑える"
}
```

#### メモ更新

```
PUT /api/memo/{id}
```

#### メモ削除

```
DELETE /api/memo/{id}
```

### 6. ファイルアップロード (`/api/upload`)

#### 単一ファイルアップロード

```
POST /api/upload/single
Content-Type: multipart/form-data

file: [ファイル]
```

#### 複数ファイルアップロード

```
POST /api/upload/multiple
Content-Type: multipart/form-data

files[]: [ファイル1]
files[]: [ファイル2]
```

#### アップロードファイル一覧

```
GET /api/upload/list
```

#### ファイル削除

```
DELETE /api/upload/{filename}
```

## エラーコード

| コード | 説明 |
|--------|------|
| `VALIDATION_ERROR` | 入力データの検証エラー |
| `NOT_FOUND` | リソースが見つからない |
| `BAD_REQUEST` | 不正なリクエスト |
| `UNAUTHORIZED` | 認証が必要 |
| `FORBIDDEN` | アクセス権限がない |
| `CONFLICT` | データの競合 |
| `RATE_LIMIT_EXCEEDED` | レート制限に達した |
| `DATABASE_ERROR` | データベースエラー |
| `INTERNAL_ERROR` | サーバー内部エラー |

## レート制限

- 一般API: 15分間に100リクエスト
- アップロード: 1時間に10ファイル
- 認証: 15分間に5回の試行

## ページネーション

リスト取得APIでは以下のパラメータでページネーションを制御できます：

- `limit`: 取得件数（1-100、デフォルト: 50）
- `offset`: 開始位置（デフォルト: 0）

## データ型

### ジャンル (GenreType)

```typescript
type GenreType = 'meat' | 'vegetable' | 'seasoning' | 'sauce' | 'frozen' | 'drink';
```

### 使用単位 (UsageUnitType)

```typescript
type UsageUnitType = 'ratio' | 'serving';
```

## 注意事項

1. **データ整合性**: 食材や料理を削除する際は、関連するデータも一緒に削除されます
2. **計算の精度**: 金額計算は小数点第2位まで、数量は第4位まで対応
3. **ファイル制限**: アップロード可能なファイルサイズは10MBまで
4. **文字制限**: 各フィールドには適切な文字数制限があります

## サンプルコード

### JavaScript/TypeScript

```javascript
// 食材作成の例
const createIngredient = async (ingredientData) => {
  try {
    const response = await fetch('http://localhost:3001/api/ingredients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-token-here'
      },
      body: JSON.stringify(ingredientData)
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('食材が作成されました:', result.data);
    } else {
      console.error('エラー:', result.message);
    }
  } catch (error) {
    console.error('通信エラー:', error);
  }
};
```

### cURL

```bash
# 食材一覧取得
curl -X GET "http://localhost:3001/api/ingredients?limit=10" \
  -H "Accept: application/json"

# 食材作成
curl -X POST "http://localhost:3001/api/ingredients" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "name": "豚バラ肉",
    "store": "スーパーマルエツ",
    "quantity": 500,
    "unit": "g",
    "price": 450,
    "genre": "meat"
  }'
```

## 変更履歴

- **v2.0.0** (2025-01-01): 初回リリース、TypeScript完全対応
- **v1.0.0** (2024-12-01): プロトタイプ版（非推奨）

## サポート

技術的な質問やバグ報告は、GitHubのIssuesページまでお願いします。
