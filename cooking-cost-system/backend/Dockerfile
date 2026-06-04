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

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:3001/api/health')" || exit 1

# Gunicorn でマルチワーカー起動（wsgi.py 経由で create_app() を呼ぶ）
CMD ["gunicorn", \
     "--bind", "0.0.0.0:3001", \
     "--workers", "4", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "wsgi:app"]
