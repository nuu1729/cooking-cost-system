from api.controllers.auth import auth_bp
from api.controllers.ingredients import ingredients_bp
from api.controllers.preps import preps_bp
from api.controllers.foods import foods_bp
from api.controllers.reports import reports_bp
from api.controllers.memo import memo_bp
from api.controllers.stores import stores_bp


def register_blueprints(app):
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(ingredients_bp, url_prefix='/api/ingredients')
    app.register_blueprint(preps_bp, url_prefix='/api/preps')
    app.register_blueprint(foods_bp, url_prefix='/api/foods')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(memo_bp, url_prefix='/api/memo')
    app.register_blueprint(stores_bp, url_prefix='/api/stores')
