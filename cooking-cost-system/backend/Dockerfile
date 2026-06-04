FROM python:3.11-slim

# .pyc ファイル生成を抑制・stdout/stderr バッファリングを無効化（ログがリアルタイムで出力される）
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 非 root ユーザーを作成（セキュリティ強化）
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# 依存関係を先にコピーしてキャッシュを活用
COPY requirements.txt ./
# pip をアップグレードしてから依存関係をインストール
# ⚠️ --upgrade pip はサプライチェーンリスクがあるため、厳密な環境では pip==x.y.z でバージョン固定を検討
# 全パッケージのバージョン固定は issue #117 (pip-tools 導入) で対応予定
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー（--chown でファイル所有者を直接指定）
COPY --chown=appuser:appuser . .

# COPY より後にディレクトリ作成・所有者設定
# （mkdir を COPY 前に行うと root 所有のまま残り appuser が書き込めない）
RUN mkdir -p logs uploads && chown appuser:appuser logs uploads

USER appuser

EXPOSE 3001

# HEALTHCHECK は docker-compose.prod.yml 側で一元管理する（start_period 等の調整を一箇所に集約）

# Gunicorn でマルチワーカー起動（gunicorn.conf.py で bind / workers / timeout を管理）
# GUNICORN_WORKERS・GUNICORN_TIMEOUT は docker-compose.prod.yml の environment で上書き可能
CMD ["gunicorn", "--config", "gunicorn.conf.py", "wsgi:app"]
