import { CorsOptions } from 'cors';
import { logger } from '../utils/logger';

// 許可するオリジンの設定
const getAllowedOrigins = (): string[] => {
    const origins: string[] = [];
    
    // フロントエンドURL
    if (process.env.FRONTEND_URL) {
        origins.push(process.env.FRONTEND_URL);
    }
    
    // 開発環境のデフォルト
    if (process.env.NODE_ENV === 'development') {
        origins.push(
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001'
        );
    }
    
    // 本番環境の設定
    if (process.env.NODE_ENV === 'production') {
        // 本番ドメインを環境変数から取得
        const productionOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
        origins.push(...productionOrigins);
    }
    
    // ステージング環境
    if (process.env.NODE_ENV === 'staging') {
        const stagingOrigins = process.env.STAGING_ORIGINS?.split(',') || [];
        origins.push(...stagingOrigins);
    }
    
    return origins.filter(origin => origin && origin.trim());
};

// CORS設定オプション
export const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = getAllowedOrigins();
        
        // オリジンが未定義の場合（同一ドメインアクセス、モバイルアプリなど）
        if (!origin) {
            return callback(null, true);
        }
        
        // 許可されたオリジンかチェック
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            logger.warn('CORS blocked', {
                type: 'cors_blocked',
                origin,
                allowedOrigins,
                timestamp: new Date().toISOString()
            });
            callback(new Error('Not allowed by CORS policy'));
        }
    },
    
    // 許可するHTTPメソッド
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    
    // 許可するヘッダー
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'X-CSRF-Token'
    ],
    
    // レスポンスで公開するヘッダー
    exposedHeaders: [
        'X-Total-Count',
        'X-Total-Pages',
        'X-Current-Page',
        'X-Per-Page'
    ],
    
    // クッキーを含むリクエストを許可
    credentials: true,
    
    // プリフライトリクエストのキャッシュ時間（秒）
    maxAge: process.env.NODE_ENV === 'production' ? 86400 : 3600, // 本番: 24時間, 開発: 1時間
    
    // プリフライトの続行設定
    preflightContinue: false,
    
    // ステータスコード設定
    optionsSuccessStatus: 204
};

// 開発環境用の緩い設定
export const devCorsOptions: CorsOptions = {
    origin: true, // 全てのオリジンを許可
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: '*',
    credentials: true,
    maxAge: 3600
};

// 本番環境用の厳密な設定
export const prodCorsOptions: CorsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = getAllowedOrigins();
        
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            logger.error('CORS violation attempt', {
                type: 'cors_violation',
                origin,
                allowedOrigins,
                timestamp: new Date().toISOString()
            });
            callback(new Error('Not allowed by CORS policy'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization'
    ],
    credentials: true,
    maxAge: 86400
};

// 環境に応じた設定の選択
const getEnvironmentCorsOptions = (): CorsOptions => {
    switch (process.env.NODE_ENV) {
        case 'development':
            return devCorsOptions;
        case 'production':
            return prodCorsOptions;
        default:
            return corsOptions;
    }
};

// CORSログミドルウェア
export const corsLogger = (req: any, res: any, next: any) => {
    const origin = req.get('Origin');
    const method = req.method;
    
    if (method === 'OPTIONS') {
        logger.debug('CORS Preflight Request', {
            type: 'cors_preflight',
            origin,
            method: req.get('Access-Control-Request-Method'),
            headers: req.get('Access-Control-Request-Headers'),
            timestamp: new Date().toISOString()
        });
    }
    
    next();
};

// セキュリティヘッダー設定
export const securityHeaders = (req: any, res: any, next: any) => {
    // CORS関連のセキュリティヘッダー
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    
    // その他のセキュリティヘッダー
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    next();
};

// 初期化ログ
logger.info('CORS configuration loaded', {
    type: 'cors_config',
    environment: process.env.NODE_ENV,
    allowedOrigins: getAllowedOrigins(),
    timestamp: new Date().toISOString()
});

// デフォルトエクスポート
export default getEnvironmentCorsOptions();