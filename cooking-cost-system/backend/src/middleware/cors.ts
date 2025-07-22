import { CorsOptions } from 'cors';
import { logger } from '../utils/logger';

// 許可されたオリジンのリスト
const getAllowedOrigins = (): string[] => {
    const origins = process.env.CORS_ORIGIN || 'http://localhost:3000';
    
    if (process.env.NODE_ENV === 'development') {
        return [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        ...origins.split(',').map(origin => origin.trim()),
        ];
    }
    
    return origins.split(',').map(origin => origin.trim());
};

// CORS設定
export const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = getAllowedOrigins();
        
        // 開発環境ではoriginがundefinedの場合も許可（Postmanなど）
        if (process.env.NODE_ENV === 'development' && !origin) {
        return callback(null, true);
        }
        
        // オリジンが許可リストに含まれているかチェック
        if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        } else {
        logger.warn(`CORS rejected origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
        }
    },
    
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'X-Forwarded-For',
        'X-Real-IP',
        'User-Agent',
        'If-Modified-Since',
        'X-CSRF-Token',
        'X-API-Key',
    ],
    
    exposedHeaders: [
        'X-Total-Count',
        'X-Page-Count',
        'X-Current-Page',
        'X-Per-Page',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'Content-Range',
        'Accept-Ranges',
    ],
    
    credentials: process.env.CORS_CREDENTIALS === 'true',
    
    maxAge: 86400, // 24時間
    
    preflightContinue: false,
    
    optionsSuccessStatus: 200,
};

// 動的CORS設定（必要に応じて）
export const dynamicCorsOptions = (req: any, callback: any) => {
    let corsOptions: CorsOptions = { ...corsOptions };
    
    // 特定のルートに対する個別設定
    if (req.path.startsWith('/api/upload')) {
        corsOptions.maxAge = 3600; // アップロード用は1時間
    }
    
    if (req.path.startsWith('/api/auth')) {
        corsOptions.credentials = true; // 認証関連は常にクレデンシャル許可
    }
    
    callback(null, corsOptions);
};

// セキュリティ強化されたCORS設定（本番環境用）
export const strictCorsOptions: CorsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = getAllowedOrigins();
        
        // 本番環境では厳密にオリジンをチェック
        if (origin && allowedOrigins.includes(origin)) {
        callback(null, true);
        } else {
        logger.error(`CORS rejected origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
        }
    },
    
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
    ],
    
    credentials: true,
    
    maxAge: 300, // 5分
    
    preflightContinue: false,
    
    optionsSuccessStatus: 204,
};

// 開発環境用の緩いCORS設定
export const devCorsOptions: CorsOptions = {
    origin: true, // 全てのオリジンを許可
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: '*',
    exposedHeaders: '*',
    maxAge: 86400,
};

// 環境に応じたCORS設定を選択
export const getCorsOptions = (): CorsOptions => {
    if (process.env.NODE_ENV === 'production') {
        return strictCorsOptions;
    } else if (process.env.NODE_ENV === 'development') {
        return process.env.ENABLE_STRICT_CORS === 'true' ? corsOptions : devCorsOptions;
    } else {
        return corsOptions;
    }
};

// ログ付きCORSハンドラー
export const corsWithLogging = (req: any, res: any, next: any) => {
    const origin = req.get('Origin');
    const method = req.method;
    
    logger.debug('CORS request:', {
        origin,
        method,
        path: req.path,
        headers: req.headers,
    });
    
    next();
};

export default corsOptions;