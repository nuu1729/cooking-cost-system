import { AppConfig } from '../types';
import { logger } from '../utils/logger';

// ================================
// 環境変数の検証とデフォルト値設定
// ================================

const requiredEnvVars = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
];

const validateEnvironment = () => {
    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
};

// 開発環境以外では環境変数の検証を実行
if (process.env.NODE_ENV !== 'development') {
    validateEnvironment();
}

// ================================
// アプリケーション設定
// ================================

export const config: AppConfig = {
    // 基本設定
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    
    // データベース設定
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        database: process.env.DB_NAME || 'cooking_cost_system',
        username: process.env.DB_USER || 'cooking_user',
        password: process.env.DB_PASSWORD || 'cooking_password',
        ssl: process.env.NODE_ENV === 'production',
    },
    
    // JWT設定
    jwt: {
        secret: process.env.JWT_SECRET || 'default-jwt-secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
    
    // ファイルアップロード設定
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
        allowedTypes: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv',
            'application/json',
        ],
        uploadDir: process.env.UPLOAD_DIR || './uploads',
    },
    
    // ログ設定
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        maxFiles: process.env.LOG_MAX_FILES || '30d',
        maxSize: process.env.LOG_MAX_SIZE || '20m',
    },
    
    // CORS設定
    cors: {
        origins: process.env.CORS_ORIGINS?.split(',') || [
            'http://localhost:3000',
            'http://localhost:3001',
        ],
        credentials: true,
    },
    
    // レート制限設定
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15分
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 最大100リクエスト
    },
};

// ================================
// 環境別設定
// ================================

export const isDevelopment = config.env === 'development';
export const isProduction = config.env === 'production';
export const isTest = config.env === 'test';

// 開発環境専用の設定
if (isDevelopment) {
    // デバッグ情報の出力
    logger.info('Development environment detected', {
        config: {
            env: config.env,
            port: config.port,
            database: {
                host: config.database.host,
                database: config.database.database,
            },
            logging: config.logging,
        },
    });
    
    // 開発環境では緩いCORS設定
    config.cors.origins.push('*');
}

// 本番環境専用の設定
if (isProduction) {
    // 本番環境では厳格な設定を適用
    config.logging.level = 'warn';
    config.rateLimit.max = 50; // より厳しいレート制限
    
    // セキュリティ強化
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'default-jwt-secret') {
        throw new Error('JWT_SECRET must be set in production environment');
    }
    
    logger.info('Production environment detected', {
        security: 'enhanced',
        rateLimit: config.rateLimit.max,
    });
}

// テスト環境専用の設定
if (isTest) {
    config.logging.level = 'error';
    config.database.database = config.database.database + '_test';
    config.upload.uploadDir = './test-uploads';
}

// ================================
// 設定の妥当性チェック
// ================================

export const validateConfig = (): void => {
    // ポート番号の妥当性チェック
    if (config.port < 1 || config.port > 65535) {
        throw new Error(`Invalid port number: ${config.port}`);
    }
    
    // データベースポートの妥当性チェック
    if (config.database.port < 1 || config.database.port > 65535) {
        throw new Error(`Invalid database port: ${config.database.port}`);
    }
    
    // ファイルサイズの妥当性チェック
    if (config.upload.maxFileSize < 1024 || config.upload.maxFileSize > 100 * 1024 * 1024) {
        throw new Error(`Invalid max file size: ${config.upload.maxFileSize}`);
    }
    
    // レート制限の妥当性チェック
    if (config.rateLimit.windowMs < 1000 || config.rateLimit.max < 1) {
        throw new Error('Invalid rate limit configuration');
    }
};

// 設定の妥当性をチェック
try {
    validateConfig();
    logger.info('Configuration validated successfully');
} catch (error) {
    logger.error('Configuration validation failed:', error);
    process.exit(1);
}

// ================================
// 設定のエクスポート
// ================================

export default config;

// ================================
// src/config/database.ts - データベース専用設定
// ================================

export const databaseConfig = {
    // 接続設定
    connection: {
        host: config.database.host,
        port: config.database.port,
        user: config.database.username,
        password: config.database.password,
        database: config.database.database,
        charset: 'utf8mb4',
        timezone: '+09:00',
    },
    
    // プール設定
    pool: {
        min: parseInt(process.env.DB_POOL_MIN || '2', 10),
        max: parseInt(process.env.DB_POOL_MAX || '10', 10),
        acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000', 10),
        createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT || '30000', 10),
        destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT || '5000', 10),
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
        reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL || '1000', 10),
        createRetryIntervalMillis: parseInt(process.env.DB_CREATE_RETRY_INTERVAL || '200', 10),
    },
    
    // マイグレーション設定
    migration: {
        directory: './database/migrations',
        tableName: 'knex_migrations',
    },
    
    // シード設定
    seeds: {
        directory: './database/seeds',
    },
    
    // デバッグ設定
    debug: isDevelopment,
    
    // SSL設定
    ssl: isProduction ? {
        rejectUnauthorized: false,
    } : false,
};

// ================================
// src/config/redis.ts - Redis設定（将来用）
// ================================

export const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    
    // 接続設定
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
    commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000', 10),
    retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10),
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
    
    // セッション設定
    session: {
        secret: process.env.SESSION_SECRET || config.jwt.secret,
        ttl: parseInt(process.env.SESSION_TTL || '86400', 10), // 24時間
        prefix: 'cooking_cost:session:',
    },
    
    // キャッシュ設定
    cache: {
        ttl: parseInt(process.env.CACHE_TTL || '3600', 10), // 1時間
        prefix: 'cooking_cost:cache:',
    },
};

// ================================
// src/config/swagger.ts - API ドキュメント設定
// ================================

export const swaggerConfig = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: '料理原価計算システム API',
            version: '2.0.0',
            description: 'モダンな料理原価計算システムのRESTful API',
            contact: {
                name: 'API Support',
                email: 'support@cooking-system.local',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: `http://localhost:${config.port}`,
                description: '開発サーバー',
            },
            {
                url: 'https://api.cooking-system.com',
                description: '本番サーバー',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

// ================================
// 設定の一括エクスポート
// ================================

export {
    config as default,
    databaseConfig,
    redisConfig,
    swaggerConfig,
    validateConfig,
    isDevelopment,
    isProduction,
    isTest,
};
