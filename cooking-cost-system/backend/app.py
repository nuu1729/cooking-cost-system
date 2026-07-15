import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, jsonify, Response
from flask_cors import CORS
from flask_talisman import Talisman
from werkzeug.middleware.proxy_fix import ProxyFix
from botocore.exceptions import ClientError
from api.database import db
from api.extensions import limiter
from api.error import register_error_handlers
from api.utils import storage
from datetime import datetime, timezone

# 有効な APP_ENV 値の順序付きタプル（表示順を固定）。frozenset はここから派生させる。
_VALID_APP_ENVS_ORDERED = ('development', 'test', 'staging', 'production')
_VALID_APP_ENVS = frozenset(_VALID_APP_ENVS_ORDERED)


def _configure_logging(log_dir: str):
    os.makedirs(log_dir, exist_ok=True)
    fmt = logging.Formatter('%(asctime)s %(levelname)s %(name)s %(message)s')

    audit_handler = RotatingFileHandler(
        os.path.join(log_dir, 'audit.log'),
        maxBytes=10 * 1024 * 1024,
        backupCount=30,
        encoding='utf-8',
    )
    audit_handler.setFormatter(fmt)

    audit_logger = logging.getLogger('audit')
    audit_logger.setLevel(logging.INFO)
    audit_logger.addHandler(audit_handler)
    audit_logger.addHandler(logging.StreamHandler())
    audit_logger.propagate = False


def create_app():
    app = Flask(__name__)
    log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
    _configure_logging(log_dir)

    env = os.environ.get('APP_ENV', 'development')
    if env not in _VALID_APP_ENVS:
        valid_str = ' / '.join(_VALID_APP_ENVS_ORDERED)
        raise RuntimeError(
            f'APP_ENV に無効な値が設定されています: {env!r}。'
            f'有効値: {valid_str}'
        )
    if env == 'production':
        app.config.from_object('config_production.ProductionConfig')
    elif env == 'staging':
        app.config.from_object('config_staging.StagingConfig')
    else:
        # development および test は DevelopmentConfig を使用
        # test は CI/ローカルテスト用途のみ想定し、専用 Config クラスは持たない
        app.config.from_object('config.DevelopmentConfig')

    # DevelopmentConfig.SQLALCHEMY_DATABASE_URI はクラス定義時に例外を出さないよう
    # os.environ.get() に留めているため（staging/production import 時の巻き添え回避）、
    # 実際に development/test 環境として起動する場合のみここで存在チェックする。
    if not app.config.get('SQLALCHEMY_DATABASE_URI'):
        raise RuntimeError(
            "環境変数 'DATABASE_URL' が設定されていません。"
            ".env.example を参考に .env を作成してください。"
        )

    is_production = (env == 'production')

    # ProxyFix: 本番環境のみ適用（開発時はプロキシがなく X-Forwarded-* を偽装されるリスクがある）
    # x_for=1: Caddy 1段のみ信頼。VPS 構成が変わった場合はここを更新すること。
    # x_prefix=0: Caddy が X-Forwarded-Prefix を送出しない構成のため無効（安全側デフォルト）
    #             サブパスへのデプロイが必要になった場合は x_prefix=1 に変更すること。
    if is_production:
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=0)

    cors_origins = [o.strip() for o in app.config['CORS_ORIGIN'].split(',') if o.strip()]
    if not cors_origins:
        raise ValueError('CORS_ORIGIN must contain at least one valid origin')
    logging.getLogger(__name__).info('CORS origins: %s', cors_origins)
    CORS(app, resources={r'/api/*': {'origins': cors_origins}, r'/uploads/*': {'origins': cors_origins}})

    Talisman(
        app,
        # force_https=False: HTTPS 終端は Caddy が担う（Caddy → Flask 間は内部 HTTP）
        # Flask-Talisman の HSTS ヘッダーは Caddy を経由してクライアントまで届く
        # ⚠️ Caddy バイパス時（Flask に直接 HTTP 接続）でも HSTS ヘッダーが付与される点に注意
        #    HSTS を Caddy 側のみで管理する場合は strict_transport_security=False に変更すること（Phase2 で判断）
        force_https=False,
        # 本番では HSTS を有効化（max-age=1年）
        # preload は HSTS preload list への登録が必要なため現時点では無効
        strict_transport_security=is_production,
        # Flask-Talisman のバージョンによって is_production=False 時の挙動が異なる可能性があるため明示的に分岐
        strict_transport_security_max_age=31536000 if is_production else 0,
        # includeSubDomains はデフォルト False（同ドメインのサブドメインに HTTP のみのサービスがある場合にブロックされるリスクを避ける）
        # VPS 上の全サービスが HTTPS 対応済みであることを確認した上で True に変更すること
        strict_transport_security_include_subdomains=False,
        content_security_policy=False,  # SPA のため CSP は Cloudflare Pages 側で管理
        frame_options='DENY',
        x_content_type_options=True,
        referrer_policy='strict-origin-when-cross-origin',
    )

    # 本番では REDIS_URL があれば Redis、なければメモリストレージを使用
    redis_url = os.environ.get('REDIS_URL')
    app.config['RATELIMIT_STORAGE_URI'] = redis_url if redis_url else 'memory://'

    limiter.init_app(app)
    db.init_app(app)
    register_error_handlers(app)

    # スキーマは wrangler d1 migrations で管理する（db.create_all() は使用しない）
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
        # Cloudflare Containers はローカルディスクを永続化しないため、
        # アップロード画像は R2 に保存されている（api/utils/storage.py）。
        # ここでは R2 からストリーム取得してそのままプロキシ配信する。
        try:
            obj = storage.get_file(filename)
        except ClientError as e:
            code = e.response.get('Error', {}).get('Code')
            if code in ('NoSuchKey', '404'):
                return jsonify(error='NOT_FOUND', message='ファイルが見つかりません'), 404
            raise
        return Response(
            obj['Body'].read(),
            mimetype=obj.get('ContentType', 'application/octet-stream'),
        )

    @app.route('/', methods=['GET'])
    def index():
        return 'Cooking Cost System Backend API'

    return app


if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=port, debug=app.config.get('DEBUG', False))
