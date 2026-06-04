import logging
import sys

try:
    from app import create_app
    app = create_app()
except Exception as e:
    logging.critical('アプリケーション起動失敗: %s', e, exc_info=True)
    sys.exit(1)
