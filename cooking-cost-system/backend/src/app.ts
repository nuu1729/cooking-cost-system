import 'reflect-metadata';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';

// Middleware imports
import { corsOptions } from './middleware/cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { rateLimitConfig } from './middleware/rateLimit';
import { logger } from './utils/logger';

// Routes imports
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
                    styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
                    scriptSrc: ["'self'", "'unsafe-eval'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'", "fonts.gstatic.com"],
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
        this.app.use(compression({
            filter: (req, res) => {
                if (req.headers['x-no-compression']) {
                    return false;
                }
                return compression.filter(req, res);
            },
            threshold: 1024
        }));

        // JSONパーサー
        this.app.use(express.json({ 
            limit: '10mb',
            verify: (req: any, res, buf) => {
                req.rawBody = buf;
            }
        }));
        
        this.app.use(express.urlencoded({ 
            extended: true, 
            limit: '10mb' 
        }));

        // リクエストログ
        this.app.use(requestLogger);

        // 静的ファイル配信
        this.app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
            maxAge: process.env.NODE_ENV === 'production' ? '7d' : '0',
            etag: true,
            lastModified: true
        }));

        // Trust proxy（本番環境でロードバランサー使用時）
        if (process.env.NODE_ENV === 'production') {
            this.app.set('trust proxy', 1);
        }
    }

    private initializeRoutes(): void {
        // ルートエンドポイント
        this.app.get('/', (req: Request, res: Response) => {
            res.json({
                message: '🍽️ 料理原価計算システム API v2.0',
                version: '2.0.0',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                status: 'running'
            });
        });

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
                    ingredients: {
                        path: '/api/ingredients',
                        description: '食材管理 - 食材の追加、編集、削除、検索'
                    },
                    dishes: {
                        path: '/api/dishes',
                        description: '料理管理 - 料理の作成、編集、削除'
                    },
                    completedFoods: {
                        path: '/api/foods',
                        description: '完成品管理 - 完成品の登録、編集、削除'
                    },
                    reports: {
                        path: '/api/reports',
                        description: 'レポート - 統計情報、分析データ'
                    },
                    memo: {
                        path: '/api/memo',
                        description: 'メモ機能 - メモの作成、編集'
                    },
                    upload: {
                        path: '/api/upload',
                        description: 'ファイルアップロード機能'
                    },
                    auth: {
                        path: '/api/auth',
                        description: '認証機能（将来用）'
                    }
                },
                documentation: 'https://github.com/your-repo/cooking-cost-system/wiki/api',
                status: 'active',
                timestamp: new Date().toISOString(),
            });
        });

        // 404エラーハンドリング
        this.app.use(notFoundHandler);
    }

    private initializeErrorHandling(): void {
        this.app.use(errorHandler);
    }

    private initializeHealthCheck(): void {
        // 基本ヘルスチェック
        this.app.get('/health', async (req: Request, res: Response) => {
            try {
                const healthCheck = {
                    uptime: process.uptime(),
                    message: 'OK',
                    timestamp: new Date().toISOString(),
                    environment: process.env.NODE_ENV || 'development',
                    version: '2.0.0',
                    memory: {
                        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
                        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB'
                    },
                    cpu: process.cpuUsage(),
                    platform: {
                        arch: process.arch,
                        platform: process.platform,
                        node: process.version
                    }
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
                // データベース接続チェック（実装予定）
                let databaseStatus = 'checking';
                try {
                    // const db = getDatabase();
                    // await db.query('SELECT 1');
                    databaseStatus = 'connected';
                } catch (error) {
                    databaseStatus = 'disconnected';
                }

                const detailed = {
                    status: 'healthy',
                    checks: {
                        database: databaseStatus,
                        memory: process.memoryUsage().heapUsed < 1000000000 ? 'ok' : 'warning',
                        uptime: process.uptime() > 60 ? 'ok' : 'starting',
                        environment: process.env.NODE_ENV ? 'ok' : 'warning'
                    },
                    info: {
                        uptime: `${Math.floor(process.uptime() / 60)} minutes`,
                        environment: process.env.NODE_ENV,
                        nodeVersion: process.version,
                        platform: process.platform,
                        architecture: process.arch,
                        pid: process.pid,
                        memory: process.memoryUsage(),
                        loadAverage: process.platform !== 'win32' ? require('os').loadavg() : 'N/A'
                    },
                    timestamp: new Date().toISOString(),
                };

                const statusCode = Object.values(detailed.checks).includes('disconnected') ? 503 : 200;
                res.status(statusCode).json(detailed);
            } catch (error) {
                logger.error('Detailed health check failed:', error);
                res.status(503).json({
                    status: 'unhealthy',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString(),
                });
            }
        });

        // メトリクスエンドポイント（Prometheus形式）
        this.app.get('/metrics', (req: Request, res: Response) => {
            const metrics = `
# HELP nodejs_process_uptime_seconds Process uptime in seconds
# TYPE nodejs_process_uptime_seconds gauge
nodejs_process_uptime_seconds ${process.uptime()}

# HELP nodejs_heap_size_used_bytes Process heap size used in bytes
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes ${process.memoryUsage().heapUsed}

# HELP nodejs_heap_size_total_bytes Process heap size total in bytes
# TYPE nodejs_heap_size_total_bytes gauge
nodejs_heap_size_total_bytes ${process.memoryUsage().heapTotal}

# HELP nodejs_external_memory_bytes Node.js external memory in bytes
# TYPE nodejs_external_memory_bytes gauge
nodejs_external_memory_bytes ${process.memoryUsage().external}
            `.trim();

            res.set('Content-Type', 'text/plain');
            res.send(metrics);
        });
    }

    public getApp(): Application {
        return this.app;
    }
}

export default new App().getApp();
