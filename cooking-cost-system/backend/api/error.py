from flask import jsonify
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


def _now():
    return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')


def register_error_handlers(app):
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify(success=False, error='BAD_REQUEST', message='リクエストが不正です', timestamp=_now()), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify(success=False, error='NOT_FOUND', message='リソースが見つかりません', timestamp=_now()), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify(success=False, error='METHOD_NOT_ALLOWED', message='許可されていないメソッドです', timestamp=_now()), 405

    @app.errorhandler(500)
    def internal_error(e):
        logger.error('Internal server error: %s', e, exc_info=True)
        return jsonify(success=False, error='INTERNAL_ERROR', message='サーバーエラーが発生しました', timestamp=_now()), 500

    @app.errorhandler(Exception)
    def handle_exception(e):
        logger.error('Unhandled exception: %s', e, exc_info=True)
        return jsonify(success=False, error='INTERNAL_ERROR', message='サーバーエラーが発生しました', timestamp=_now()), 500
