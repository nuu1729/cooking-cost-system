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

# Gunicorn でマルチワーカー起動（wsgi.py 経由で create_app() を呼ぶ）
# GUNICORN_WORKERS: デフォルト 2（512MB 制限コンテナ向け）
#   推奨公式値: (2 × CPU コア数) + 1 — docker-compose.prod.yml の environment で上書き可能
# GUNICORN_TIMEOUT: デフォルト 120 秒
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-3001} --workers ${GUNICORN_WORKERS:-2} --timeout ${GUNICORN_TIMEOUT:-120} --access-logfile - --error-logfile - wsgi:app"]
