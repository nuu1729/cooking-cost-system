import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

// 基本レート制限設定
export const rateLimitConfig = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分
    max: 100, // 最大100リクエスト
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: '15 minutes',
        timestamp: new Date().toISOString(),
    },
    standardHeaders: true, // レート制限情報をheaderに含める
    legacyHeaders: false,
    onLimitReached: (req, res, options) => {
        logger.warn('Rate limit exceeded:', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url,
            method: req.method,
        });
    },
});

// API別レート制限
export const strictRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5分
    max: 20, // 最大20リクエスト
    message: {
        success: false,
        message: 'Too many API requests, please slow down.',
        error: 'STRICT_RATE_LIMIT',
        retryAfter: '5 minutes',
        timestamp: new Date().toISOString(),
    },
});

// アップロード用レート制限
export const uploadRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1時間
    max: 10, // 最大10回のアップロード
    message: {
        success: false,
        message: 'Upload limit exceeded. Please try again later.',
        error: 'UPLOAD_RATE_LIMIT',
        retryAfter: '1 hour',
        timestamp: new Date().toISOString(),
    },
});

// 認証系レート制限
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分
    max: 5, // 最大5回の認証試行
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.',
        error: 'AUTH_RATE_LIMIT',
        retryAfter: '15 minutes',
        timestamp: new Date().toISOString(),
    },
    skipSuccessfulRequests: true,
});