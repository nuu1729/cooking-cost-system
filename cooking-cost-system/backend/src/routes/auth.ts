import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
    executeQuery, 
    executeQueryOne, 
    executeInsert, 
    executeUpdate 
} from '../database';
import { asyncHandler, validationErrorHandler, UnauthorizedError, BadRequestError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// JWT秘密鍵
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// バリデーションルール
const loginValidation = [
    body('username')
        .notEmpty()
        .withMessage('ユーザー名は必須です')
        .isLength({ min: 3, max: 50 })
        .withMessage('ユーザー名は3〜50文字で入力してください'),
    body('password')
        .notEmpty()
        .withMessage('パスワードは必須です')
        .isLength({ min: 6 })
        .withMessage('パスワードは6文字以上で入力してください'),
];

const registerValidation = [
    body('username')
        .notEmpty()
        .withMessage('ユーザー名は必須です')
        .isLength({ min: 3, max: 50 })
        .withMessage('ユーザー名は3〜50文字で入力してください')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('ユーザー名は英数字とアンダースコアのみ使用可能です'),
    body('email')
        .isEmail()
        .withMessage('正しいメールアドレスを入力してください')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('パスワードは8文字以上で入力してください')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('パスワードは小文字、大文字、数字を含む必要があります'),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('パスワードが一致しません');
            }
            return true;
        }),
];

const changePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('現在のパスワードは必須です'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('新しいパスワードは8文字以上で入力してください')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('新しいパスワードは小文字、大文字、数字を含む必要があります'),
];

// バリデーションエラーチェック
const checkValidation = (req: Request, res: Response, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw validationErrorHandler(errors.array());
    }
    next();
};

// JWTトークン生成
const generateToken = (userId: number, username: string, role: string = 'user') => {
    return jwt.sign(
        { 
            userId, 
            username, 
            role,
            iat: Math.floor(Date.now() / 1000)
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// JWTトークン検証ミドルウェア
export const authenticateToken = (req: any, res: Response, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        throw new UnauthorizedError('認証トークンが必要です');
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            throw new UnauthorizedError('無効な認証トークンです');
        }
        req.user = user;
        next();
    });
};

// 管理者権限チェック
export const requireAdmin = (req: any, res: Response, next: any) => {
    if (req.user?.role !== 'admin') {
        throw new UnauthorizedError('管理者権限が必要です');
    }
    next();
};

// ユーザー登録 (POST /api/auth/register)
router.post('/register', registerValidation, checkValidation, asyncHandler(async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    // ユーザー名の重複チェック
    const existingUser = await executeQueryOne(`
        SELECT id FROM users WHERE username = ? OR email = ?
    `, [username, email]);

    if (existingUser) {
        throw new BadRequestError('このユーザー名またはメールアドレスは既に使用されています');
    }

    // パスワードハッシュ化
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ユーザー作成
    const userId = await executeInsert(`
        INSERT INTO users (username, email, password_hash, role, is_active)
        VALUES (?, ?, ?, 'user', true)
    `, [username, email, hashedPassword]);

    // JWTトークン生成
    const token = generateToken(userId, username, 'user');

    // パスワードを除いたユーザー情報を取得
    const newUser = await executeQueryOne(`
        SELECT id, username, email, role, is_active, created_at
        FROM users WHERE id = ?
    `, [userId]);

    logger.info('User registered', {
        userId,
        username,
        email
    });

    res.status(201).json({
        success: true,
        data: {
            user: newUser,
            token,
            expiresIn: JWT_EXPIRES_IN
        },
        message: 'ユーザー登録が完了しました',
        timestamp: new Date().toISOString(),
    });
}));

// ログイン (POST /api/auth/login)
router.post('/login', loginValidation, checkValidation, asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;

    // ユーザー取得
    const user = await executeQueryOne(`
        SELECT id, username, email, password_hash, role, is_active, last_login
        FROM users 
        WHERE username = ? OR email = ?
    `, [username, username]);

    if (!user) {
        throw new UnauthorizedError('ユーザー名またはパスワードが正しくありません');
    }

    if (!user.is_active) {
        throw new UnauthorizedError('このアカウントは無効化されています');
    }

    // パスワード確認
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
        throw new UnauthorizedError('ユーザー名またはパスワードが正しくありません');
    }

    // 最終ログイン時刻更新
    await executeUpdate(`
        UPDATE users 
        SET last_login = NOW() 
        WHERE id = ?
    `, [user.id]);

    // JWTトークン生成
    const token = generateToken(user.id, user.username, user.role);

    // パスワードハッシュを除いたユーザー情報
    const { password_hash, ...userInfo } = user;

    logger.info('User logged in', {
        userId: user.id,
        username: user.username,
        role: user.role
    });

    res.json({
        success: true,
        data: {
            user: userInfo,
            token,
            expiresIn: JWT_EXPIRES_IN
        },
        message: 'ログインしました',
        timestamp: new Date().toISOString(),
    });
}));

// ログアウト (POST /api/auth/logout)
router.post('/logout', authenticateToken, asyncHandler(async (req: any, res: Response) => {
    // JWTはステートレスなので、クライアント側でトークンを削除してもらう
    // 必要に応じてトークンブラックリストを実装可能

    logger.info('User logged out', {
        userId: req.user.userId,
        username: req.user.username
    });

    res.json({
        success: true,
        message: 'ログアウトしました',
        timestamp: new Date().toISOString(),
    });
}));

// トークン検証・更新 (POST /api/auth/refresh)
router.post('/refresh', authenticateToken, asyncHandler(async (req: any, res: Response) => {
    const { userId, username, role } = req.user;

    // ユーザーの現在の状態を確認
    const currentUser = await executeQueryOne(`
        SELECT id, username, email, role, is_active
        FROM users 
        WHERE id = ?
    `, [userId]);

    if (!currentUser || !currentUser.is_active) {
        throw new UnauthorizedError('ユーザーが見つからないか、無効化されています');
    }

    // 新しいトークン生成
    const newToken = generateToken(currentUser.id, currentUser.username, currentUser.role);

    res.json({
        success: true,
        data: {
            user: currentUser,
            token: newToken,
            expiresIn: JWT_EXPIRES_IN
        },
        message: 'トークンを更新しました',
        timestamp: new Date().toISOString(),
    });
}));

// プロフィール取得 (GET /api/auth/profile)
router.get('/profile', authenticateToken, asyncHandler(async (req: any, res: Response) => {
    const { userId } = req.user;

    const user = await executeQueryOne(`
        SELECT id, username, email, role, is_active, created_at, last_login
        FROM users 
        WHERE id = ?
    `, [userId]);

    if (!user) {
        throw new UnauthorizedError('ユーザーが見つかりません');
    }

    res.json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
    });
}));

// プロフィール更新 (PUT /api/auth/profile)
router.put('/profile', 
    authenticateToken,
    [
        body('email').optional().isEmail().withMessage('正しいメールアドレスを入力してください'),
        body('username').optional().isLength({ min: 3, max: 50 }).withMessage('ユーザー名は3〜50文字で入力してください'),
    ],
    checkValidation,
    asyncHandler(async (req: any, res: Response) => {
        const { userId } = req.user;
        const { email, username } = req.body;

        const updateFields: string[] = [];
        const updateParams: any[] = [];

        if (email !== undefined) {
            // メールアドレスの重複チェック
            const existingEmail = await executeQueryOne(`
                SELECT id FROM users WHERE email = ? AND id != ?
            `, [email, userId]);

            if (existingEmail) {
                throw new BadRequestError('このメールアドレスは既に使用されています');
            }

            updateFields.push('email = ?');
            updateParams.push(email);
        }

        if (username !== undefined) {
            // ユーザー名の重複チェック
            const existingUsername = await executeQueryOne(`
                SELECT id FROM users WHERE username = ? AND id != ?
            `, [username, userId]);

            if (existingUsername) {
                throw new BadRequestError('このユーザー名は既に使用されています');
            }

            updateFields.push('username = ?');
            updateParams.push(username);
        }

        if (updateFields.length === 0) {
            throw new BadRequestError('更新する項目が指定されていません');
        }

        updateFields.push('updated_at = NOW()');
        updateParams.push(userId);

        await executeUpdate(`
            UPDATE users 
            SET ${updateFields.join(', ')} 
            WHERE id = ?
        `, updateParams);

        // 更新されたユーザー情報を取得
        const updatedUser = await executeQueryOne(`
            SELECT id, username, email, role, is_active, created_at, last_login
            FROM users 
            WHERE id = ?
        `, [userId]);

        logger.info('User profile updated', {
            userId,
            updates: Object.keys(req.body)
        });

        res.json({
            success: true,
            data: updatedUser,
            message: 'プロフィールを更新しました',
            timestamp: new Date().toISOString(),
        });
    })
);

// パスワード変更 (POST /api/auth/change-password)
router.post('/change-password', 
    authenticateToken,
    changePasswordValidation,
    checkValidation,
    asyncHandler(async (req: any, res: Response) => {
        const { userId } = req.user;
        const { currentPassword, newPassword } = req.body;

        // 現在のパスワード確認
        const user = await executeQueryOne(`
            SELECT password_hash FROM users WHERE id = ?
        `, [userId]);

        if (!user) {
            throw new UnauthorizedError('ユーザーが見つかりません');
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

        if (!isCurrentPasswordValid) {
            throw new BadRequestError('現在のパスワードが正しくありません');
        }

        // 新しいパスワードをハッシュ化
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // パスワード更新
        await executeUpdate(`
            UPDATE users 
            SET password_hash = ?, updated_at = NOW() 
            WHERE id = ?
        `, [hashedNewPassword, userId]);

        logger.info('User password changed', {
            userId,
            username: req.user.username
        });

        res.json({
            success: true,
            message: 'パスワードを変更しました',
            timestamp: new Date().toISOString(),
        });
    })
);

// 管理者専用：ユーザー一覧取得 (GET /api/auth/users)
router.get('/users', 
    authenticateToken, 
    requireAdmin, 
    asyncHandler(async (req: Request, res: Response) => {
        const { page = 1, limit = 20, active } = req.query;

        let whereClause = '';
        const params: any[] = [];

        if (active !== undefined) {
            whereClause = 'WHERE is_active = ?';
            params.push(active === 'true');
        }

        const users = await executeQuery(`
            SELECT 
                id, 
                username, 
                email, 
                role, 
                is_active, 
                created_at, 
                last_login
            FROM users
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, Number(limit), (Number(page) - 1) * Number(limit)]);

        const totalUsers = await executeQueryOne(`
            SELECT COUNT(*) as count FROM users ${whereClause}
        `, params);

        res.json({
            success: true,
            data: users,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: totalUsers.count,
                totalPages: Math.ceil(totalUsers.count / Number(limit))
            },
            timestamp: new Date().toISOString(),
        });
    })
);

// 開発環境用：初期データ作成
if (process.env.NODE_ENV === 'development') {
    router.post('/dev/create-admin', asyncHandler(async (req: Request, res: Response) => {
        const adminExists = await executeQueryOne('SELECT id FROM users WHERE role = "admin"');
        
        if (adminExists) {
            throw new BadRequestError('管理者ユーザーは既に存在します');
        }

        const hashedPassword = await bcrypt.hash('admin123', 12);
        
        const adminId = await executeInsert(`
            INSERT INTO users (username, email, password_hash, role, is_active)
            VALUES ('admin', 'admin@example.com', ?, 'admin', true)
        `, [hashedPassword]);

        res.json({
            success: true,
            message: '管理者ユーザーを作成しました（username: admin, password: admin123）',
            data: { userId: adminId }
        });
    }));
}

export default router;