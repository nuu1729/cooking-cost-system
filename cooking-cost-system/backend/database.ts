import mysql from 'mysql2/promise';
import { logger } from './utils/logger';

export interface DatabaseConfig {
    host: string;
    user: string;
    password: string;
    database: string;
    port: number;
    connectionLimit: number;
    acquireTimeout: number;
    timeout: number;
    reconnect: boolean;
    charset: string;
}

// データベース設定
const config: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'cooking_user',
    password: process.env.DB_PASSWORD || 'cooking_password',
    database: process.env.DB_NAME || 'cooking_cost_system',
    port: parseInt(process.env.DB_PORT || '3306'),
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'),
    timeout: parseInt(process.env.DB_TIMEOUT || '60000'),
    reconnect: true,
    charset: 'utf8mb4'
};

// コネクションプール
let pool: mysql.Pool;

/**
 * データベースに接続
 */
export async function connectDatabase(): Promise<void> {
    try {
        // コネクションプールを作成
        pool = mysql.createPool({
            ...config,
            waitForConnections: true,
            queueLimit: 0,
            dateStrings: true,
            timezone: '+09:00'
        });

        // 接続テスト
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();

        logger.info('✅ データベース接続プール作成完了', {
            host: config.host,
            database: config.database,
            connectionLimit: config.connectionLimit
        });

    } catch (error) {
        logger.error('❌ データベース接続エラー:', error);
        throw error;
    }
}

/**
 * データベースプールを取得
 */
export function getPool(): mysql.Pool {
    if (!pool) {
        throw new Error('データベースプールが初期化されていません');
    }
    return pool;
}

/**
 * 単一クエリ実行
 */
export async function query<T = any>(
    sql: string, 
    params?: any[]
): Promise<T[]> {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows as T[];
    } catch (error) {
        logger.error('データベースクエリエラー:', { sql, params, error });
        throw error;
    }
}

/**
 * 単一行取得
 */
export async function queryOne<T = any>(
    sql: string, 
    params?: any[]
): Promise<T | null> {
    const rows = await query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
}

/**
 * INSERT実行（IDを返す）
 */
export async function insert(
    sql: string, 
    params?: any[]
): Promise<number> {
    try {
        const [result] = await pool.execute(sql, params) as any;
        return result.insertId;
    } catch (error) {
        logger.error('INSERT エラー:', { sql, params, error });
        throw error;
    }
}

/**
 * UPDATE/DELETE実行（影響行数を返す）
 */
export async function execute(
    sql: string, 
    params?: any[]
): Promise<number> {
    try {
        const [result] = await pool.execute(sql, params) as any;
        return result.affectedRows;
    } catch (error) {
        logger.error('UPDATE/DELETE エラー:', { sql, params, error });
        throw error;
    }
}

/**
 * トランザクション実行
 */
export async function transaction<T>(
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
        logger.error('トランザクションエラー:', error);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * ページネーション用クエリ
 */
export async function queryWithPagination<T = any>(
    sql: string,
    countSql: string,
    params: any[] = [],
    page: number = 1,
    limit: number = 20
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
    
    // データ取得
    const paginatedSql = `${sql} LIMIT ? OFFSET ?`;
    const data = await query<T>(paginatedSql, [...params, limit, offset]);
    
    // 総件数取得
    const countResult = await queryOne<{ total: number }>(countSql, params);
    const total = countResult?.total || 0;
    
    const totalPages = Math.ceil(total / limit);
    
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    };
}

/**
 * バルクINSERT
 */
export async function bulkInsert(
    table: string,
    fields: string[],
    values: any[][]
): Promise<number> {
    if (values.length === 0) return 0;
    
    const placeholders = values.map(() => `(${fields.map(() => '?').join(', ')})`).join(', ');
    const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES ${placeholders}`;
    const flatValues = values.flat();
    
    try {
        const [result] = await pool.execute(sql, flatValues) as any;
        return result.affectedRows;
    } catch (error) {
        logger.error('バルクINSERTエラー:', { table, fields, error });
        throw error;
    }
}

/**
 * データベース統計情報を取得
 */
export async function getDatabaseStats(): Promise<any> {
    try {
        const tables = await query(`
            SELECT 
                TABLE_NAME as tableName,
                TABLE_ROWS as rowCount,
                DATA_LENGTH as dataSize,
                INDEX_LENGTH as indexSize
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ?
        `, [config.database]);
        
        return {
            database: config.database,
            tables,
            totalTables: tables.length
        };
    } catch (error) {
        logger.error('データベース統計取得エラー:', error);
        throw error;
    }
}

/**
 * データベース接続を閉じる
 */
export async function closeDatabase(): Promise<void> {
    if (pool) {
        await pool.end();
        logger.info('✅ データベース接続プールを閉じました');
    }
}

// プロセス終了時にコネクションプールを閉じる
process.on('SIGINT', async () => {
    await closeDatabase();
});

process.on('SIGTERM', async () => {
    await closeDatabase();
});

export default {
    connectDatabase,
    getPool,
    query,
    queryOne,
    insert,
    execute,
    transaction,
    queryWithPagination,
    bulkInsert,
    getDatabaseStats,
    closeDatabase
};