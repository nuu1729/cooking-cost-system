# デプロイメントガイド

料理原価計算システム バックエンドAPIのデプロイメント手順書です。

## 目次

1. [環境要件](#環境要件)
2. [Docker デプロイメント](#docker-デプロイメント)
3. [Kubernetes デプロイメント](#kubernetes-デプロイメント)
4. [AWS ECS デプロイメント](#aws-ecs-デプロイメント)
5. [Google Cloud Run デプロイメント](#google-cloud-run-デプロイメント)
6. [手動デプロイメント](#手動デプロイメント)
7. [環境別設定](#環境別設定)
8. [監視・ログ設定](#監視ログ設定)
9. [トラブルシューティング](#トラブルシューティング)

## 環境要件

### 最小システム要件

- **CPU**: 2コア以上
- **メモリ**: 4GB以上
- **ストレージ**: 20GB以上
- **OS**: Ubuntu 20.04 LTS / CentOS 8 / Amazon Linux 2

### 推奨システム要件

- **CPU**: 4コア以上
- **メモリ**: 8GB以上
- **ストレージ**: 50GB以上（SSD推奨）
- **ネットワーク**: 100Mbps以上

### 必要なソフトウェア

- **Node.js**: 18.0.0以上
- **MySQL**: 8.0以上
- **Redis**: 7.0以上（オプション）
- **Docker**: 20.10以上
- **Docker Compose**: 2.0以上

## Docker デプロイメント

### 1. 基本的なDockerデプロイ

```bash
# リポジトリをクローン
git clone 
cd cooking-cost-system/backend

# 環境変数ファイルを作成
cp .env.example .env

# 環境変数を編集
nano .env

# Docker Composeで起動
docker-compose up -d

# ログを確認
docker-compose logs -f backend-prod
```

### 2. 環境変数の設定

`.env` ファイルを以下のように設定：

```env
# 基本設定
NODE_ENV=production
PORT=3001

# データベース設定
DB_HOST=database
DB_PORT=3306
DB_NAME=cooking_cost_system
DB_USER=cooking_user
DB_PASSWORD=your_secure_password

# セキュリティ設定
JWT_SECRET=your_very_secure_jwt_secret_key_here
CORS_ORIGIN=https://your-frontend-domain.com

# ログ設定
LOG_LEVEL=info

# ファイルアップロード設定
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/app/uploads
```

### 3. SSL証明書の設定

```bash
# Let's Encryptを使用した証明書取得
sudo apt install certbot
sudo certbot certonly --standalone -d api.your-domain.com

# Nginxプロキシ設定
cp deploy/nginx.conf /etc/nginx/sites-available/cooking-cost-api
sudo ln -s /etc/nginx/sites-available/cooking-cost-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. データベース初期化

```bash
# コンテナ内でマイグレーション実行
docker-compose exec database mysql -u root -p
CREATE DATABASE cooking_cost_system;
CREATE USER 'cooking_user'@'%' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON cooking_cost_system.* TO 'cooking_user'@'%';
FLUSH PRIVILEGES;
exit

# テーブル作成
docker-compose exec backend mysql -h database -u cooking_user -p cooking_cost_system < database/init/01_create_tables.sql

# サンプルデータ投入（オプション）
docker-compose exec backend mysql -h database -u cooking_user -p cooking_cost_system < database/init/02_sample_data.sql
```

## Kubernetes デプロイメント

### 1. 事前準備

```bash
# Kubernetesクラスターの確認
kubectl cluster-info

# 名前空間の作成
kubectl create namespace cooking-cost-system

# Secretの作成
kubectl create secret generic cooking-cost-secrets \
  --from-literal=DB_USER=cooking_user \
  --from-literal=DB_PASSWORD=your_secure_password \
  --from-literal=JWT_SECRET=your_jwt_secret \
  --namespace=cooking-cost-system
```

### 2. デプロイメント実行

```bash
# 設定ファイルを適用
kubectl apply -f deploy/kubernetes.yaml

# デプロイメント状況の確認
kubectl get pods -n cooking-cost-system
kubectl get services -n cooking-cost-system

# ロールアウト状況の確認
kubectl rollout status deployment/cooking-cost-backend -n cooking-cost-system
```

### 3. Helmを使用したデプロイ

```bash
# Helmリポジトリの追加
helm repo add cooking-cost ./helm

# Helmチャートのインストール
helm install cooking-cost-backend ./helm/cooking-cost-backend \
  --namespace cooking-cost-system \
  --create-namespace \
  --values helm/values-production.yaml

# アップグレード
helm upgrade cooking-cost-backend ./helm/cooking-cost-backend \
  --namespace cooking-cost-system \
  --values helm/values-production.yaml
```

### 4. Ingressの設定

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: cooking-cost-ingress
  namespace: cooking-cost-system
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.cooking-system.com
    secretName: cooking-cost-tls
  rules:
  - host: api.cooking-system.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: cooking-cost-backend-service
            port:
              number: 80
```

## AWS ECS デプロイメント

### 1. ECRにイメージをプッシュ

```bash
# ECRリポジトリの作成
aws ecr create-repository --repository-name cooking-cost-backend

# Dockerイメージをビルド
docker build -t cooking-cost-backend .

# ECRにログイン
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com

# イメージにタグ付け
docker tag cooking-cost-backend:latest 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/cooking-cost-backend:latest

# イメージをプッシュ
docker push 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/cooking-cost-backend:latest
```

### 2. ECSタスク定義の作成

```json
{
  "family": "cooking-cost-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "cooking-cost-backend",
      "image": "123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/cooking-cost-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3001"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:ssm:ap-northeast-1:123456789012:parameter/cooking-cost/db-password"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:ssm:ap-northeast-1:123456789012:parameter/cooking-cost/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/cooking-cost-backend",
          "awslogs-region": "ap-northeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:3001/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### 3. ECSサービスの作成

```bash
# クラスターの作成
aws ecs create-cluster --cluster-name cooking-cost-cluster

# サービスの作成
aws ecs create-service \
  --cluster cooking-cost-cluster \
  --service-name cooking-cost-backend-service \
  --task-definition cooking-cost-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345,subnet-67890],securityGroups=[sg-abcdef],assignPublicIp=ENABLED}"
```

## Google Cloud Run デプロイメント

### 1. イメージをGoogle Container Registryにプッシュ

```bash
# Google Cloud SDKの認証
gcloud auth login
gcloud config set project your-project-id

# Dockerイメージをビルド
docker build -t gcr.io/your-project-id/cooking-cost-backend .

# イメージをプッシュ
docker push gcr.io/your-project-id/cooking-cost-backend
```

### 2. Cloud Runサービスのデプロイ

```bash
# サービスのデプロイ
gcloud run deploy cooking-cost-backend \
  --image gcr.io/your-project-id/cooking-cost-backend \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production,PORT=8080 \
  --set-secrets DB_PASSWORD=cooking-cost-db-password:latest,JWT_SECRET=cooking-cost-jwt-secret:latest
```

### 3. カスタムドメインの設定

```bash
# ドメインマッピングの作成
gcloud run domain-mappings create \
  --service cooking-cost-backend \
  --domain api.cooking-system.com \
  --region asia-northeast1
```

## 手動デプロイメント

### 1. サーバーの準備

```bash
# Node.jsのインストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# MySQLのインストール
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# Nginxのインストール
sudo apt install nginx

# PM2のインストール（プロセスマネージャー）
sudo npm install -g pm2
```

### 2. アプリケーションのデプロイ

```bash
# アプリケーションディレクトリの作成
sudo mkdir -p /opt/cooking-cost-backend
sudo chown $USER:$USER /opt/cooking-cost-backend

# ソースコードのデプロイ
cd /opt/cooking-cost-backend
git clone  .

# 依存関係のインストール
npm ci --production

# TypeScriptのビルド
npm run build

# 環境変数ファイルの作成
cp .env.example .env
nano .env

# データベースの初期化
mysql -u root -p < database/init/01_create_tables.sql

# PM2でアプリケーションを起動
pm2 start dist/server.js --name cooking-cost-backend
pm2 save
pm2 startup
```

### 3. Nginxの設定

```nginx
# /etc/nginx/sites-available/cooking-cost-api
server {
    listen 80;
    server_name api.cooking-system.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.cooking-system.com;

    ssl_certificate /etc/letsencrypt/live/api.cooking-system.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.cooking-system.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        alias /opt/cooking-cost-backend/uploads/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

## 環境別設定

### 開発環境 (Development)

```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_NAME=cooking_cost_system_dev
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
```

### ステージング環境 (Staging)

```env
NODE_ENV=staging
PORT=3001
DB_HOST=staging-db.cooking-system.com
DB_NAME=cooking_cost_system_staging
LOG_LEVEL=info
CORS_ORIGIN=https://staging.cooking-system.com
```

### 本番環境 (Production)

```env
NODE_ENV=production
PORT=3001
DB_HOST=prod-db.cooking-system.com
DB_NAME=cooking_cost_system
LOG_LEVEL=warn
CORS_ORIGIN=https://cooking-system.com
```

## 監視・ログ設定

### 1. ログ設定

```bash
# logrotateの設定
sudo tee /etc/logrotate.d/cooking-cost-backend << EOF
/opt/cooking-cost-backend/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

### 2. Prometheusメトリクス

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'cooking-cost-backend'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

### 3. Grafanaダッシュボード

```json
{
  "dashboard": {
    "title": "Cooking Cost System - Backend Metrics",
    "panels": [
      {
        "title": "HTTP Requests",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{status_code}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ]
  }
}
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. データベース接続エラー

```bash
# 問題: ECONNREFUSED 127.0.0.1:3306
# 解決方法:

# MySQLサービスの状態確認
sudo systemctl status mysql

# MySQLの起動
sudo systemctl start mysql

# 接続設定の確認
mysql -u cooking_user -p -h localhost
```

#### 2. メモリ不足エラー

```bash
# 問題: ENOMEM
# 解決方法:

# メモリ使用量の確認
free -h
ps aux --sort=-%mem | head

# スワップファイルの作成
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### 3. ポート競合

```bash
# 問題: EADDRINUSE :::3001
# 解決方法:

# ポート使用状況の確認
sudo lsof -i :3001

# プロセスの終了
sudo kill -9 

# 別のポートの使用
export PORT=3002
```

#### 4. SSL証明書エラー

```bash
# 問題: SSL証明書の期限切れ
# 解決方法:

# 証明書の更新
sudo certbot renew

# Nginxの再起動
sudo systemctl reload nginx
```

### ログ分析

```bash
# エラーログの確認
tail -f logs/error-*.log

# アクセスログの確認
tail -f logs/access-*.log

# 特定のエラーの検索
grep "ERROR" logs/combined-*.log | tail -20

# パフォーマンス問題の調査
grep "Slow query" logs/combined-*.log
```

### パフォーマンス最適化

```bash
# Node.jsヒープサイズの増加
export NODE_OPTIONS="--max-old-space-size=4096"

# PM2クラスターモード
pm2 start dist/server.js -i max --name cooking-cost-backend-cluster

# データベースのインデックス確認
mysql -u cooking_user -p -e "SHOW INDEX FROM ingredients" cooking_cost_system
```

## バックアップとリストア

### データベースバックアップ

```bash
# 日次バックアップスクリプト
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u cooking_user -p cooking_cost_system > /backup/cooking_cost_${DATE}.sql
gzip /backup/cooking_cost_${DATE}.sql

# 古いバックアップの削除（30日以上）
find /backup -name "cooking_cost_*.sql.gz" -mtime +30 -delete
```

### アプリケーションバックアップ

```bash
# ファイルのバックアップ
tar -czf /backup/uploads_${DATE}.tar.gz /opt/cooking-cost-backend/uploads/
tar -czf /backup/logs_${DATE}.tar.gz /opt/cooking-cost-backend/logs/
```

## セキュリティ設定

### ファイアウォール設定

```bash
# UFWの設定
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

### SSL/TLS設定

```nginx
# 強化されたSSL設定
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

## 更新とメンテナンス

### ゼロダウンタイム更新

```bash
# Blue-Greenデプロイメント
pm2 start dist/server.js --name cooking-cost-backend-blue
# 新バージョンのテスト後
pm2 delete cooking-cost-backend-green
pm2 restart cooking-cost-backend-blue --name cooking-cost-backend
```

### 定期メンテナンス

```bash
# ログローテーション
pm2 reloadLogs

# データベース最適化
mysql -u cooking_user -p -e "OPTIMIZE TABLE ingredients, dishes, completed_foods" cooking_cost_system

# システム更新
sudo apt update && sudo apt upgrade
```

このデプロイメントガイドに従って、安全で効率的な本番環境を構築してください。問題が発生した場合は、トラブルシューティングセクションを参照し、必要に応じてサポートチームに連絡してください。
