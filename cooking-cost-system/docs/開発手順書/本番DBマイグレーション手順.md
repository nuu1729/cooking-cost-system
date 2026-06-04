# 本番 DB マイグレーション手順

| 項目 | 内容 |
|---|---|
| 対象 DB | MySQL 8.0（Hetzner VPS 上の Docker コンテナ） |
| 接続方法 | `docker compose -f docker-compose.prod.yml exec database mysql` |
| スキーマ管理 | 手動 SQL + `setup.sql`（初回）、`db.create_all()`（テーブル追加） |

---

## 1. 初回デプロイ時（テーブル新規作成）

VPS に初めてデプロイする場合の手順。

```bash
# 1. リポジトリをクローン・移動
cd /opt/cooking-cost

# 2. .env.production を生成
bash scripts/generate-env.sh

# 3. secrets/ ディレクトリに DB パスワードファイルを作成
mkdir -p secrets
echo "your_mysql_root_password" > secrets/mysql_root_password.txt
echo "your_mysql_password"      > secrets/mysql_password.txt
chmod 600 secrets/*.txt

# 4. 起動（初回は MySQL が setup.sql を自動実行してスキーマ作成）
docker compose -f docker-compose.prod.yml up -d

# 5. スキーマ確認
docker compose -f docker-compose.prod.yml exec database \
  mysql -u cooking_user -p cooking_cost_system \
  -e "SHOW TABLES;"
```

> **注意**: MySQL コンテナの `/docker-entrypoint-initdb.d/setup.sql` は**初回起動時のみ**実行される。
> すでにデータボリュームが存在する場合は実行されない。

---

## 2. スキーマ変更が発生する場合（ALTER TABLE）

### 2-1. 事前バックアップ（必須）

```bash
# バックアップを取得（scripts/backup.sh）
bash scripts/backup.sh

# または手動でバックアップ
docker compose -f docker-compose.prod.yml exec database \
  mysqldump -u cooking_user -p cooking_cost_system \
  | gzip > /opt/cooking-cost/backups/pre_migration_$(date +%Y%m%d%H%M%S).sql.gz
```

### 2-2. マイグレーション SQL の作成

`scripts/migrations/` に連番でファイルを作成する。

```
scripts/migrations/
  001_initial_schema.sql    # setup.sql と同内容（参考用）
  002_add_column_xxx.sql    # 追加カラムなど
  003_add_index_yyy.sql
```

**ファイル命名規則**: `NNN_説明.sql`（NNN は3桁連番）

**記述例** (`002_add_selling_price_to_items.sql`):

```sql
-- マイグレーション: 002
-- 日付: 2026-05-01
-- 内容: items テーブルに selling_price カラムを追加
-- ロールバック: ALTER TABLE items DROP COLUMN selling_price;

ALTER TABLE cooking_cost_system.items
  ADD COLUMN selling_price DECIMAL(10,2) NULL COMMENT '販売価格'
  AFTER unit_price;
```

### 2-3. マイグレーション実行

```bash
# 1. バックアップ確認
ls -lh /opt/cooking-cost/backups/

# 2. ドライラン（--verbose で確認のみ）
docker compose -f docker-compose.prod.yml exec database \
  mysql -u cooking_user -p cooking_cost_system \
  --verbose < scripts/migrations/002_add_column_xxx.sql

# 3. 本番実行
docker compose -f docker-compose.prod.yml exec -T database \
  mysql -u cooking_user -p cooking_cost_system \
  < scripts/migrations/002_add_column_xxx.sql

# 4. 適用確認
docker compose -f docker-compose.prod.yml exec database \
  mysql -u cooking_user -p cooking_cost_system \
  -e "DESCRIBE items;"
```

### 2-4. アプリケーション再起動

```bash
# Flask モデルが db.create_all() で新カラムを認識するため再起動が必要
docker compose -f docker-compose.prod.yml restart backend

# ヘルスチェック確認
curl http://localhost:3001/api/health
```

---

## 3. ロールバック手順

マイグレーション後に問題が発生した場合。

### パターン A: ALTER TABLE での逆操作

```bash
# 各マイグレーション SQL ファイルに記載のロールバック SQL を実行
docker compose -f docker-compose.prod.yml exec -T database \
  mysql -u cooking_user -p cooking_cost_system \
  -e "ALTER TABLE items DROP COLUMN selling_price;"
```

### パターン B: バックアップからリストア（破壊的変更の場合）

```bash
# 1. アプリを停止
docker compose -f docker-compose.prod.yml stop backend

# 2. DB コンテナに接続してリストア
gunzip -c /opt/cooking-cost/backups/pre_migration_YYYYMMDDHHMMSS.sql.gz \
  | docker compose -f docker-compose.prod.yml exec -T database \
    mysql -u cooking_user -p cooking_cost_system

# 3. 確認後アプリを再起動
docker compose -f docker-compose.prod.yml start backend
```

---

## 4. ゼロダウンタイムマイグレーションのガイドライン

現在の構成（単一 VPS・単一バックエンドコンテナ）では完全なゼロダウンタイムは困難だが、
ダウンタイムを最小化するための指針。

| 操作 | ダウンタイム | 推奨手順 |
|---|---|---|
| カラム追加（NULL 許容） | なし | バックエンド停止不要。ALTER TABLE 後に再起動 |
| カラム追加（NOT NULL・デフォルトあり） | なし | ALTER TABLE 後に再起動 |
| カラム追加（NOT NULL・デフォルトなし） | あり | バックエンド停止 → ALTER TABLE → データ補完 → 再起動 |
| カラム削除 | あり | バックエンドコードからカラム参照を削除 → デプロイ → DROP COLUMN |
| テーブル追加 | なし | `db.create_all()` が自動で作成（バックエンド再起動で反映） |
| インデックス追加 | 軽微 | `ALTER TABLE ... ADD INDEX` は大テーブルで時間がかかる場合あり |
| カラム名変更 | あり | 旧カラム残存 → 新カラム追加 → データコピー → 参照先変更 → 旧削除（3段階） |

---

## 5. マイグレーション管理の将来的な改善

現在の手動 SQL 管理には以下のリスクがある。

- どのマイグレーションが実行済みか追跡できない
- 複数環境での適用漏れ

将来的には **Alembic**（Flask-Migrate）の導入を検討する。

```bash
# Alembic 導入時のイメージ
flask db init          # 初期化
flask db migrate -m "add selling_price"  # マイグレーション生成
flask db upgrade       # 本番に適用
flask db downgrade     # ロールバック
```

Alembic 導入は [issue #XX] として別途管理する。

---

## 6. チェックリスト

マイグレーション前後に確認すること。

**実行前**
- [ ] バックアップが正常に取得できている
- [ ] マイグレーション SQL を staging 環境で動作確認済み
- [ ] ロールバック SQL が準備できている
- [ ] メンテナンス通知を送信済み（必要な場合）

**実行後**
- [ ] `SHOW TABLES` / `DESCRIBE <table>` でスキーマ変更を確認
- [ ] ヘルスチェック（`/api/health`）が 200 を返す
- [ ] アプリケーションの主要機能が動作する
- [ ] エラーログ（`docker compose logs backend`）に異常がない
