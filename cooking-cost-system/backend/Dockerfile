# ── base: 依存関係インストールまでの共通ステージ ──────────────────
FROM python:3.11-slim AS base

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
# setuptools は requirements.txt に含まれないベースイメージ同梱パッケージだが、
# pip-audit の対象になるため既知の脆弱性（例: PYSEC-2026-3447）を避けるため明示的に更新する
RUN pip install --no-cache-dir --upgrade pip setuptools && \
    pip install --no-cache-dir -r requirements.txt

# ── audit: 脆弱性スキャン専用ステージ ──────────────────────────────
# 既知の脆弱性を持つパッケージが含まれていないかビルド時にスキャンする。
# 検出時はビルドを失敗させる（デプロイは #157 のロールバック機構により旧バージョン継続で安全）。
# 誤検知や修正版未リリースで一時的に無視する場合: pip-audit --ignore-vuln <ID> を使う。
# ステージを分離することで pip-audit とその依存パッケージを本番イメージに一切残さない。
# pip-audit 自体もバージョン固定し、監査結果の再現性を確保する
# （更新する場合は `pip index versions pip-audit` で最新版を確認して差し替える）。
FROM base AS audit
RUN pip install --no-cache-dir "pip-audit==2.10.1" && \
    pip-audit --skip-editable && \
    touch /tmp/audit-passed

# ── production: 本番イメージ ───────────────────────────────────────
FROM base AS production

# BuildKit は最終ステージから参照されないステージをスキップするため、
# marker ファイルの COPY で audit ステージの実行（＝監査の通過）を強制する。
# marker は空ファイルで実害がないため /tmp に残置する。
COPY --from=audit /tmp/audit-passed /tmp/audit-passed

# ディレクトリを先に作成（COPY 前に作ることで .dockerignore に logs/uploads が含まれていても
# ホストのファイルで上書きされるリスクを防ぐ）
RUN mkdir -p logs uploads

# アプリケーションコードをコピー（--chown でファイル所有者を直接指定）
COPY --chown=appuser:appuser . .

# COPY 後に所有者を確実に設定（COPY --chown は既存ディレクトリの所有者を変更しないため）
RUN chown appuser:appuser logs uploads

USER appuser

EXPOSE 3001

# HEALTHCHECK は docker-compose.prod.yml 側で一元管理する（start_period 等の調整を一箇所に集約）

# secrets は Cloudflare Containers の envVars（Docker secrets 経由の環境変数フォールバックにも対応）
# として渡され、config_production.py が直接 os.environ から読み込むため、専用の entrypoint は不要
CMD ["gunicorn", "--config", "gunicorn.conf.py", "wsgi:app"]
