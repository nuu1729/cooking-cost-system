# 本番 DB マイグレーション手順

| 項目 | 内容 |
|---|---|
| 対象 DB | Cloudflare D1（SQLite 互換） |
| 接続方法 | `npx wrangler d1 execute <DB名> --remote --command "..."` |
| スキーマ管理 | `wrangler d1 migrations`（`backend/d1/migrations/` 配下の連番 SQL ファイル） |
| データベース一覧 | `cooking-cost-db-staging`（staging）、`cooking-cost-db-prod`（production） |

> 以前の MySQL（Hetzner VPS）構成からの移行に伴い、`db.create_all()` によるスキーマ管理は廃止した。
> スキーマは `backend/d1/migrations/` 配下のファイルと `wrangler d1 migrations` コマンドで管理する。

---

## 1. 初回セットアップ（データベース作成）

新しい環境（例: 新しい staging）を用意する場合の手順。

```bash
# 1. Cloudflare にログイン（未認証の場合）
npx wrangler login

# 2. D1 データベースを作成
npx wrangler d1 create cooking-cost-db-staging
# → database_id が出力されるので wrangler.toml の該当 env セクションに転記する

# 3. wrangler.toml に [[env.<環境名>.d1_databases]] ブロックを追加・確認
#    binding = "DB", migrations_dir = "backend/d1/migrations"

# 4. マイグレーションを適用（スキーマ作成）
npx wrangler d1 migrations apply DB --remote --env staging

# 5. 適用確認
npx wrangler d1 execute cooking-cost-db-staging --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

---

## 2. スキーマ変更が発生する場合

### 2-1. マイグレーションファイルの作成

```bash
cd backend/d1
npx wrangler d1 migrations create cooking-cost-db-staging add_selling_price_note
# → backend/d1/migrations/000N_add_selling_price_note.sql が生成される
```

生成されたファイルに変更 SQL を記述する（SQLite 方言）。

**記述例** (`0002_add_selling_price_note.sql`):

```sql
-- マイグレーション: 0002
-- 内容: items テーブルに note カラムを追加
-- ロールバック: 別マイグレーションで DROP COLUMN する（下記 3 章参照）

ALTER TABLE items ADD COLUMN note TEXT DEFAULT NULL;
```

> **SQLite/D1 の制約**: `ALTER TABLE` でサポートされるのは列追加・列名変更・列削除など限定的な操作のみ。
> 型変更や複雑な制約変更は「新テーブル作成 → データコピー → 旧テーブル削除 → リネーム」の手順が必要になる場合がある。
> D1 は外部キー制約を無効化できないため、テーブル再作成を伴う変更は依存関係の順序に注意すること。

### 2-2. マイグレーション実行

```bash
# 1. マイグレーション内容を目視確認
cat backend/d1/migrations/0002_add_selling_price_note.sql

# 2. まず staging に適用して動作確認
cd backend/d1
npx wrangler d1 migrations apply DB --remote --env staging

# 3. staging で問題なければ production に適用
npx wrangler d1 migrations apply DB --remote --env production

# 4. 適用確認（未適用マイグレーションの一覧が空になっていることを確認）
npx wrangler d1 migrations list DB --remote --env production
```

> `wrangler d1 migrations apply` は D1 側の `d1_migrations` テーブルで適用履歴を自動管理するため、
> 旧構成にあった `migrations_applied.log` の手動記録は不要になった。

### 2-3. アプリケーション再起動

Cloudflare Containers 側のデプロイ（`wrangler deploy`）を行うと、新しいコンテナインスタンスが
最新コードで起動する。マイグレーション適用とデプロイのタイミングがずれる場合、
後方互換性のあるスキーマ変更（列追加など）から先に適用すること。

```bash
# ヘルスチェック確認
curl https://<デプロイ先ドメイン>/health/detailed
```

---

## 3. ロールバック手順

D1 の `wrangler d1 migrations` には自動ロールバック機能がないため、以下のいずれかで対応する。

### パターン A: 逆操作マイグレーションを新規作成

```bash
cd backend/d1
npx wrangler d1 migrations create cooking-cost-db-prod revert_selling_price_note
# 生成されたファイルに ALTER TABLE items DROP COLUMN note; を記述して適用
```

### パターン B: バックアップからのリストア（破壊的変更の場合）

`wrangler d1 export` によるバックアップの取得・リストア手順は
issue [#179](https://github.com/nuu1729/cooking-cost-system/issues/179)（D1バックアップ運用整備）で対応する。

```bash
# バックアップ取得（手動実行例。定期実行の仕組みは #179 で整備予定）
npx wrangler d1 export cooking-cost-db-prod --remote --output=backup_$(date +%Y%m%d%H%M%S).sql

# リストア（新規データベースへの読み込み例）
npx wrangler d1 execute cooking-cost-db-prod --remote --file=backup_YYYYMMDDHHMMSS.sql
```

---

## 4. ダウンタイムに関するガイドライン

| 操作 | 影響 | 推奨手順 |
|---|---|---|
| カラム追加（NULL 許容 / デフォルトあり） | なし | マイグレーション適用のみでよい |
| カラム追加（NOT NULL・デフォルトなし） | あり | 追加 → データ補完 → NOT NULL 化の複数マイグレーションに分割 |
| カラム削除 | あり | アプリコードから参照を削除してデプロイ → 別マイグレーションで DROP COLUMN |
| テーブル追加 | なし | 新規マイグレーションファイルを追加して適用 |
| インデックス追加 | 軽微 | 通常は問題ないが、大規模データでは実行時間に留意 |
| カラム名変更 | あり | 新カラム追加 → データコピー → 参照先変更 → 旧カラム削除（3段階） |

---

## 5. マイグレーション履歴の確認

```bash
# 適用済み・未適用マイグレーションの一覧
npx wrangler d1 migrations list DB --remote --env production

# テーブル一覧・スキーマの直接確認
npx wrangler d1 execute cooking-cost-db-prod --remote \
  --command "SELECT sql FROM sqlite_master WHERE type='table';"
```

---

## 6. チェックリスト

**実行前**
- [ ] マイグレーション SQL の内容を目視確認した
- [ ] staging（`cooking-cost-db-staging`）で動作確認済み
- [ ] ロールバック用マイグレーション、またはバックアップ取得方針を確認済み

**実行後**
- [ ] `wrangler d1 migrations list` で適用済みになっていることを確認
- [ ] `sqlite_master` でスキーマ変更を確認
- [ ] ヘルスチェック（`/health/detailed`）が 200 を返す
- [ ] アプリケーションの主要機能が動作する
