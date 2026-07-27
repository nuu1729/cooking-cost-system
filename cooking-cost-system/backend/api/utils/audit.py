import logging
from flask import request

audit_logger = logging.getLogger('audit')


def _ip() -> str:
    return request.headers.get('X-Forwarded-For', request.remote_addr) or '-'


def log_login_success(user_id: int, username: str):
    audit_logger.info('LOGIN_SUCCESS user_id=%s username=%s ip=%s', user_id, username, _ip())


def log_login_failure(identifier: str):
    audit_logger.warning('LOGIN_FAILURE identifier=%s ip=%s', identifier, _ip())


def log_logout(user_id: int):
    audit_logger.info('LOGOUT user_id=%s ip=%s', user_id, _ip())


def log_delete(user_id: int, resource: str, resource_id: int):
    audit_logger.info('DELETE resource=%s id=%s user_id=%s ip=%s', resource, resource_id, user_id, _ip())


def log_register(user_id: int, username: str):
    audit_logger.info('REGISTER user_id=%s username=%s ip=%s', user_id, username, _ip())


def log_login_unverified(user_id: int, username: str):
    audit_logger.warning('LOGIN_BLOCKED_UNVERIFIED user_id=%s username=%s ip=%s', user_id, username, _ip())


def log_email_verified(user_id: int, username: str):
    audit_logger.info('EMAIL_VERIFIED user_id=%s username=%s ip=%s', user_id, username, _ip())


def log_email_changed(user_id: int, username: str):
    audit_logger.info('EMAIL_CHANGED user_id=%s username=%s ip=%s', user_id, username, _ip())
