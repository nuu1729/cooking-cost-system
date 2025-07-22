import dotenv from 'dotenv';
import app from './app';
import { connectDatabase } from './database';
import { logger } from './utils/logger';

// 環境変数の読み込み
dotenv.config();

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer() {
    try {
        // データベース接続
        logger.info('🔌 Connecting to database...');
        await connectDatabase();
        logger.info('✅ Database connected successfully');

        // サーバー起動
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Server is running on port ${PORT}`);
            logger.info(`📱 Environment: ${NODE_ENV}`);
            logger.info(`🔧 API URL: http://localhost:${PORT}/api`);
            logger.info(`💡 Health check: http://localhost:${PORT}/health`);
            
            if (NODE_ENV === 'development') {
                logger.info(`🛠️ Dev tools available:`);
                logger.info(`   - API Explorer: http://localhost:${PORT}/api`);
                logger.info(`   - Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
            }
        });

        // Graceful shutdown
        const gracefulShutdown = (signal: string) => {
            logger.info(`📴 ${signal} received, shutting down gracefully...`);
            
            server.close(() => {
                logger.info('🔒 HTTP server closed');
                
                // データベース接続を閉じる
                // db.close() などの処理をここに追加
                
                logger.info('✅ Graceful shutdown completed');
                process.exit(0);
            });

            // 強制終了（30秒後）
            setTimeout(() => {
                logger.error('⚠️ Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 30000);
        };

        // シグナルハンドラー
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // アプリケーション固有のエラーハンドリング
        process.on('uncaughtException', (error) => {
            logger.error('💥 Uncaught Exception:', error);
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('UNHANDLED_REJECTION');
        });

    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// サーバー起動
startServer().catch((error) => {
    logger.error('❌ Server startup failed:', error);
    process.exit(1);
});

export default app;