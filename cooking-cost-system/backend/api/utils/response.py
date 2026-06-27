from flask import jsonify
from datetime import datetime, timezone


def _now():
    return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')


def success(data=None, message=None, count=None, status=200):
    body = {'success': True, 'timestamp': _now()}
    if data is not None:
        body['data'] = data
    if message is not None:
        body['message'] = message
    if count is not None:
        body['count'] = count
    return jsonify(body), status


def error(code, message, status=400):
    return jsonify({
        'success': False,
        'error': code,
        'message': message,
        'timestamp': _now(),
    }), status
