"""Gunicorn コンテナ用ヘルスチェックスクリプト。

docker-compose.prod.yml の healthcheck.test から呼び出される。
urlopen は 200系のみ正常終了し、4xx/5xx は HTTPError、接続不可は ConnectionRefusedError を送出する。
いずれも except で sys.exit(1) として異常終了とする。
"""
import os
import sys
import urllib.request

try:
    port_str = os.environ.get('PORT', '3001')
    port = int(port_str)
    if not (1 <= port <= 65535):
        raise ValueError(f'PORT={port} は 1–65535 の範囲外です')
    urllib.request.urlopen(f'http://localhost:{port}/api/health', timeout=5)
    sys.exit(0)  # urlopen 成功 = 200 系のみ到達（4xx/5xx は HTTPError を送出するためここに来ない）
except Exception:
    sys.exit(1)
