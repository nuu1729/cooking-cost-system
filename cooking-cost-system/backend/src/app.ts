import 'reflect-metadata';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { corsOptions } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { rateLimitConfig } from './middleware/rateLimit';
import { logger } from './utils/logger';

// Routes
import ingredientsRouter from './routes/ingredients';
import dishesRouter from './routes/dishes';
import completedFoodsRouter from './routes/completedFoods';
import reportsRouter from './routes/reports';
import memoRouter from './routes/memo';
import uploadRouter from './routes/upload';
import authRouter from './routes/auth';

class App {
    public app: Application;

    constructor() {
        this.app = express();
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
        this.initializeHealthCheck();
    }

    private initializeMiddleware(): void {
        // セキュリティミドルウェア
        this.app.use(helmet({
            crossOriginEmbedderPolicy: false,
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'", "'unsafe-eval'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"],
                },
            },
        }));

        // CORS設定
        this.app.use(cors(corsOptions));

        // レート制限
        this.app.use('/api/', rateLimit(rateLimitConfig));

        // 圧縮
        this.app.use(compression());

        // JSONパーサー
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

        // リクエストログ
        this.app.use(requestLogger);

        // 静的ファイル配信
        this.app.use('/uploads', express.static('uploads'));
    }

    private initializeRoutes(): void {
        // API ルート
        this.app.use('/api/ingredients', ingredientsRouter);
        this.app.use('/api/dishes', dishesRouter);
        this.app.use('/api/foods', completedFoodsRouter);
        this.app.use('/api/reports', reportsRouter);
        this.app.use('/api/memo', memoRouter);
        this.app.use('/api/upload', uploadRouter);
        this.app.use('/api/auth', authRouter);

        // API情報エンドポイント
        this.app.get('/api', (req: Request, res: Response) => {
            res.json({
                name: '🍽️ 料理原価計算システム API',
                version: '2.0.0',
                description: 'モダンな料理原価計算システムのREST API',
                endpoints: {
                    ingredients: '/api/ingredients',
                    dishes: '/api/dishes',
                    completedFoods: '/api/foods',
                    reports: '/api/reports',
                    memo: '/api/memo',
                    upload: '/api/upload',
                    auth: '/api/auth',
                },
                documentation: 'https://github.com/your-repo/cooking-cost-system/wiki/api',
                status: 'active',
                timestamp: new Date().toISOString(),
            });
        });

        // 404エラーハンドリング
        this.app.all('*', (req: Request, res: Response) => {
            logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString(),
            });

            res.status(404).json({
                success: false,
                message: `Route ${req.originalUrl} not found`,
                error: 'NOT_FOUND',
                timestamp: new Date().toISOString(),
            });
        });
    }

    private initializeErrorHandling(): void {
        this.app.use(errorHandler);
    }

    private initializeHealthCheck(): void {
        // ヘルスチェックエンドポイント
        this.app.get('/health', async (req: Request, res: Response) => {
            try {
                const healthCheck = {
                    uptime: process.uptime(),
                    message: 'OK',
                    timestamp: new Date().toISOString(),
                    environment: process.env.NODE_ENV || 'development',
                    version: '2.0.0',
                    memory: process.memoryUsage(),
                    cpu: process.cpuUsage(),
                };

                res.status(200).json(healthCheck);
            } catch (error) {
                logger.error('Health check failed:', error);
                res.status(503).json({
                    message: 'Service Unavailable',
                    timestamp: new Date().toISOString(),
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        });

        // 詳細ヘルスチェック
        this.app.get('/health/detailed', async (req: Request, res: Response) => {
            try {
                // データベース接続チェックは後で実装
                const detailed = {
                    status: 'healthy',
                    checks: {
                        database: 'connected', // TODO: 実際のDB接続チェック
                        memory: process.memoryUsage().heapUsed < 1000000000 ? 'ok' : 'warning',
                        disk: 'ok', // TODO: ディスク使用量チェック
                    },
                    info: {
                        uptime: process.uptime(),
                        environment: process.env.NODE_ENV,
                        nodeVersion: process.version,
                        platform: process.platform,
                        architecture: process.arch,
                    },
                    timestamp: new Date().toISOString(),
                };

                res.status(200).json(detailed);
            } catch (error) {
                logger.error('Detailed health check failed:', error);
                res.status(503).json({
                    status: 'unhealthy',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString(),
                });
            }
        });
    }

    public listen(port: number): void {
        this.app.listen(port, () => {
            logger.info(`🍽️ Cooking Cost System API Server started on port ${port}`, {
                environment: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString(),
            });
        });
    }
}

export default App;