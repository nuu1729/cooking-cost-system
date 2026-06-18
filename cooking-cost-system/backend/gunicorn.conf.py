import os
import sys


def _get_int_env(key: str, default: int) -> int:
    """環境変数を正の整数として取得する。

    制約: result > 0 を要求する（ゼロ・負数は不正）。
    timeout に 0（無限待ち）が必要な場合はこの関数を使わず直接 os.environ.get() を使うこと。
    不正値の場合は ValueError を送出する。
    """
    value = os.environ.get(key, str(default))
    try:
        result = int(value)
    except ValueError:
        raise ValueError(f'環境変数 {key}={value!r} は整数である必要があります') from None
    if result <= 0:
        raise ValueError(f'環境変数 {key}={value!r} は正の整数である必要があります')
    return result


# モジュールレベルの設定エラーを stderr に出力して raise で Gunicorn に伝播させる
# sys.exit(1) は wsgi.py と方針矛盾（master プロセスへの例外伝播が望ましい）

# try 失敗時に on_starting が NameError にならないよう事前宣言（None のまま on_starting が呼ばれた場合は RuntimeError）
# NOTE: int | None 構文は Python 3.10+。Dockerfile が python:3.11-slim のため問題なし。
workers: int | None = None

try:
    # _get_int_env で <=0 は弾かれる。ここでは上限（>65535）のみを追加でチェックする。
    _port = _get_int_env('PORT', 3001)
    if _port > 65535:
        raise ValueError(f'PORT={_port} は 65535 以下である必要があります')

    workers = _get_int_env('GUNICORN_WORKERS', 2)
    timeout = _get_int_env('GUNICORN_TIMEOUT', 120)
except ValueError as e:
    print(f'[FATAL] Gunicorn 設定エラー: {e}', file=sys.stderr)
    raise

bind = f"0.0.0.0:{_port}"  # コンテナ内では 0.0.0.0 でバインド（外部公開は docker-compose で 127.0.0.1 に制限）
accesslog = '-'
errorlog = '-'

# sync ワーカー（デフォルト）。長時間リクエストが増えた場合は gthread を検討。
worker_class = os.environ.get('GUNICORN_WORKER_CLASS', 'sync')

# worker_connections は gevent/eventlet 専用設定（sync ワーカーでは使用されない）
# None をモジュールレベルで設定すると Gunicorn が設定値として読み込み予期しない動作をする可能性があるため
# sync の場合は定義を省略して Gunicorn デフォルト値（1000）に委ねる
# ※ if ブロック内でのみ定義されるが、Gunicorn はモジュールグローバルを参照するため動作に問題はない
if worker_class != 'sync':
    try:
        worker_connections = _get_int_env('GUNICORN_WORKER_CONNECTIONS', 1000)
    except ValueError as e:
        print(f'[FATAL] Gunicorn 設定エラー: {e}', file=sys.stderr)
        raise

# DB コネクションプール設計メモ:
# workers × (pool_size + max_overflow) が MySQL の max_connections を超えないよう注意。
# デフォルト: workers=2, SQLAlchemy pool_size=5, max_overflow=10 → 最大 30 コネクション
# MySQL デフォルト max_connections=151 なので現状は余裕あり。


def on_starting(server):
    """Gunicorn master プロセス起動時に1回だけ呼ばれる（ワーカーフォーク前）"""
    if workers is None:
        raise RuntimeError('workers が初期化されていません。Gunicorn 設定エラーを確認してください。')
    # None チェック済みを静的解析ツール（mypy 等）に伝える
    assert workers is not None
    server.log.info(
        'Gunicorn starting | FLASK_ENV=%s workers=%d worker_class=%s bind=%s',
        os.environ.get('FLASK_ENV', 'development'),
        workers,
        worker_class,
        bind,
    )
