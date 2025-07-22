import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

// 基本的なレート制限設定
const createRateLimiter = (options: {
    windowMs: number;
    max: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}) => {
    return rateLimit({
        windowMs: options.windowMs,
        max: options.max,
        message: {
            success: false,
            error: 'TOO_MANY_REQUESTS',
            message: options.message || 'リクエストが多すぎます。しばらく待ってから再試行してください。',
            retryAfter: Math.ceil(options.windowMs / 1000),
            timestamp: new Date().toISOString(),
        },
        standardHeaders: true, // `RateLimit-*` ヘッダーを返す
        legacyHeaders: false, // `X-RateLimit-*` ヘッダーを無効化
        skipSuccessfulRequests: options.skipSuccessfulRequests || false,
        skipFailedRequests: options.skipFailedRequests || false,
        
        // カスタムキー生成（IPアドレス + User-Agent）
        keyGenerator: (req: Request): string => {
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            const userAgent = req.get('User-Agent') || 'unknown';
            return `${ip}:${Buffer.from(userAgent).toString('base64').substring(0, 10)}`;
        },

        // リクエスト制限時のログ
        onLimitReached: (req: Request, res: Response) => {
            logger.warn('Rate limit exceeded', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.path,
                method: req.method,
                timestamp: new Date().toISOString(),
            });
        },

        // ヘッダー情報の追加
        handler: (req: Request, res: Response) => {
            res.status(429).json({
                success: false,
                error: 'TOO_MANY_REQUESTS',
                message: options.message || 'リクエストが多すぎます。しばらく待ってから再試行してください。',
                retryAfter: Math.ceil(options.windowMs / 1000),
                timestamp: new Date().toISOString(),
                path: req.originalUrl,
                method: req.method,
            });
        },
    });
};

// 一般的なAPIリクエスト制限（15分間に100リクエスト）
export const generalLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15分
    max: 100,
    message: 'APIリクエストの制限に達しました。15分後に再試行してください。',
});

// 厳しい制限（認証関連など - 15分間に10リクエスト）
export const strictLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15分
    max: 10,
    message: '認証リクエストの制限に達しました。15分後に再試行してください。',
    skipSuccessfulRequests: true, // 成功したリクエストはカウントしない
});

// ログイン試行制限（5分間に5回）
export const loginLimiter = createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5分
    max: 5,
    message: 'ログイン試行回数が上限に達しました。5分後に再試行してください。',
    skipSuccessfulRequests: true,
});

// パスワードリセット制限（1時間に3回）
export const passwordResetLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1時間
    max: 3,
    message: 'パスワードリセット要求の制限に達しました。1時間後に再試行してください。',
});

// アカウント作成制限（1日に5回）
export const registrationLimiter = createRateLimiter({
    windowMs: 24 * 60 * 60 * 1000, // 24時間
    max: 5,
    message: 'アカウント作成の制限に達しました。24時間後に再試行してください。',
});

// ファイルアップロード制限（1時間に20回）
export const uploadLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1時間
    max: 20,
    message: 'ファイルアップロードの制限に達しました。1時間後に再試行してください。',
});

// データエクスポート制限（1時間に5回）
export const exportLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1時間
    max: 5,
    message: 'データエクスポートの制限に達しました。1時間後に再試行してください。',
});

// 検索API制限（1分間に30回）
export const searchLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1分
    max: 30,
    message: '検索リクエストの制限に達しました。1分後に再試行してください。',
});

// 作成系API制限（1分間に10回）
export const createLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1分
    max: 10,
    message: 'データ作成リクエストの制限に達しました。1分後に再試行してください。',
});

// 更新系API制限（1分間に20回）
export const updateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1分
    max: 20,
    message: 'データ更新リクエストの制限に達しました。1分後に再試行してください。',
});

// 削除系API制限（1分間に5回）
export const deleteLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1分
    max: 5,
    message: 'データ削除リクエストの制限に達しました。1分後に再試行してください。',
});

// IPアドレス別の動的制限
export const createIPBasedLimiter = (maxRequests: number, windowMinutes: number) => {
    const limiters = new Map();

    return (req: Request, res: Response, next: any) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        
        if (!limiters.has(ip)) {
            limiters.set(ip, createRateLimiter({
                windowMs: windowMinutes * 60 * 1000,
                max: maxRequests,
                message: `IPアドレス ${ip} からのリクエストが制限に達しました。${windowMinutes}分後に再試行してください。`,
            }));
        }

        const limiter = limiters.get(ip);
        limiter(req, res, next);
    };
};

// User-Agent別の制限（ボット対策）
export const createUserAgentLimiter = () => {
    return rateLimit({
        windowMs: 15 * 60 * 1000, // 15分
        max: (req: Request) => {
            const userAgent = req.get('User-Agent') || '';
            
            // ボットや自動化ツールの場合は制限を厳しく
            const botPatterns = [
                /bot/i, /crawler/i, /spider/i, /scraper/i,
                /curl/i, /wget/i, /python/i, /postman/i
            ];
            
            const isBot = botPatterns.some(pattern => pattern.test(userAgent));
            
            if (isBot) {
                logger.warn('Bot detected', {
                    userAgent,
                    ip: req.ip,
                    path: req.path
                });
                return 10; // ボットは10リクエスト/15分
            }
            
            return 100; // 通常のブラウザは100リクエスト/15分
        },
        keyGenerator: (req: Request) => {
            return req.get('User-Agent') || 'unknown';
        },
        message: {
            success: false,
            error: 'TOO_MANY_REQUESTS',
            message: 'このUser-Agentからのリクエストが制限に達しました。',
            timestamp: new Date().toISOString(),
        }
    });
};

// カスタム制限チェッカー
export const customLimitChecker = (
    getLimit: (req: Request) => { max: number; windowMs: number },
    keyGenerator?: (req: Request) => string
) => {
    return (req: Request, res: Response, next: any) => {
        const { max, windowMs } = getLimit(req);
        
        const limiter = createRateLimiter({
            windowMs,
            max,
            message: `カスタム制限に達しました。${Math.ceil(windowMs / 1000)}秒後に再試行してください。`,
        });

        // カスタムキージェネレーターがある場合は適用
        if (keyGenerator) {
            (limiter as any).keyGenerator = keyGenerator;
        }

        limiter(req, res, next);
    };
};

// 時間帯別制限（深夜は制限緩和など）
export const timeBasedLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15分
    max: (req: Request) => {
        const hour = new Date().getHours();
        
        // 深夜（22時〜6時）は制限緩和
        if (hour >= 22 || hour <= 6) {
            return 200;
        }
        
        // 日中（7時〜21時）は通常制限
        return 100;
    },
    message: '時間帯制限に達しました。しばらく待ってから再試行してください。',
});

// レート制限情報を取得するユーティリティ
export const getRateLimitInfo = (req: Request) => {
    const headers = req.headers as any;
    
    return {
        limit: headers['ratelimit-limit'],
        remaining: headers['ratelimit-remaining'],
        resetTime: headers['ratelimit-reset'],
        retryAfter: headers['retry-after'],
    };
};

// レート制限ステータスの監視
export const rateLimitMonitor = (req: Request, res: Response, next: any) => {
    const originalSend = res.send;
    
    res.send = function(body: any) {
        if (res.statusCode === 429) {
            logger.warn('Rate limit hit', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.originalUrl,
                method: req.method,
                rateLimitInfo: getRateLimitInfo(req),
                timestamp: new Date().toISOString(),
            });
        }
        
        return originalSend.call(this, body);
    };
    
    next();
};

// 開発環境では制限を緩和
export const getEnvironmentAdjustedLimiter = (prodLimiter: any, devMultiplier: number = 10) => {
    if (process.env.NODE_ENV === 'development') {
        return createRateLimiter({
            windowMs: prodLimiter.windowMs,
            max: prodLimiter.max * devMultiplier,
            message: prodLimiter.message + ' (開発環境)',
        });
    }
    return prodLimiter;
};

// レート制限設定のプリセット
export const presets = {
    // 一般的なAPI
    general: generalLimiter,
    
    // 認証関連
    auth: {
        strict: strictLimiter,
        login: loginLimiter,
        registration: registrationLimiter,
        passwordReset: passwordResetLimiter,
    },
    
    // データ操作
    data: {
        search: searchLimiter,
        create: createLimiter,
        update: updateLimiter,
        delete: deleteLimiter,
    },
    
    // ファイル操作
    files: {
        upload: uploadLimiter,
        export: exportLimiter,
    },
    
    // 特殊
    special: {
        timeBased: timeBasedLimiter,
        userAgent: createUserAgentLimiter(),
    }
};

export default {
    generalLimiter,
    strictLimiter,
    loginLimiter,
    passwordResetLimiter,
    registrationLimiter,
    uploadLimiter,
    exportLimiter,
    searchLimiter,
    createLimiter,
    updateLimiter,
    deleteLimiter,
    createIPBasedLimiter,
    createUserAgentLimiter,
    customLimitChecker,
    timeBasedLimiter,
    rateLimitMonitor,
    getEnvironmentAdjustedLimiter,
    presets,
};