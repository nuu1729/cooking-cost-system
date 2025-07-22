import dotenv from 'dotenv';
import path from 'path';

// 環境変数の読み込み
dotenv.config({ path: path.join(__dirname, '../.env') });

import app from './app';
import { connectDatabase } from './database';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * サーバー起動処理
 */
async function startServer() {
    try {
        // データベース接続
        logger.info('データベースに接続中...');
        await connectDatabase();
        logger.info('✅ データベース接続成功');

        // サーバー起動
        const server = app.listen(PORT, () => {
            logger.info(`
🍽️ 料理原価計算システム v2.0 - Backend API
=========================================
🚀 サーバー起動完了
📍 URL: http://localhost:${PORT}
🌍 環境: ${NODE_ENV}
📊 ヘルスチェック: http://localhost:${PORT}/health
📋 API情報: http://localhost:${PORT}/api
⏰ 起動時刻: ${new Date().toLocaleString('ja-JP')}
            `);
        });

        // サーバーのタイムアウト設定
        server.timeout = 30000; // 30秒

        // Graceful shutdown
        const gracefulShutdown = () => {
            logger.info('🔄 Graceful shutdown開始...');
            server.close(() => {
                logger.info('✅ HTTP サーバーを閉じました');
                // データベース接続も閉じる場合はここに追加
                process.exit(0);
            });

            // 強制終了のタイムアウト（30秒）
            setTimeout(() => {
                logger.error('❌ 強制終了します');
                process.exit(1);
            }, 30000);
        };

        // シグナルハンドラーの設定
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

        // プロセス例外ハンドラー
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            gracefulShutdown();
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown();
        });

        return server;

    } catch (error) {
        logger.error('❌ サーバー起動エラー:', error);
        process.exit(1);
    }
}

// サーバー起動実行（直接実行時のみ）
if (require.main === module) {
    startServer().catch((error) => {
        logger.error('❌ サーバー起動失敗:', error);
        process.exit(1);
    });
}

export { startServer };
export default app;