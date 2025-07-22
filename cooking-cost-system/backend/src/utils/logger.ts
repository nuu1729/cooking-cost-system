import winston from 'winston';
import path from 'path';
import fs from 'fs';

// ログディレクトリ作成
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// ログレベル定義
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// ログレベル設定
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
};

// ログ色設定
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

// ログフォーマット
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

// ファイル用フォーマット（色なし）
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
);

// トランスポート設定
const transports = [
    // コンソール出力
    new winston.transports.Console({
        format,
        level: level(),
    }),
    
    // エラーログファイル
    new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
    
    // 全ログファイル
    new winston.transports.File({
        filename: path.join(logDir, 'app.log'),
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
];

// 開発環境でのデバッグログファイル
if (process.env.NODE_ENV === 'development') {
    transports.push(
        new winston.transports.File({
            filename: path.join(logDir, 'debug.log'),
            level: 'debug',
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 3,
        })
    );
}

// ロガー作成
export const logger = winston.createLogger({
    level: level(),
    levels,
    format: fileFormat,
    transports,
    exitOnError: false,
});

// HTTP リクエストログ用のストリーム
export const loggerStream = {
    write: (message: string) => {
        logger.http(message.trim());
    },
};

// カスタムログメソッド
export const logInfo = (message: string, meta?: any) => {
    logger.info(message, meta);
};

export const logError = (message: string, error?: any) => {
    logger.error(message, { error: error?.stack || error });
};

export const logWarn = (message: string, meta?: any) => {
    logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
    logger.debug(message, meta);
};

// リクエストログミドルウェア用
export const logRequest = (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
        };
        
        if (res.statusCode >= 400) {
            logger.warn('HTTP Request', logData);
        } else {
            logger.http('HTTP Request', logData);
        }
    });
    
    next();
};

// データベース操作ログ
export const logDatabase = (operation: string, table: string, params?: any) => {
    logger.debug('Database Operation', {
        operation,
        table,
        params: params ? JSON.stringify(params) : undefined,
        timestamp: new Date().toISOString(),
    });
};

// エラー詳細ログ
export const logErrorDetails = (error: any, context?: string) => {
    const errorDetails = {
        message: error.message,
        stack: error.stack,
        code: error.code,
        context,
        timestamp: new Date().toISOString(),
    };
    
    logger.error('Error Details', errorDetails);
};

// パフォーマンス計測
export const measurePerformance = (operation: string) => {
    const start = process.hrtime.bigint();
    
    return {
        end: () => {
            const end = process.hrtime.bigint();
            const duration = Number(end - start) / 1000000; // ナノ秒をミリ秒に変換
            
            logger.debug('Performance', {
                operation,
                duration: `${duration.toFixed(2)}ms`,
                timestamp: new Date().toISOString(),
            });
            
            return duration;
        }
    };
};

// システム情報ログ
export const logSystemInfo = () => {
    const memoryUsage = process.memoryUsage();
    const systemInfo = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory: {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
        },
        env: process.env.NODE_ENV,
    };
    
    logger.info('System Info', systemInfo);
};

// ログローテーション
export const rotateLogs = () => {
    const logFiles = ['error.log', 'app.log', 'debug.log'];
    
    logFiles.forEach(file => {
        const filePath = path.join(logDir, file);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const fileSizeInMB = stats.size / (1024 * 1024);
            
            if (fileSizeInMB > 5) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupPath = path.join(logDir, `${file}.${timestamp}`);
                fs.renameSync(filePath, backupPath);
                logger.info(`Log rotated: ${file} -> ${file}.${timestamp}`);
            }
        }
    });
};

// 初期化時のシステム情報ログ
if (process.env.NODE_ENV !== 'test') {
    logSystemInfo();
}

export default logger;