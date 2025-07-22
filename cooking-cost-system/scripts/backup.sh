#!/bin/bash

# データベースバックアップスクリプト

set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.sql"

echo "💾 データベースバックアップを実行中..."

# バックアップディレクトリ作成
mkdir -p $BACKUP_DIR

# MySQLバックアップ
docker-compose exec -T database mysqldump \
    -u cooking_user \
    -pcooking_password \
    --single-transaction \
    --routines \
    --triggers \
    cooking_cost_system > $BACKUP_FILE

# 圧縮
gzip $BACKUP_FILE

echo "✅ バックアップが完了しました: ${BACKUP_FILE}.gz"

# 古いバックアップの削除（30日以上前）
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "🧹 古いバックアップを削除しました"