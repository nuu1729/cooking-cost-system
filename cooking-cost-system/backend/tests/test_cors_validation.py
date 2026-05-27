import pytest
from config import validate_cors_origins


def test_wildcard_rejected():
    with pytest.raises(RuntimeError, match='ワイルドカード'):
        validate_cors_origins('*')


def test_invalid_scheme_rejected():
    with pytest.raises(RuntimeError, match='http://'):
        validate_cors_origins('ftp://example.com')


def test_production_requires_https():
    with pytest.raises(RuntimeError, match='https://'):
        validate_cors_origins('http://example.com', require_https=True)


def test_production_blocks_localhost():
    with pytest.raises(RuntimeError, match='ローカルオリジン'):
        validate_cors_origins('http://localhost:3000', allow_local=False)


def test_nonlocal_http_rejected():
    with pytest.raises(RuntimeError, match='https://'):
        validate_cors_origins('http://example.com')


def test_local_http_allowed_in_staging():
    result = validate_cors_origins('http://localhost:3000')
    assert result == 'http://localhost:3000'


def test_valid_https_origins():
    val = 'https://example.pages.dev,https://api.example.com'
    assert validate_cors_origins(val) == val


def test_valid_https_production():
    val = 'https://myapp.pages.dev'
    assert validate_cors_origins(val, require_https=True, allow_local=False) == val


def test_multiple_origins_one_invalid():
    with pytest.raises(RuntimeError):
        validate_cors_origins('https://example.com,http://evil.com')


def test_ipv6_localhost_blocked_in_production():
    with pytest.raises(RuntimeError, match='ローカルオリジン'):
        validate_cors_origins('http://[::1]:3000', allow_local=False)


def test_ipv6_localhost_urlparse():
    """urlparse が [::1] からブラケットなしの ::1 を返すことを確認。"""
    from urllib.parse import urlparse
    assert urlparse('http://[::1]:3000').hostname == '::1'
