import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// ログレベルの色設定
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
    timestamp: 'gray',
};

winston.addColors(colors);

// カスタムフォーマット
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
);

// コンソール用フォーマット
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.align(),
    winston.format.printf((info) => {
        const { timestamp, level, message, ...args } = info;
        const ts = `[${timestamp}]`;
        return `${ts} ${level}: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''
            }`;
    })
);

// ログファイルの保存先
const logDir = path.join(process.cwd(), 'logs');

// ログ設定
const loggerConfig: winston.LoggerOptions = {
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'cooking-cost-api' },
    transports: [
        // コンソール出力
        new winston.transports.Console({
            format: consoleFormat,
            level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
        }),

        // エラーログファイル
        new DailyRotateFile({
            filename: path.join(logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true,
        }),

        // 全てのログファイル
        new DailyRotateFile({
            filename: path.join(logDir, 'app-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d',
            zippedArchive: true,
        }),

        // アクセスログファイル
        new DailyRotateFile({
            filename: path.join(logDir, 'access-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'http',
            maxSize: '20m',
            maxFiles: '30d',
            zippedArchive: true,
        }),
    ],

    // 本番環境でない場合は例外も記録
    exceptionHandlers: process.env.NODE_ENV !== 'production' ? [
        new winston.transports.File({
            filename: path.join(logDir, 'exceptions.log')
        })
    ] : [],

    rejectionHandlers: process.env.NODE_ENV !== 'production' ? [
        new winston.transports.File({
            filename: path.join(logDir, 'rejections.log')
        })
    ] : [],
};

// ロガー作成
export const logger = winston.createLogger(loggerConfig);

// HTTPリクエストログ用ミドルウェア
export const requestLogger = (req: any, res: any, next: any) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            contentLength: res.get('Content-Length'),
        };

        if (res.statusCode >= 400) {
            logger.warn('HTTP Request', logData);
        } else {
            logger.http('HTTP Request', logData);
        }
    });

    next();
};

// デバッグ用ヘルパー
export const debugLogger = {
    query: (query: string, params?: any) => {
        logger.debug('Database Query:', { query, params });
    },
    api: (endpoint: string, data?: any) => {
        logger.debug('API Call:', { endpoint, data });
    },
    performance: (operation: string, duration: number) => {
        logger.debug('Performance:', { operation, duration: `${duration}ms` });
    },
};

// 本番環境では機密情報をログに出力しない
export const sanitizeLogData = (data: any): any => {
    if (process.env.NODE_ENV === 'production') {
        const sensitive = ['password', 'token', 'secret', 'key'];
        const sanitized = { ...data };

        Object.keys(sanitized).forEach(key => {
            if (sensitive.some(s => key.toLowerCase().includes(s))) {
                sanitized[key] = '***';
            }
        });

        return sanitized;
    }
    return data;
};

export default logger;