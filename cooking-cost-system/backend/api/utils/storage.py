"""Cloudflare R2（S3互換）へのアップロードファイル保存。

Cloudflare Containers はローカルディスクを永続化しないため、
ユーザーアイコン・背景画像は R2 に保存する。boto3 の S3 互換クライアントで
アクセスする（D1 と同様、コンテナは Worker ではないためネイティブバインディングは使えない）。
"""
import os
import boto3
from botocore.config import Config as BotoConfig

_client = None
_bucket = None


def _require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"環境変数 '{name}' が設定されていません（R2 アップロード機能に必要）")
    return value


def _get_client():
    global _client, _bucket
    if _client is None:
        account_id = _require_env('CF_ACCOUNT_ID')
        _client = boto3.client(
            's3',
            endpoint_url=f'https://{account_id}.r2.cloudflarestorage.com',
            aws_access_key_id=_require_env('R2_ACCESS_KEY_ID'),
            aws_secret_access_key=_require_env('R2_SECRET_ACCESS_KEY'),
            config=BotoConfig(signature_version='s3v4'),
            region_name='auto',
        )
        _bucket = _require_env('R2_BUCKET_NAME')
    return _client, _bucket


def upload_file(file_obj, key: str, content_type: str) -> None:
    client, bucket = _get_client()
    file_obj.seek(0)
    client.upload_fileobj(file_obj, bucket, key, ExtraArgs={'ContentType': content_type})


def delete_file(key: str) -> None:
    client, bucket = _get_client()
    client.delete_object(Bucket=bucket, Key=key)


def get_file(key: str):
    """R2 からオブジェクトを取得する。存在しない場合は botocore.exceptions.ClientError を送出する。"""
    client, bucket = _get_client()
    return client.get_object(Bucket=bucket, Key=key)
