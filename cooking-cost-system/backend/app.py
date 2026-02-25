import os
from flask import Flask
from flask_cors import CORS
from api.database import db
from api.error import register_error_handlers

def create_app():
    app = Flask(__name__)
    
    # Enable CORS
    CORS(app)

    # Load configuration
    env = os.environ.get('FLASK_ENV', 'development')
    if env == 'production':
        app.config.from_object('config_production.ProductionConfig')
    elif env == 'staging':
        app.config.from_object('config_staging.StagingConfig')
    else:
        app.config.from_object('config.DevelopmentConfig')

    # Initialize extensions
    db.init_app(app)
    
    # Register error handlers
    register_error_handlers(app)

    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return {"status": "healthy", "message": "Backend is running!"}
    
    @app.route('/', methods=['GET'])
    def index():
        return "Cooking Cost System Backend API"

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
