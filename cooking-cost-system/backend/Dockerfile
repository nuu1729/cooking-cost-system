FROM python:3.11-slim

# .pyc ファイル生成を抑制・stdout/stderr バッファリングを無効化（ログがリアルタイムで出力される）
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 非 root ユーザーを作成（セキュリティ強化）
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# 依存関係を先にコピーしてキャッシュを活用
COPY requirements.txt ./
# requirements.txt は pip-compile (pip-tools) で生成したロックファイル
# 依存関係を更新する場合: python -m piptools compile requirements.in --output-file requirements.txt
# ⚠️ Python 3.11 (本番環境) で再生成すること（異なるバージョンで生成すると解決結果が変わる場合がある）
#    Docker が使える場合: docker compose run --rm backend pip-compile requirements.in
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ディレクトリを先に作成（COPY 前に作ることで .dockerignore に logs/uploads が含まれていても
# ホストのファイルで上書きされるリスクを防ぐ）
RUN mkdir -p logs uploads

# アプリケーションコードをコピー（--chown でファイル所有者を直接指定）
COPY --chown=appuser:appuser . .

# COPY 後に所有者を確実に設定（COPY --chown は既存ディレクトリの所有者を変更しないため）
RUN chown appuser:appuser logs uploads \
    && chmod +x entrypoint.sh

USER appuser

EXPOSE 3001

# HEALTHCHECK は docker-compose.prod.yml 側で一元管理する（start_period 等の調整を一箇所に集約）

# entrypoint.sh が Docker secrets を読み込み DATABASE_URL_PRODUCTION を構築した後に Gunicorn を起動する
# CMD のデフォルト引数は entrypoint.sh の "$@" に渡される
# デバッグ時は `docker run --entrypoint /bin/sh image` でシェル起動可能
ENTRYPOINT ["./entrypoint.sh"]
CMD ["gunicorn", "--config", "gunicorn.conf.py", "wsgi:app"]
