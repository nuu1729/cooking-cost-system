#!/bin/bash

# 🍽️ 料理原価計算システム v2.0 - デプロイスクリプト

set -e

ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}

echo "🚀 料理原価計算システム v2.0 - ${ENVIRONMENT} 環境デプロイ"
echo "=================================================="

# 環境変数の読み込み
if [ -f ".env.${ENVIRONMENT}" ]; then
    source ".env.${ENVIRONMENT}"
else
    echo "❌ 環境設定ファイル .env.${ENVIRONMENT} が見つかりません"
    exit 1
fi

# 前提条件チェック
if [ "$ENVIRONMENT" = "production" ]; then
    echo "⚠️  本番環境にデプロイしようとしています"
    read -p "続行しますか？ (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ デプロイをキャンセルしました"
        exit 1
    fi
fi

# バックアップ（本番環境のみ）
if [ "$ENVIRONMENT" = "production" ]; then
    echo "💾 データベースをバックアップ中..."
    ./scripts/backup.sh
fi

# Docker イメージのビルド
echo "🔨 Docker イメージをビルド中..."
docker-compose -f docker-compose.prod.yml build

# デプロイ実行
echo "🚀 ${ENVIRONMENT} 環境にデプロイ中..."
docker-compose -f docker-compose.prod.yml up -d

# ヘルスチェック
echo "🏥 サービスのヘルスチェック中..."
sleep 60

if curl -f http://localhost/health &> /dev/null; then
    echo "✅ デプロイが完了しました"
else
    echo "❌ デプロイに失敗しました"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

echo "🎉 ${ENVIRONMENT} 環境へのデプロイが完了しました！"