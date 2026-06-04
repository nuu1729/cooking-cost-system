"""Gunicorn コンテナ用ヘルスチェックスクリプト。

docker-compose.prod.yml の healthcheck.test から呼び出される。
urlopen は 4xx/5xx 時に HTTPError を送出する場合と、レスポンスを返す場合がある。
どちらのケースも明示的にハンドリングして sys.exit(0/1) を保証する。
"""
import os
import sys
import urllib.error
import urllib.request

try:
    port_str = os.environ.get('PORT', '3001')
    port = int(port_str)
    if not (1 <= port <= 65535):
        raise ValueError(f'PORT={port} は 1–65535 の範囲外です')
    with urllib.request.urlopen(f'http://localhost:{port}/api/health', timeout=5) as res:
        sys.exit(0 if res.status == 200 else 1)
except urllib.error.HTTPError:
    # 4xx/5xx: HTTP エラーを明示的にキャッチして異常終了
    sys.exit(1)
except Exception:
    # 接続拒否・タイムアウト等
    sys.exit(1)
