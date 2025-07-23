import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';
import { ForbiddenError, UnauthorizedError } from './errorHandler';

// ================================
// CSRFプロテクション
// ================================

interface CSRFRequest extends Request {
    csrfToken?: string;
    session?: {
        csrfSecret?: string;
    };
}

// CSRF トークン生成
export const generateCSRFToken = (): string => {
    return require('crypto').randomBytes(32).toString('hex');
};

// CSRF トークン検証
export const csrfProtection = (req: CSRFRequest, res: Response, next: NextFunction) => {
    // GET, HEAD, OPTIONS は除外
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const token = req.headers['x-csrf-token'] as string || req.body._csrf;
    const sessionToken = req.session?.csrfSecret;

    if (!token || !sessionToken || token !== sessionToken) {
        logger.warn('CSRF token validation failed', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url,
            providedToken: token ? 'provided' : 'missing',
            sessionToken: sessionToken ? 'exists' : 'missing'
        });
        
        throw new ForbiddenError('Invalid CSRF token');
    }

    next();
};

// ================================
// IPアドレス制限
// ================================

const blockedIPs = new Set<string>();
const suspiciousActivity = new Map<string, number>();

export const ipBlocklist = (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || '';

    // ブロックされたIPをチェック
    if (blockedIPs.has(clientIP)) {
        logger.warn('Blocked IP attempted access', {
            ip: clientIP,
            url: req.url,
            userAgent: req.get('User-Agent')
        });
        
        return res.status(403).json({
            success: false,
            error: 'FORBIDDEN',
            message: 'Access denied',
            timestamp: new Date().toISOString()
        });
    }

    next();
};

// IP を一時的にブロック
export const blockIP = (ip: string, duration: number = 3600000) => { // デフォルト1時間
    blockedIPs.add(ip);
    
    setTimeout(() => {
        blockedIPs.delete(ip);
        logger.info('IP unblocked', { ip });
    }, duration);
    
    logger.warn('IP blocked', { ip, duration });
};

// 疑わしい活動の検出
export const detectSuspiciousActivity = (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || '';
    const currentCount = suspiciousActivity.get(clientIP) || 0;
    
    // 疑わしいパターンをチェック
    const suspiciousPatterns = [
        /\.\./,  // ディレクトリトラバーサル
        /<script/i,  // XSS
        /union.*select/i,  // SQLインジェクション
        /drop.*table/i,  // SQLインジェクション
        /exec.*\(/i,  // コードインジェクション
    ];

    const url = req.url.toLowerCase();
    const userAgent = (req.get('User-Agent') || '').toLowerCase();
    const isSuspicious = suspiciousPatterns.some(pattern => 
        pattern.test(url) || pattern.test(userAgent)
    );

    if (isSuspicious) {
        const newCount = currentCount + 1;
        suspiciousActivity.set(clientIP, newCount);
        
        logger.warn('Suspicious activity detected', {
            ip: clientIP,
            url: req.url,
            userAgent: req.get('User-Agent'),
            suspiciousCount: newCount
        });

        // 3回以上の疑わしい活動でブロック
        if (newCount >= 3) {
            blockIP(clientIP, 3600000); // 1時間ブロック
        }
    }

    // カウンターをリセット（24時間後）
    setTimeout(() => {
        suspiciousActivity.delete(clientIP);
    }, 86400000);

    next();
};

// ================================
// User-Agent バリデーション
// ================================

const blockedUserAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /php/i,
    /perl/i,
    /ruby/i,
];

export const userAgentValidation = (req: Request, res: Response, next: NextFunction) => {
    const userAgent = req.get('User-Agent') || '';
    
    // User-Agent が空の場合
    if (!userAgent.trim()) {
        logger.warn('Empty User-Agent detected', {
            ip: req.ip,
            url: req.url
        });
        
        return res.status(400).json({
            success: false,
            error: 'BAD_REQUEST',
            message: 'User-Agent header is required',
            timestamp: new Date().toISOString()
        });
    }

    // ブロックされた User-Agent をチェック
    const isBlocked = blockedUserAgents.some(pattern => pattern.test(userAgent));
    
    if (isBlocked) {
        logger.warn('Blocked User-Agent detected', {
            ip: req.ip,
            userAgent,
            url: req.url
        });
        
        return res.status(403).json({
            success: false,
            error: 'FORBIDDEN',
            message: 'Access denied',
            timestamp: new Date().toISOString()
        });
    }

    next();
};

// ================================
// リクエストサイズ制限
// ================================

export const requestSizeLimiter = (maxSize: number = 1024 * 1024) => { // デフォルト1MB
    return (req: Request, res: Response, next: NextFunction) => {
        const contentLength = parseInt(req.get('Content-Length') || '0');
        
        if (contentLength > maxSize) {
            logger.warn('Request size exceeded', {
                ip: req.ip,
                contentLength,
                maxSize,
                url: req.url
            });
            
            return res.status(413).json({
                success: false,
                error: 'PAYLOAD_TOO_LARGE',
                message: 'Request entity too large',
                timestamp: new Date().toISOString()
            });
        }

        next();
    };
};

// ================================
// セキュアヘッダー設定
// ================================

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Content Security Policy
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self'; " +
        "font-src 'self'; " +
        "object-src 'none'; " +
        "media-src 'self'; " +
        "frame-src 'none';"
    );

    // その他のセキュリティヘッダー
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // HTTPS でのみ Strict-Transport-Security を設定
    if (req.secure || req.get('X-Forwarded-Proto') === 'https') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
};

// ================================
// SQLインジェクション検出
// ================================

const sqlInjectionPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i,
    /exec(\s|\+)+(s|x)p\w+/i,
    /union[^a-z]*select/i,
    /drop[^a-z]*table/i,
    /insert[^a-z]*into/i,
    /delete[^a-z]*from/i,
    /update[^a-z]*set/i,
];

export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
    const checkForSQLInjection = (value: string): boolean => {
        return sqlInjectionPatterns.some(pattern => pattern.test(value));
    };

    const checkObject = (obj: any, path: string = ''): boolean => {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                const currentPath = path ? `${path}.${key}` : key;
                
                if (typeof value === 'string' && checkForSQLInjection(value)) {
                    logger.warn('SQL injection attempt detected', {
                        ip: req.ip,
                        url: req.url,
                        field: currentPath,
                        value: value.substring(0, 100) // 最初の100文字のみログ
                    });
                    return true;
                }
                
                if (typeof value === 'object' && value !== null) {
                    if (checkObject(value, currentPath)) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    // URL パラメータをチェック
    if (checkForSQLInjection(req.url)) {
        return res.status(400).json({
            success: false,
            error: 'MALICIOUS_REQUEST',
            message: 'Malicious request detected',
            timestamp: new Date().toISOString()
        });
    }

    // リクエストボディをチェック
    if (req.body && checkObject(req.body)) {
        return res.status(400).json({
            success: false,
            error: 'MALICIOUS_REQUEST',
            message: 'Malicious request detected',
            timestamp: new Date().toISOString()
        });
    }

    // クエリパラメータをチェック
    if (req.query && checkObject(req.query)) {
        return res.status(400).json({
            success: false,
            error: 'MALICIOUS_REQUEST',
            message: 'Malicious request detected',
            timestamp: new Date().toISOString()
        });
    }

    next();
};

// ================================
// 高度なレート制限
// ================================

// API キー別レート制限
const apiKeyLimits = new Map<string, { count: number; resetTime: number }>();

export const apiKeyRateLimit = (limit: number = 1000, windowMs: number = 3600000) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const apiKey = req.get('X-API-Key');
        
        if (!apiKey) {
            return next(); // API キーがない場合は通常のレート制限に任せる
        }

        const now = Date.now();
        const keyData = apiKeyLimits.get(apiKey);
        
        if (!keyData || now > keyData.resetTime) {
            // 新しいウィンドウまたは初回
            apiKeyLimits.set(apiKey, {
                count: 1,
                resetTime: now + windowMs
            });
            return next();
        }

        if (keyData.count >= limit) {
            logger.warn('API key rate limit exceeded', {
                apiKey: apiKey.substring(0, 8) + '***',
                ip: req.ip,
                count: keyData.count,
                limit
            });
            
            return res.status(429).json({
                success: false,
                error: 'RATE_LIMIT_EXCEEDED',
                message: 'API key rate limit exceeded',
                retryAfter: Math.ceil((keyData.resetTime - now) / 1000),
                timestamp: new Date().toISOString()
            });
        }

        keyData.count++;
        next();
    };
};

// ================================
// セキュリティミドルウェアの統合
// ================================

export const securityMiddleware = [
    securityHeaders,
    detectSuspiciousActivity,
    ipBlocklist,
    userAgentValidation,
    sqlInjectionProtection,
    requestSizeLimiter(10 * 1024 * 1024), // 10MB
    apiKeyRateLimit(),
];

// ================================
// セキュリティユーティリティ
// ================================

export const securityUtils = {
    // IP アドレスのホワイトリストチェック
    isWhitelistedIP: (ip: string): boolean => {
        const whitelist = (process.env.IP_WHITELIST || '').split(',');
        return whitelist.includes(ip);
    },

    // 管理者IPかどうかチェック
    isAdminIP: (ip: string): boolean => {
        const adminIPs = (process.env.ADMIN_IPS || '').split(',');
        return adminIPs.includes(ip);
    },

    // セキュリティレポート生成
    generateSecurityReport: () => {
        return {
            blockedIPs: Array.from(blockedIPs),
            suspiciousActivityCount: suspiciousActivity.size,
            apiKeyUsage: apiKeyLimits.size,
            timestamp: new Date().toISOString()
        };
    },

    // セキュリティ設定のリセット
    resetSecurityCounters: () => {
        blockedIPs.clear();
        suspiciousActivity.clear();
        apiKeyLimits.clear();
        logger.info('Security counters reset');
    }
};

export default {
    csrfProtection,
    generateCSRFToken,
    ipBlocklist,
    blockIP,
    detectSuspiciousActivity,
    userAgentValidation,
    requestSizeLimiter,
    securityHeaders,
    sqlInjectionProtection,
    apiKeyRateLimit,
    securityMiddleware,
    securityUtils
};
