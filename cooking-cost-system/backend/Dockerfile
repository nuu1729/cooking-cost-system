FROM node:18-alpine AS builder

# 作業ディレクトリ設定
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係インストール
RUN npm ci --only=production && npm cache clean --force

# ソースコードをコピー
COPY . .

# TypeScriptビルド
RUN npm run build

# 本番用イメージ
FROM node:18-alpine AS production

# セキュリティ: rootユーザーを使わない
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# 作業ディレクトリ設定
WORKDIR /app

# 必要なディレクトリを作成
RUN mkdir -p logs uploads dist && \
    chown -R nodeuser:nodejs /app

# 本番依存関係のみコピー
COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodeuser:nodejs /app/dist ./dist
COPY --from=builder --chown=nodeuser:nodejs /app/package*.json ./

# ヘルスチェック用のスクリプト
COPY --chown=nodeuser:nodejs <<EOF /app/health-check.js
const http = require('http');
const options = {
    host: 'localhost',
    port: process.env.PORT || 3001,
    path: '/health',
    timeout: 2000,
};
const request = http.request(options, (res) => {
    if (res.statusCode === 200) {
        process.exit(0);
    } else {
        process.exit(1);
    }
});
request.on('error', () => process.exit(1));
request.on('timeout', () => process.exit(1));
request.end();
EOF

# ユーザー切り替え
USER nodeuser

# ポート公開
EXPOSE 3001

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node health-check.js

# 起動コマンド
CMD ["node", "dist/server.js"]