import winston from 'winston';
import path from 'path';

// ログレベルの設定
const logLevel = process.env.LOG_LEVEL || 'info';
const nodeEnv = process.env.NODE_ENV || 'development';

// カスタムログフォーマット
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        if (Object.keys(meta).length > 0) {
            log += `\n${JSON.stringify(meta, null, 2)}`;
        }
        
        if (stack) {
            log += `\n${stack}`;
        }
        
        return log;
    })
);

// コンソール用フォーマット（開発環境）
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} ${level}: ${message}`;
        
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }
        
        if (stack) {
            log += `\n${stack}`;
        }
        
        return log;
    })
);

// トランスポートの設定
const transports: winston.transport[] = [];

// コンソール出力（開発環境）
if (nodeEnv === 'development') {
    transports.push(
        new winston.transports.Console({
            level: logLevel,
            format: consoleFormat,
            handleExceptions: true,
            handleRejections: true
        })
    );
}

// ファイル出力（本番環境）
if (nodeEnv === 'production') {
    // ログディレクトリの確保
    const logDir = path.join(process.cwd(), 'logs');
    
    // エラーログ
    transports.push(
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            format: logFormat,
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            handleExceptions: true,
            handleRejections: true
        })
    );
    
    // 結合ログ
    transports.push(
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            format: logFormat,
            maxsize: 10485760, // 10MB
            maxFiles: 10
        })
    );
    
    // アクセスログ
    transports.push(
        new winston.transports.File({
            filename: path.join(logDir, 'access.log'),
            level: 'info',
            format: logFormat,
            maxsize: 10485760, // 10MB
            maxFiles: 10
        })
    );
}

// Winstonロガーの作成
const logger = winston.createLogger({
    level: logLevel,
    format: logFormat,
    transports,
    exitOnError: false
});

// 本番環境でもコンソールに重要なログを出力
if (nodeEnv === 'production') {
    logger.add(
        new winston.transports.Console({
            level: 'warn',
            format: consoleFormat
        })
    );
}

// ログレベル別のヘルパー関数
export const logHelpers = {
    /**
     * APIリクエストログ
     */
    apiRequest: (method: string, url: string, ip: string, userAgent?: string) => {
        logger.info('API Request', {
            type: 'api_request',
            method,
            url,
            ip,
            userAgent,
            timestamp: new Date().toISOString()
        });
    },

    /**
     * APIレスポンスログ
     */
    apiResponse: (method: string, url: string, statusCode: number, responseTime: number) => {
        const level = statusCode >= 400 ? 'warn' : 'info';
        logger.log(level, 'API Response', {
            type: 'api_response',
            method,
            url,
            statusCode,
            responseTime,
            timestamp: new Date().toISOString()
        });
    },

    /**
     * データベースクエリログ
     */
    dbQuery: (sql: string, params?: any[], duration?: number) => {
        if (nodeEnv === 'development') {
            logger.debug('Database Query', {
                type: 'db_query',
                sql: sql.replace(/\s+/g, ' ').trim(),
                params,
                duration,
                timestamp: new Date().toISOString()
            });
        }
    },

    /**
     * セキュリティログ
     */
    security: (event: string, details: any, ip?: string) => {
        logger.warn('Security Event', {
            type: 'security',
            event,
            details,
            ip,
            timestamp: new Date().toISOString()
        });
    },

    /**
     * パフォーマンスログ
     */
    performance: (operation: string, duration: number, details?: any) => {
        const level = duration > 1000 ? 'warn' : 'info';
        logger.log(level, 'Performance', {
            type: 'performance',
            operation,
            duration,
            details,
            timestamp: new Date().toISOString()
        });
    },

    /**
     * ビジネスロジックログ
     */
    business: (action: string, details: any) => {
        logger.info('Business Logic', {
            type: 'business',
            action,
            details,
            timestamp: new Date().toISOString()
        });
    },

    /**
     * システムログ
     */
    system: (event: string, details?: any) => {
        logger.info('System Event', {
            type: 'system',
            event,
            details,
            timestamp: new Date().toISOString()
        });
    }
};

// Express用ミドルウェア
export const expressLogger = {
    /**
     * リクエストログミドルウェア
     */
    request: (req: any, res: any, next: any) => {
        const startTime = Date.now();
        
        logHelpers.apiRequest(
            req.method,
            req.originalUrl,
            req.ip,
            req.get('User-Agent')
        );

        // レスポンス終了時にログ
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            logHelpers.apiResponse(req.method, req.originalUrl, res.statusCode, duration);
        });

        next();
    },

    /**
     * エラーログミドルウェア
     */
    error: (err: any, req: any, res: any, next: any) => {
        logger.error('Express Error', {
            type: 'express_error',
            error: err.message,
            stack: err.stack,
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        });
        next(err);
    }
};

// デバッグ情報の出力
if (nodeEnv === 'development') {
    logger.info('Logger initialized', {
        level: logLevel,
        environment: nodeEnv,
        transports: transports.map(t => t.constructor.name)
    });
}

export { logger };
export default logger;