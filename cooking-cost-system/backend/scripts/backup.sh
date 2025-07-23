#!/bin/bash

# ================================
# 料理原価計算システム - バックアップスクリプト
# ================================

set -euo pipefail

# 設定変数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
LOG_FILE="$BACKUP_DIR/backup.log"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=${RETENTION_DAYS:-7}

# 環境変数の読み込み
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
fi

# デフォルト値の設定
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-cooking_cost_system}
DB_USER=${DB_USER:-cooking_user}
DB_PASSWORD=${DB_PASSWORD:-}

# カラーコード
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        INFO)  echo -e "${GREEN}[INFO]${NC} $message" ;;
        WARN)  echo -e "${YELLOW}[WARN]${NC} $message" ;;
        ERROR) echo -e "${RED}[ERROR]${NC} $message" ;;
        DEBUG) echo -e "${BLUE}[DEBUG]${NC} $message" ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# エラーハンドリング
error_exit() {
    log ERROR "$1"
    exit 1
}

# バックアップディレクトリの作成
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log INFO "Created backup directory: $BACKUP_DIR"
    fi
}

# データベース接続テスト
test_db_connection() {
    log INFO "Testing database connection..."
    
    if ! command -v mysql &> /dev/null; then
        error_exit "MySQL client not found. Please install mysql-client."
    fi
    
    if ! mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" "$DB_NAME" &>/dev/null; then
        error_exit "Cannot connect to database. Please check connection parameters."
    fi
    
    log INFO "Database connection successful"
}

# データベースバックアップ
backup_database() {
    local backup_file="$BACKUP_DIR/db_backup_${DATE}.sql"
    local compressed_file="${backup_file}.gz"
    
    log INFO "Starting database backup..."
    
    # MySQLダンプの実行
    if ! mysqldump \
        -h"$DB_HOST" \
        -P"$DB_PORT" \
        -u"$DB_USER" \
        -p"$DB_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        --lock-tables=false \
        --add-drop-database \
        --databases "$DB_NAME" > "$backup_file"; then
        error_exit "Database backup failed"
    fi
    
    # 圧縮
    if ! gzip "$backup_file"; then
        error_exit "Failed to compress backup file"
    fi
    
    local file_size=$(du -h "$compressed_file" | cut -f1)
    log INFO "Database backup completed: $compressed_file ($file_size)"
    
    echo "$compressed_file"
}

# ファイルバックアップ
backup_files() {
    local backup_file="$BACKUP_DIR/files_backup_${DATE}.tar.gz"
    local files_to_backup=(
        "$PROJECT_ROOT/uploads"
        "$PROJECT_ROOT/logs"
        "$PROJECT_ROOT/.env"
        "$PROJECT_ROOT/package.json"
        "$PROJECT_ROOT/package-lock.json"
    )
    
    log INFO "Starting files backup..."
    
    # 存在するファイル/ディレクトリのみを対象とする
    local existing_files=()
    for file in "${files_to_backup[@]}"; do
        if [ -e "$file" ]; then
            existing_files+=("$file")
        fi
    done
    
    if [ ${#existing_files[@]} -eq 0 ]; then
        log WARN "No files found to backup"
        return
    fi
    
    # tar でアーカイブを作成
    if ! tar -czf "$backup_file" -C "$PROJECT_ROOT" \
        --exclude="node_modules" \
        --exclude="dist" \
        --exclude="coverage" \
        --exclude=".git" \
        "${existing_files[@]/#$PROJECT_ROOT\//}"; then
        error_exit "Files backup failed"
    fi
    
    local file_size=$(du -h "$backup_file" | cut -f1)
    log INFO "Files backup completed: $backup_file ($file_size)"
    
    echo "$backup_file"
}

# バックアップの検証
verify_backup() {
    local db_backup_file="$1"
    local files_backup_file="$2"
    
    log INFO "Verifying backups..."
    
    # データベースバックアップの検証
    if [ -f "$db_backup_file" ]; then
        if ! gunzip -t "$db_backup_file" &>/dev/null; then
            error_exit "Database backup file is corrupted"
        fi
        
        # SQLファイルの基本的な内容チェック
        local sql_content=$(gunzip -c "$db_backup_file" | head -20)
        if [[ ! "$sql_content" =~ "MySQL dump" ]]; then
            error_exit "Database backup file does not appear to be a valid MySQL dump"
        fi
    fi
    
    # ファイルバックアップの検証
    if [ -f "$files_backup_file" ]; then
        if ! tar -tzf "$files_backup_file" &>/dev/null; then
            error_exit "Files backup archive is corrupted"
        fi
    fi
    
    log INFO "Backup verification completed successfully"
}

# 古いバックアップの削除
cleanup_old_backups() {
    log INFO "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    local deleted_count=0
    
    # データベースバックアップの削除
    while IFS= read -r -d '' file; do
        rm "$file"
        ((deleted_count++))
        log INFO "Deleted old backup: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -print0)
    
    # ファイルバックアップの削除
    while IFS= read -r -d '' file; do
        rm "$file"
        ((deleted_count++))
        log INFO "Deleted old backup: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "files_backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -print0)
    
    if [ $deleted_count -eq 0 ]; then
        log INFO "No old backups to delete"
    else
        log INFO "Deleted $deleted_count old backup files"
    fi
}

# S3アップロード（オプション）
upload_to_s3() {
    local file="$1"
    
    if [ -z "${AWS_S3_BUCKET:-}" ] || [ -z "${AWS_REGION:-}" ]; then
        log DEBUG "S3 upload skipped (AWS_S3_BUCKET or AWS_REGION not set)"
        return
    fi
    
    if ! command -v aws &> /dev/null; then
        log WARN "AWS CLI not found. S3 upload skipped."
        return
    fi
    
    log INFO "Uploading to S3: $file"
    
    local s3_path="s3://${AWS_S3_BUCKET}/cooking-cost-system/$(basename "$file")"
    
    if aws s3 cp "$file" "$s3_path" --region "$AWS_REGION"; then
        log INFO "Successfully uploaded to S3: $s3_path"
    else
        log ERROR "Failed to upload to S3: $file"
    fi
}

# Slack通知（オプション）
send_slack_notification() {
    local status="$1"
    local message="$2"
    
    if [ -z "${SLACK_WEBHOOK_URL:-}" ]; then
        return
    fi
    
    local color
    case $status in
        success) color="good" ;;
        error) color="danger" ;;
        *) color="warning" ;;
    esac
    
    local payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "Cooking Cost System Backup",
            "text": "$message",
            "footer": "Backup Script",
            "ts": $(date +%s)
        }
    ]
}
EOF
)
    
    curl -X POST -H 'Content-type: application/json' \
        --data "$payload" \
        "$SLACK_WEBHOOK_URL" &>/dev/null || true
}

# バックアップ統計の表示
show_backup_stats() {
    log INFO "Backup Statistics:"
    log INFO "=================="
    
    local total_backups=$(find "$BACKUP_DIR" -name "*backup_*.gz" -o -name "*backup_*.tar.gz" | wc -l)
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    
    log INFO "Total backup files: $total_backups"
    log INFO "Total backup size: $total_size"
    
    log INFO "Recent backups:"
    find "$BACKUP_DIR" -name "*backup_*" -type f -mtime -7 -exec ls -lh {} \; | \
        awk '{print $9 " (" $5 ") - " $6 " " $7 " " $8}' | \
        sort -r | head -10 | while read line; do
        log INFO "  $line"
    done
}

# メイン処理
main() {
    log INFO "Starting backup process..."
    log INFO "========================="
    
    local start_time=$(date +%s)
    local db_backup_file=""
    local files_backup_file=""
    
    trap 'error_exit "Backup process interrupted"' INT TERM
    
    # 前処理
    create_backup_dir
    test_db_connection
    
    # バックアップ実行
    db_backup_file=$(backup_database)
    files_backup_file=$(backup_files)
    
    # バックアップ検証
    verify_backup "$db_backup_file" "$files_backup_file"
    
    # S3アップロード
    if [ -n "$db_backup_file" ]; then
        upload_to_s3 "$db_backup_file"
    fi
    if [ -n "$files_backup_file" ]; then
        upload_to_s3 "$files_backup_file"
    fi
    
    # クリーンアップ
    cleanup_old_backups
    
    # 統計表示
    show_backup_stats
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log INFO "Backup process completed successfully in ${duration}s"
    
    # 成功通知
    send_slack_notification "success" "Backup completed successfully in ${duration}s"
}

# スクリプト実行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi

# ================================
# scripts/restore.sh - リストアスクリプト
# ================================

#!/bin/bash

set -euo pipefail

# 設定変数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"

# 使用方法の表示
usage() {
    echo "Usage: $0 <database_backup_file> [files_backup_file]"
    echo "Example: $0 db_backup_20250101_120000.sql.gz files_backup_20250101_120000.tar.gz"
    exit 1
}

# 引数チェック
if [ $# -lt 1 ]; then
    usage
fi

DB_BACKUP_FILE="$1"
FILES_BACKUP_FILE="${2:-}"

# 環境変数の読み込み
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-cooking_cost_system}
DB_USER=${DB_USER:-cooking_user}
DB_PASSWORD=${DB_PASSWORD:-}

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# データベースリストア
restore_database() {
    log "Starting database restore from $DB_BACKUP_FILE"
    
    if [ ! -f "$DB_BACKUP_FILE" ]; then
        echo "Error: Database backup file not found: $DB_BACKUP_FILE"
        exit 1
    fi
    
    # データベースの確認
    read -p "This will overwrite the current database '$DB_NAME'. Continue? [y/N]: " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Restore cancelled"
        exit 0
    fi
    
    # リストア実行
    if [[ "$DB_BACKUP_FILE" == *.gz ]]; then
        gunzip -c "$DB_BACKUP_FILE" | mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD"
    else
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" < "$DB_BACKUP_FILE"
    fi
    
    log "Database restore completed"
}

# ファイルリストア
restore_files() {
    if [ -z "$FILES_BACKUP_FILE" ] || [ ! -f "$FILES_BACKUP_FILE" ]; then
        log "Files backup not specified or not found, skipping files restore"
        return
    fi
    
    log "Starting files restore from $FILES_BACKUP_FILE"
    
    # バックアップディレクトリを作成
    local restore_temp_dir="$PROJECT_ROOT/restore_temp"
    mkdir -p "$restore_temp_dir"
    
    # アーカイブを展開
    tar -xzf "$FILES_BACKUP_FILE" -C "$restore_temp_dir"
    
    # ファイルをコピー
    if [ -d "$restore_temp_dir/uploads" ]; then
        cp -r "$restore_temp_dir/uploads" "$PROJECT_ROOT/"
        log "Restored uploads directory"
    fi
    
    if [ -d "$restore_temp_dir/logs" ]; then
        cp -r "$restore_temp_dir/logs" "$PROJECT_ROOT/"
        log "Restored logs directory"
    fi
    
    # 一時ディレクトリを削除
    rm -rf "$restore_temp_dir"
    
    log "Files restore completed"
}

# メイン処理
main() {
    log "Starting restore process"
    restore_database
    restore_files
    log "Restore process completed"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi

# ================================
# scripts/maintenance.sh - メンテナンススクリプト
# ================================

#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 環境変数の読み込み
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-cooking_cost_system}
DB_USER=${DB_USER:-cooking_user}
DB_PASSWORD=${DB_PASSWORD:-}

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# データベース最適化
optimize_database() {
    log "Starting database optimization..."
    
    # テーブル最適化
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" <<EOF
OPTIMIZE TABLE ingredients;
OPTIMIZE TABLE dishes;
OPTIMIZE TABLE dish_ingredients;
OPTIMIZE TABLE completed_foods;
OPTIMIZE TABLE food_dishes;
OPTIMIZE TABLE memos;
ANALYZE TABLE ingredients;
ANALYZE TABLE dishes;
ANALYZE TABLE dish_ingredients;
ANALYZE TABLE completed_foods;
ANALYZE TABLE food_dishes;
ANALYZE TABLE memos;
EOF
    
    log "Database optimization completed"
}

# ログローテーション
rotate_logs() {
    log "Starting log rotation..."
    
    local log_dir="$PROJECT_ROOT/logs"
    if [ -d "$log_dir" ]; then
        find "$log_dir" -name "*.log" -size +10M -exec gzip {} \;
        find "$log_dir" -name "*.log.gz" -mtime +30 -delete
        log "Log rotation completed"
    fi
}

# 一時ファイルクリーンアップ
cleanup_temp_files() {
    log "Cleaning up temporary files..."
    
    # アップロードディレクトリの古いファイル
    local upload_dir="$PROJECT_ROOT/uploads"
    if [ -d "$upload_dir" ]; then
        find "$upload_dir" -type f -mtime +90 -delete
    fi
    
    # 一時ディレクトリ
    rm -rf "$PROJECT_ROOT/temp" "$PROJECT_ROOT/tmp"
    
    log "Temporary files cleanup completed"
}

# システム情報表示
show_system_info() {
    log "System Information:"
    log "==================="
    
    # ディスク使用量
    echo "Disk Usage:"
    df -h "$PROJECT_ROOT"
    
    # メモリ使用量
    echo "Memory Usage:"
    free -h
    
    # データベースサイズ
    echo "Database Size:"
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
    SELECT 
        table_name,
        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
    FROM information_schema.tables 
    WHERE table_schema = '$DB_NAME'
    ORDER BY (data_length + index_length) DESC;
    "
}

# メイン処理
case "${1:-help}" in
    optimize)
        optimize_database
        ;;
    logs)
        rotate_logs
        ;;
    cleanup)
        cleanup_temp_files
        ;;
    info)
        show_system_info
        ;;
    all)
        optimize_database
        rotate_logs
        cleanup_temp_files
        show_system_info
        ;;
    *)
        echo "Usage: $0 {optimize|logs|cleanup|info|all}"
        echo "  optimize - Optimize database tables"
        echo "  logs     - Rotate and clean log files"
        echo "  cleanup  - Clean temporary files"
        echo "  info     - Show system information"
        echo "  all      - Run all maintenance tasks"
        exit 1
        ;;
esac
