FROM node:18-alpine AS builder

# 作業ディレクトリ設定
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係インストール
RUN npm ci --only=production && npm cache clean --force

# ソースコードをコピー
COPY . .

# 環境変数設定（ビルド時）
ENV NODE_ENV=production
ENV VITE_API_URL=/api

# ビルド実行
RUN npm run build

# Nginx本番用イメージ
FROM nginx:1.25-alpine AS production

# セキュリティ設定
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginxuser -u 1001 -G nginx

# Nginx設定ファイルをコピー
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/build /usr/share/nginx/html

# 必要なディレクトリの権限設定
RUN chown -R nginxuser:nginx /usr/share/nginx/html && \
    chown -R nginxuser:nginx /var/cache/nginx && \
    chown -R nginxuser:nginx /var/log/nginx && \
    chown -R nginxuser:nginx /etc/nginx/conf.d

# nginx.pidファイルの権限設定
RUN touch /var/run/nginx.pid && \
    chown -R nginxuser:nginx /var/run/nginx.pid

# ヘルスチェック用のページを作成
RUN echo '<!DOCTYPE html><html><head><title>Health Check</title></head><body><h1>OK</h1></body></html>' > /usr/share/nginx/html/health

# ユーザー切り替え
USER nginxuser

# ポート公開
EXPOSE 8080

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# 起動コマンド
CMD ["nginx", "-g", "daemon off;"]