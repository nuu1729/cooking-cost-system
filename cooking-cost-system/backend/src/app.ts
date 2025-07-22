import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { corsOptions } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// ルートインポート
import ingredientsRouter from './routes/ingredients';
import dishesRouter from './routes/dishes';
import completedFoodsRouter from './routes/completedFoods';
import reportsRouter from './routes/reports';
import memoRouter from './routes/memo';
import uploadRouter from './routes/upload';
import authRouter from './routes/auth';

const app = express();

// セキュリティミドルウェア
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:3000"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// CORS設定
app.use(cors(corsOptions));

// 圧縮
app.use(compression());

// レート制限
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分
    max: 100, // 最大100リクエスト
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: 15 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
});

if (process.env.NODE_ENV === 'production') {
    app.use(limiter);
}

// ログ設定
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: {
            write: (message: string) => logger.info(message.trim())
        }
    }));
}

// JSONパーサー
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静的ファイル配信
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ヘルスチェック
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '2.0.0',
    });
});

// API情報
app.get('/api', (req, res) => {
    res.json({
        name: '料理原価計算システム API',
        version: '2.0.0',
        description: 'Food cost calculation system API',
        endpoints: {
            ingredients: '/api/ingredients',
            dishes: '/api/dishes',
            completedFoods: '/api/foods',
            reports: '/api/reports',
            memo: '/api/memo',
            upload: '/api/upload',
            auth: '/api/auth',
        },
        documentation: '/api/docs',
        status: 'active',
    });
});

// APIルート
app.use('/api/ingredients', ingredientsRouter);
app.use('/api/dishes', dishesRouter);
app.use('/api/foods', completedFoodsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/memo', memoRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/auth', authRouter);

// 404ハンドラー
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
    });
});

// エラーハンドラー
app.use(errorHandler);

// プロセス終了ハンドラー
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

export default app;