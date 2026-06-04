import logging
import os
from app import create_app

app = create_app()

# Gunicorn 起動時に設定サマリーをログ出力
logging.getLogger(__name__).info(
    'App started | FLASK_ENV=%s WORKERS=%s',
    os.environ.get('FLASK_ENV', 'development'),
    os.environ.get('GUNICORN_WORKERS', '2'),
)

if __name__ == '__main__':
    # ローカル開発用（gunicorn 不使用）
    port = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=port)
