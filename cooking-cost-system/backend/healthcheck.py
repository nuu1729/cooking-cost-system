"""Gunicorn コンテナ用ヘルスチェックスクリプト。

docker-compose.prod.yml の healthcheck.test から呼び出される。
HTTPError（4xx/5xx）・接続エラーいずれも sys.exit(1) で異常終了とする。
"""
import os
import sys
import urllib.request

try:
    port_str = os.environ.get('PORT', '3001')
    port = int(port_str)
    if not (1 <= port <= 65535):
        raise ValueError(f'PORT={port} は 1–65535 の範囲外です')
    res = urllib.request.urlopen(f'http://localhost:{port}/api/health', timeout=5)
    sys.exit(0 if res.status == 200 else 1)
except Exception:
    sys.exit(1)
