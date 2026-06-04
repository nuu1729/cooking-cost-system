import os

bind = f"0.0.0.0:{os.environ.get('PORT', '3001')}"
workers = int(os.environ.get('GUNICORN_WORKERS', '2'))
timeout = int(os.environ.get('GUNICORN_TIMEOUT', '120'))
accesslog = '-'
errorlog = '-'

# sync ワーカー（デフォルト）。長時間リクエスト（大容量アップロード等）が増えた場合は gthread を検討。
worker_class = os.environ.get('GUNICORN_WORKER_CLASS', 'sync')

# DB コネクションプール設計メモ:
# workers × (pool_size + max_overflow) が MySQL の max_connections を超えないよう注意。
# デフォルト: workers=2, SQLAlchemy pool_size=5, max_overflow=10 → 最大 30 コネクション
# MySQL デフォルト max_connections=151 なので現状は余裕あり。
worker_connections = 1000  # sync ワーカーでは使用されないが記録として明示


def on_starting(server):
    """Gunicorn master プロセス起動時に1回だけ呼ばれる（ワーカーフォーク前）"""
    server.log.info(
        'Gunicorn starting | FLASK_ENV=%s workers=%d worker_class=%s bind=%s',
        os.environ.get('FLASK_ENV', 'development'),
        workers,
        worker_class,
        bind,
    )
