import mysql from 'mysql2/promise';
import { logger } from './utils/logger';

interface DatabaseConfig {
    host: string;
    user: string;
    password: string;
    database: string;
    port: number;
    waitForConnections: boolean;
    connectionLimit: number;
    queueLimit: number;
    timeout: number;
    acquireTimeout: number;
    charset: string;
    timezone: string;
}

// データベース設定
const dbConfig: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'cooking_user',
    password: process.env.DB_PASSWORD || 'cooking_password',
    database: process.env.DB_NAME || 'cooking_cost_system',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timeout: 60000,
    acquireTimeout: 60000,
    charset: 'utf8mb4',
    timezone: '+09:00', // JST
};

// コネクションプール
let pool: mysql.Pool;

export async function connectDatabase(): Promise<void> {
    try {
        // プール作成
        pool = mysql.createPool(dbConfig);

        // 接続テスト
        const connection = await pool.getConnection();
        logger.info('🔗 Database connection established successfully');
        
        // データベース情報取得
        const [rows] = await connection.execute('SELECT VERSION() as version');
        const version = (rows as any)[0].version;
        logger.info(`📊 MySQL Version: ${version}`);

        // 文字セット確認
        const [charsetRows] = await connection.execute(
            'SELECT @@character_set_database as charset, @@collation_database as collation'
        );
        const { charset, collation } = (charsetRows as any)[0];
        logger.info(`🔤 Database charset: ${charset}, collation: ${collation}`);

        connection.release();

        // プールイベントリスナー
        pool.on('connection', (connection) => {
            logger.debug(`📡 New connection established as id ${connection.threadId}`);
        });

        pool.on('error', (error) => {
            logger.error('💥 Database pool error:', error);
            if (error.code === 'PROTOCOL_CONNECTION_LOST') {
                logger.warn('🔄 Database connection was closed, attempting to reconnect...');
                connectDatabase();
            } else {
                throw error;
            }
        });

    } catch (error) {
        logger.error('❌ Database connection failed:', error);
        throw error;
    }
}

export function getDatabase(): mysql.Pool {
    if (!pool) {
        throw new Error('Database not initialized. Call connectDatabase() first.');
    }
    return pool;
}

// トランザクション実行ヘルパー
export async function executeTransaction<T>(
    callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// クエリ実行ヘルパー
export async function executeQuery<T = any>(
    sql: string,
    params: any[] = []
): Promise<T[]> {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows as T[];
    } catch (error) {
        logger.error('Query execution failed:', { sql, params, error });
        throw error;
    }
}

// 単一行取得ヘルパー
export async function executeQueryOne<T = any>(
    sql: string,
    params: any[] = []
): Promise<T | null> {
    const rows = await executeQuery<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
}

// 挿入ヘルパー（ID返却）
export async function executeInsert(
    sql: string,
    params: any[] = []
): Promise<number> {
    try {
        const [result] = await pool.execute(sql, params);
        return (result as mysql.ResultSetHeader).insertId;
    } catch (error) {
        logger.error('Insert execution failed:', { sql, params, error });
        throw error;
    }
}

// 更新・削除ヘルパー（影響行数返却）
export async function executeUpdate(
    sql: string,
    params: any[] = []
): Promise<number> {
    try {
        const [result] = await pool.execute(sql, params);
        return (result as mysql.ResultSetHeader).affectedRows;
    } catch (error) {
        logger.error('Update execution failed:', { sql, params, error });
        throw error;
    }
}

// ページネーションヘルパー
export async function executePaginatedQuery<T = any>(
    sql: string,
    params: any[] = [],
    page: number = 1,
    limit: number = 10
): Promise<{
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}> {
    const offset = (page - 1) * limit;
    
    // 総件数取得
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as count_query`;
    const [countResult] = await executeQuery(countSql, params);
    const total = (countResult as any).total;
    
    // データ取得
    const dataSql = `${sql} LIMIT ? OFFSET ?`;
    const data = await executeQuery<T>(dataSql, [...params, limit, offset]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
}

// データベース統計情報取得
export async function getDatabaseStats() {
    try {
        const stats = await executeQuery(`
            SELECT 
                table_name,
                table_rows as row_count,
                ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb
            FROM information_schema.tables 
            WHERE table_schema = ? 
            ORDER BY size_mb DESC
        `, [process.env.DB_NAME]);

        return stats;
    } catch (error) {
        logger.error('Failed to get database stats:', error);
        return [];
    }
}

// 接続プールのステータス
export function getPoolStatus() {
    if (!pool) {
        return null;
    }

    const poolConfig = (pool as any).pool.config;
    const poolStats = (pool as any).pool;

    return {
        connectionLimit: poolConfig.connectionLimit,
        acquiredConnections: poolStats._acquiredConnections,
        allConnections: poolStats._allConnections?.length || 0,
        freeConnections: poolStats._freeConnections?.length || 0,
        queuedCallbacks: poolStats._connectionQueue?.length || 0,
    };
}

// データベース接続を閉じる
export async function closeDatabase(): Promise<void> {
    if (pool) {
        try {
            await pool.end();
            logger.info('📴 Database connection closed');
        } catch (error) {
            logger.error('❌ Error closing database connection:', error);
            throw error;
        }
    }
}

export default {
    connectDatabase,
    getDatabase,
    executeTransaction,
    executeQuery,
    executeQueryOne,
    executeInsert,
    executeUpdate,
    executePaginatedQuery,
    getDatabaseStats,
    getPoolStatus,
    closeDatabase,
};