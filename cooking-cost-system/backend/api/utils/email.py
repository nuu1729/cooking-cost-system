import logging
from datetime import datetime, timedelta, timezone
import jwt
import resend

logger = logging.getLogger(__name__)

EMAIL_VERIFY_PURPOSE = 'verify_email'
EMAIL_VERIFY_EXPIRES_HOURS = 24


def generate_verification_token(user_id: int, secret: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(hours=EMAIL_VERIFY_EXPIRES_HOURS)
    return jwt.encode(
        {'sub': str(user_id), 'purpose': EMAIL_VERIFY_PURPOSE, 'exp': expires_at},
        secret,
        algorithm='HS256'
    )


def decode_verification_token(token: str, secret: str) -> int:
    """トークンをデコードし user_id を返す。期限切れ・改ざん・目的不一致の場合は
    jwt.InvalidTokenError（の派生）を送出する。呼び出し側でハンドリングすること。"""
    payload = jwt.decode(token, secret, algorithms=['HS256'])
    if payload.get('purpose') != EMAIL_VERIFY_PURPOSE:
        raise jwt.InvalidTokenError('unexpected token purpose')
    return int(payload['sub'])


def send_verification_email(
    *,
    to_email: str,
    username: str,
    token: str,
    api_key: str,
    from_email: str,
    frontend_url: str,
) -> None:
    """確認メールを Resend 経由で送信する。

    RESEND_API_KEY が未設定の場合（ローカル開発等）は送信せず、確認リンクを
    ログに出力するだけに留める。送信失敗時も例外は送出せずログのみに残す
    （サインアップ自体は失敗させない。ユーザーは resend-verification で再送できる）。
    """
    verify_url = f"{frontend_url.rstrip('/')}/verify-email?token={token}"

    if not api_key:
        logger.warning(
            'RESEND_API_KEY が未設定のため確認メールを送信しません。確認リンク: user=%s url=%s',
            username, verify_url,
        )
        return

    try:
        resend.api_key = api_key
        resend.Emails.send({
            'from': from_email,
            'to': [to_email],
            'subject': '【料理原価計算システム】メールアドレスの確認',
            'html': (
                f'<p>{username} 様</p>'
                '<p>ご登録ありがとうございます。以下のリンクをクリックして、'
                'メールアドレスの確認を完了してください。</p>'
                f'<p><a href="{verify_url}">{verify_url}</a></p>'
                f'<p>このリンクの有効期限は {EMAIL_VERIFY_EXPIRES_HOURS} 時間です。</p>'
                '<p>このメールに心当たりがない場合は、本メールを無視してください。</p>'
            ),
        })
    except Exception:
        logger.exception('確認メールの送信に失敗しました: user=%s', username)
