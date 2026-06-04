import os

bind = f"0.0.0.0:{os.environ.get('PORT', '3001')}"
workers = int(os.environ.get('GUNICORN_WORKERS', '2'))
timeout = int(os.environ.get('GUNICORN_TIMEOUT', '120'))
accesslog = '-'
errorlog = '-'


def on_starting(server):
    """Gunicorn master プロセス起動時に1回だけ呼ばれる（ワーカーフォーク前）"""
    server.log.info(
        'Gunicorn starting | FLASK_ENV=%s workers=%d bind=%s',
        os.environ.get('FLASK_ENV', 'development'),
        workers,
        bind,
    )
