import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from './errorHandler';
import { User, UserRole, JWTPayload } from '../types';
import { logger } from '../utils/logger';

// 認証済みリクエストの型定義
export interface AuthenticatedRequest extends Request {
    user?: User;
    token?: string;
}

// ================================
// JWT ユーティリティ関数
// ================================

/**
 * JWTトークンを生成
 */
export const generateToken = (user: User): string => {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: user.id!,
        username: user.username,
        role: user.role,
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'cooking-cost-system',
        audience: 'cooking-cost-api',
    });
};

/**
 * JWTトークンを検証
 */
export const verifyToken = (token: string): JWTPayload => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
            issuer: 'cooking-cost-system',
            audience: 'cooking-cost-api',
        }) as JWTPayload;

        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new UnauthorizedError('Token has expired');
        } else if (error instanceof jwt.JsonWebTokenError) {
            throw new UnauthorizedError('Invalid token');
        } else {
            throw new UnauthorizedError('Token verification failed');
        }
    }
};

/**
 * リフレッシュトークンを生成
 */
export const generateRefreshToken = (userId: number): string => {
    return jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
    );
};

// ================================
// 認証ミドルウェア
// ================================

/**
 * JWT認証ミドルウェア
 */
export const authenticateToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            throw new UnauthorizedError('Authorization header is required');
        }

        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader;

        if (!token) {
            throw new UnauthorizedError('Token is required');
        }

        const decoded = verifyToken(token);

        // トークンのタイプチェック（リフレッシュトークンは除外）
        if ((decoded as any).type === 'refresh') {
            throw new UnauthorizedError('Refresh token cannot be used for API access');
        }

        // ユーザー情報をリクエストに追加
        req.user = {
            id: decoded.userId,
            username: decoded.username,
            role: decoded.role,
            email: '', // 実際の実装ではDBから取得
            is_active: true,
        };
        req.token = token;

        logger.debug('Token authenticated successfully', {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role,
        });

        next();
    } catch (error) {
        logger.warn('Token authentication failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
        });
        next(error);
    }
};

/**
 * オプショナル認証ミドルウェア
 * トークンがある場合のみ認証を行い、ない場合はそのまま通す
 */
export const optionalAuthentication = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return next();
    }

    try {
        await authenticateToken(req, res, next);
    } catch (error) {
        // オプショナルなので認証エラーは無視
        next();
    }
};

// ================================
// 認可ミドルウェア
// ================================

/**
 * 役割ベースの認可ミドルウェア
 */
export const requireRole = (...roles: UserRole[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            throw new UnauthorizedError('Authentication required');
        }

        if (!roles.includes(req.user.role)) {
            logger.warn('Access denied - insufficient role', {
                userId: req.user.id,
                userRole: req.user.role,
                requiredRoles: roles,
                path: req.path,
                method: req.method,
            });
            throw new ForbiddenError(`Required role: ${roles.join(' or ')}`);
        }

        next();
    };
};

/**
 * 管理者権限必須ミドルウェア
 */
export const requireAdmin = requireRole('admin');

/**
 * リソース所有者または管理者のみアクセス可能
 */
export const requireOwnerOrAdmin = (getUserIdFromParams: (req: Request) => number) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            throw new UnauthorizedError('Authentication required');
        }

        const resourceUserId = getUserIdFromParams(req);
        const isOwner = req.user.id === resourceUserId;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            logger.warn('Access denied - not owner or admin', {
                userId: req.user.id,
                resourceUserId,
                path: req.path,
                method: req.method,
            });
            throw new ForbiddenError('Access denied');
        }

        next();
    };
};

// ================================
// セッション管理
// ================================

/**
 * アクティブセッションを管理するためのインメモリストレージ
 * 本番環境ではRedisなどの永続化ストレージを使用
 */
class SessionManager {
    private static instance: SessionManager;
    private activeSessions: Map<number, Set<string>> = new Map();

    public static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    /**
     * セッションを追加
     */
    public addSession(userId: number, token: string): void {
        if (!this.activeSessions.has(userId)) {
            this.activeSessions.set(userId, new Set());
        }
        this.activeSessions.get(userId)!.add(token);
    }

    /**
     * セッションを削除
     */
    public removeSession(userId: number, token: string): void {
        const userSessions = this.activeSessions.get(userId);
        if (userSessions) {
            userSessions.delete(token);
            if (userSessions.size === 0) {
                this.activeSessions.delete(userId);
            }
        }
    }

    /**
     * ユーザーの全セッションを削除
     */
    public removeAllUserSessions(userId: number): void {
        this.activeSessions.delete(userId);
    }

    /**
     * セッションが有効かチェック
     */
    public isSessionActive(userId: number, token: string): boolean {
        const userSessions = this.activeSessions.get(userId);
        return userSessions ? userSessions.has(token) : false;
    }

    /**
     * ユーザーのアクティブセッション数を取得
     */
    public getActiveSessionCount(userId: number): number {
        const userSessions = this.activeSessions.get(userId);
        return userSessions ? userSessions.size : 0;
    }

    /**
     * 期限切れセッションのクリーンアップ
     */
    public cleanupExpiredSessions(): void {
        // 実際の実装では、JWTの有効期限をチェックして削除
        // ここでは簡易実装
        this.activeSessions.forEach((sessions, userId) => {
            const validSessions = new Set<string>();
            sessions.forEach(token => {
                try {
                    verifyToken(token);
                    validSessions.add(token);
                } catch {
                    // 無効なトークンは除外
                }
            });
            
            if (validSessions.size === 0) {
                this.activeSessions.delete(userId);
            } else {
                this.activeSessions.set(userId, validSessions);
            }
        });
    }
}

export const sessionManager = SessionManager.getInstance();

// セッションクリーンアップを定期実行（1時間ごと）
setInterval(() => {
    sessionManager.cleanupExpiredSessions();
}, 60 * 60 * 1000);

// ================================
// 認証ユーティリティ
// ================================

/**
 * パスワードハッシュ化
 */
export const hashPassword = async (password: string): Promise<string> => {
    const bcrypt = await import('bcrypt');
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    return bcrypt.hash(password, saltRounds);
};

/**
 * パスワード検証
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, hash);
};

/**
 * 安全なランダム文字列生成
 */
export const generateSecureToken = (length: number = 32): string => {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
};

// ================================
// レート制限付き認証
// ================================

/**
 * 認証試行回数を制限するミドルウェア
 */
export const rateLimitAuth = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
    const attempts = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction): void => {
        const identifier = req.ip + (req.body.username || req.body.email || '');
        const now = Date.now();
        
        const userAttempts = attempts.get(identifier);
        
        if (userAttempts) {
            if (now > userAttempts.resetTime) {
                // ウィンドウをリセット
                attempts.set(identifier, { count: 1, resetTime: now + windowMs });
            } else if (userAttempts.count >= maxAttempts) {
                logger.warn('Authentication rate limit exceeded', {
                    ip: req.ip,
                    identifier: identifier.substring(0, 20) + '...',
                    attempts: userAttempts.count,
                });
                throw new UnauthorizedError('Too many authentication attempts. Please try again later.');
            } else {
                userAttempts.count++;
            }
        } else {
            attempts.set(identifier, { count: 1, resetTime: now + windowMs });
        }

        // 認証成功時はカウンターをリセット
        const originalSend = res.send;
        res.send = function(data) {
            if (res.statusCode < 400) {
                attempts.delete(identifier);
            }
            return originalSend.call(this, data);
        };

        next();
    };
};

// ================================
// トークンブラックリスト
// ================================

/**
 * 無効化されたトークンを管理
 */
class TokenBlacklist {
    private static instance: TokenBlacklist;
    private blacklistedTokens: Set<string> = new Set();

    public static getInstance(): TokenBlacklist {
        if (!TokenBlacklist.instance) {
            TokenBlacklist.instance = new TokenBlacklist();
        }
        return TokenBlacklist.instance;
    }

    public blacklistToken(token: string): void {
        this.blacklistedTokens.add(token);
    }

    public isBlacklisted(token: string): boolean {
        return this.blacklistedTokens.has(token);
    }

    public cleanupExpiredTokens(): void {
        // 実際の実装では、トークンの有効期限をチェックして削除
        this.blacklistedTokens.forEach(token => {
            try {
                verifyToken(token);
            } catch {
                // 期限切れのトークンは削除
                this.blacklistedTokens.delete(token);
            }
        });
    }
}

export const tokenBlacklist = TokenBlacklist.getInstance();

/**
 * ブラックリストチェックミドルウェア
 */
export const checkBlacklist = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (req.token && tokenBlacklist.isBlacklisted(req.token)) {
        throw new UnauthorizedError('Token has been revoked');
    }
    next();
};

// ================================
// エクスポート
// ================================

export default {
    authenticateToken,
    optionalAuthentication,
    requireRole,
    requireAdmin,
    requireOwnerOrAdmin,
    generateToken,
    verifyToken,
    generateRefreshToken,
    hashPassword,
    verifyPassword,
    generateSecureToken,
    rateLimitAuth,
    checkBlacklist,
    sessionManager,
    tokenBlacklist,
};
