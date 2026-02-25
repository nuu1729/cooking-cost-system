from flask import jsonify

def register_error_handlers(app):
    @app.errorhandler(404)
    def resource_not_found(e):
        return jsonify(error=str(e), type='NotFound'), 404

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify(error=str(e), type='BadRequest'), 400

    @app.errorhandler(500)
    def internal_server_error(e):
        return jsonify(error="Internal Server Error"), 500
