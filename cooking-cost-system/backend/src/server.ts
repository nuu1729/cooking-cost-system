import dotenv from 'dotenv';
import App from './app';
import { logger } from './utils/logger';
import { initializeDatabase } from './database';

// 環境変数の読み込み
dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

// 未処理の例外をキャッチ
process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// 未処理のPromise拒否をキャッチ
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// グレースフルシャットダウン
process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

async function startServer() {
    try {
        // データベース初期化
        await initializeDatabase();

        // Express アプリケーション起動
        const appInstance = new App();
        const app = appInstance.getApp();
        app.listen(PORT);

        logger.info(`🚀 Server is running on http://${HOST}:${PORT}`, {
            environment: process.env.NODE_ENV || 'development',
            port: PORT,
            host: HOST,
            pid: process.pid,
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();