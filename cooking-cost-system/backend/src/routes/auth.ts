import { Router, Request, Response } from 'express';
import { asyncHandler, UnauthorizedError, BadRequestError } from '../middleware/errorHandler';
import { authRateLimit } from '../middleware/rateLimit';
import { logger } from '../utils/logger';

const router = Router();

// 簡易認証（将来的にはJWT等を実装）
// 現在はデモ用の実装

// POST /api/auth/login - ログイン
router.post('/login', 
    authRateLimit,
    asyncHandler(async (req: Request, res: Response) => {
        const { username, password } = req.body;

        if (!username || !password) {
            throw new BadRequestError('Username and password are required');
        }

        // デモ用認証（実際の実装では適切な認証処理を行う）
        if (username === 'admin' && password === 'admin123') {
            const user = {
                id: 1,
                username: 'admin',
                email: 'admin@cooking-system.local',
                role: 'admin',
                is_active: true,
            };

            const token = 'demo-token-' + Date.now(); // 実際の実装ではJWTを生成

            logger.info(`User logged in: ${username}`);

            res.json({
                success: true,
                data: {
                    user,
                    token,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
                },
                message: 'Login successful',
                timestamp: new Date().toISOString(),
            });
        } else {
            throw new UnauthorizedError('Invalid credentials');
        }
    })
);

// POST /api/auth/logout - ログアウト
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
    // 実際の実装ではトークンの無効化処理を行う
    
    logger.info('User logged out');

    res.json({
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString(),
    });
}));

// GET /api/auth/me - 現在のユーザー情報
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
    // 実際の実装ではトークンからユーザー情報を取得
    const user = {
        id: 1,
        username: 'admin',
        email: 'admin@cooking-system.local',
        role: 'admin',
        is_active: true,
    };

    res.json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
    });
}));

// POST /api/auth/register - 新規登録（将来用）
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
    throw new BadRequestError('User registration is not available in this version');
}));

export default router;