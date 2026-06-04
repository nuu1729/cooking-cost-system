import logging
import sys

# フォールバック設定: create_app() 内でロギングが設定される前に起動失敗した場合に備える
# WARNING にすることで create_app() 内部の警告も捕捉できる（CRITICAL だと握りつぶす）
# create_app() 内でロガーが設定されると basicConfig は上書きされる
logging.basicConfig(level=logging.WARNING)

try:
    from app import create_app
    app = create_app()
except Exception:
    # exc_info=True でスタックトレースを出力するため引数 e は不要（二重出力になる）
    logging.critical('アプリケーション起動失敗', exc_info=True)
    # sys.exit() ではなく raise でGunicornに例外を伝播させる
    # sys.exit(1) だとGunicornがワーカーを再生成し続けエラーループに陥る
    raise
