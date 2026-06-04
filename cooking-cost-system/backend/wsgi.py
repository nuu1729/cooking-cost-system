import logging
import sys

try:
    from app import create_app
    app = create_app()
except Exception:
    # exc_info=True でスタックトレースを出力するため引数 e は不要（二重出力になる）
    logging.critical('アプリケーション起動失敗', exc_info=True)
    # sys.exit() ではなく raise でGunicornに例外を伝播させる
    # sys.exit(1) だとGunicornがワーカーを再生成し続けエラーループに陥る
    raise
