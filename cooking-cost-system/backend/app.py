import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from api.database import db
from api.error import register_error_handlers
from datetime import datetime, timezone


def create_app():
    app = Flask(__name__)

    CORS(app, resources={r'/api/*': {'origins': '*'}, r'/uploads/*': {'origins': '*'}})

    env = os.environ.get('FLASK_ENV', 'development')
    if env == 'production':
        app.config.from_object('config_production.ProductionConfig')
    elif env == 'staging':
        app.config.from_object('config_staging.StagingConfig')
    else:
        app.config.from_object('config.DevelopmentConfig')

    db.init_app(app)
    register_error_handlers(app)

    # Import models so SQLAlchemy registers them before create_all
    with app.app_context():
        from api.models import User, Memo, Item, ItemRelation  # noqa: F401

    from api.controllers import register_blueprints
    register_blueprints(app)

    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify(status='healthy', message='Backend is running!')

    @app.route('/health/detailed', methods=['GET'])
    def health_detailed():
        db_ok = True
        db_ms = None
        try:
            start = datetime.now(timezone.utc)
            db.session.execute(db.text('SELECT 1'))
            db_ms = round((datetime.now(timezone.utc) - start).total_seconds() * 1000, 1)
        except Exception:
            db_ok = False

        overall = 'healthy' if db_ok else 'unhealthy'
        return jsonify(
            status=overall,
            timestamp=datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            components={
                'database': {'status': 'ok' if db_ok else 'error', 'response_time_ms': db_ms}
            }
        ), 200 if db_ok else 503

    @app.route('/uploads/<path:filename>', methods=['GET'])
    def serve_upload(filename):
        upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
        return send_from_directory(upload_dir, filename)

    @app.route('/', methods=['GET'])
    def index():
        return 'Cooking Cost System Backend API'

    return app


if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=port, debug=True)
