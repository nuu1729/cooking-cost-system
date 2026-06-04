FROM python:3.11-slim

# 非 root ユーザーを作成（セキュリティ強化）
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# 依存関係を先にコピーしてキャッシュを活用
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY . .

# ログ・アップロードディレクトリを作成し所有者を変更
RUN mkdir -p logs uploads && chown -R appuser:appuser /app

USER appuser

EXPOSE 3001

# HEALTHCHECK は docker-compose.prod.yml 側で一元管理する（start_period 等の調整を一箇所に集約）

# Gunicorn でマルチワーカー起動（gunicorn.conf.py で bind / workers / timeout を管理）
# GUNICORN_WORKERS・GUNICORN_TIMEOUT は docker-compose.prod.yml の environment で上書き可能
CMD ["gunicorn", "--config", "gunicorn.conf.py", "wsgi:app"]
