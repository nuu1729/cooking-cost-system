import os


def _get_int_env(key: str, default: int) -> int:
    """環境変数を整数として取得する。不正値の場合は明確なエラーで起動失敗させる。"""
    value = os.environ.get(key, str(default))
    try:
        result = int(value)
    except ValueError:
        # int() 変換失敗と <=0 チェックを分離し、エラーメッセージの二重ネストを防ぐ
        raise ValueError(f'環境変数 {key}={value!r} は整数である必要があります') from None
    if result <= 0:
        raise ValueError(f'環境変数 {key}={value!r} は正の整数である必要があります')
    return result


# PORT バリデーション（不正値を Gunicorn 起動前に検出する）
_port = _get_int_env('PORT', 3001)
if not (1 <= _port <= 65535):
    raise ValueError(f'PORT={_port} は 1–65535 の範囲である必要があります')
bind = f"0.0.0.0:{_port}"

workers = _get_int_env('GUNICORN_WORKERS', 2)
timeout = _get_int_env('GUNICORN_TIMEOUT', 120)
accesslog = '-'
errorlog = '-'

# sync ワーカー（デフォルト）。長時間リクエストが増えた場合は gthread を検討。
worker_class = os.environ.get('GUNICORN_WORKER_CLASS', 'sync')

# worker_connections は gevent/eventlet 専用設定（sync ワーカーでは使用されない）
# worker_class を sync 以外に変更した場合のみ有効になる
if worker_class != 'sync':
    worker_connections = _get_int_env('GUNICORN_WORKER_CONNECTIONS', 1000)

# DB コネクションプール設計メモ:
# workers × (pool_size + max_overflow) が MySQL の max_connections を超えないよう注意。
# デフォルト: workers=2, SQLAlchemy pool_size=5, max_overflow=10 → 最大 30 コネクション
# MySQL デフォルト max_connections=151 なので現状は余裕あり。


def on_starting(server):
    """Gunicorn master プロセス起動時に1回だけ呼ばれる（ワーカーフォーク前）"""
    server.log.info(
        'Gunicorn starting | FLASK_ENV=%s workers=%d worker_class=%s bind=%s',
        os.environ.get('FLASK_ENV', 'development'),
        workers,
        worker_class,
        bind,
    )
