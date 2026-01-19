import mysql from 'mysql2/promise';
import { logger } from './utils/logger';

export interface DatabaseConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    charset: string;
    timezone: string;
    acquireTimeout: number;
    timeout: number;
    reconnect: boolean;
    maxReconnects: number;
    reconnectDelay: number;
}

class DatabaseManager {
    private connection: mysql.Connection | null = null;
    private config: DatabaseConfig;

    constructor() {
        this.config = {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306', 10),
            user: process.env.DB_USER || 'cooking_user',
            password: process.env.DB_PASSWORD || 'cooking_password',
            database: process.env.DB_NAME || 'cooking_cost_system',
            charset: 'utf8mb4',
            timezone: '+09:00',
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true,
            maxReconnects: 3,
            reconnectDelay: 2000,
        };
    }

    async connect(): Promise<void> {
        try {
            this.connection = await mysql.createConnection({
                host: this.config.host,
                port: this.config.port,
                user: this.config.user,
                password: this.config.password,
                database: this.config.database,
                charset: this.config.charset,
                timezone: this.config.timezone,
                multipleStatements: false,
                connectTimeout: 60000,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
            });

            logger.info('✅ Database connected successfully', {
                host: this.config.host,
                database: this.config.database,
            });

            // 接続エラーハンドリング
            this.connection.on('error', (error: any) => {
                logger.error('Database connection error:', error);
                if (error.code === 'PROTOCOL_CONNECTION_LOST') {
                    this.handleDisconnect();
                } else {
                    throw error;
                }
            });

        } catch (error) {
            logger.error('❌ Database connection failed:', error);
            throw error;
        }
    }

    private async handleDisconnect(): Promise<void> {
        logger.warn('Database connection lost, attempting to reconnect...');

        for (let i = 0; i < this.config.maxReconnects; i++) {
            try {
                await new Promise(resolve => setTimeout(resolve, this.config.reconnectDelay));
                await this.connect();
                return;
            } catch (error) {
                logger.error(`Reconnection attempt ${i + 1} failed:`, error);
            }
        }

        logger.error('Max reconnection attempts reached. Database unavailable.');
        throw new Error('Database connection could not be restored');
    }

    async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
        if (!this.connection) {
            throw new Error('Database connection not established');
        }

        const startTime = Date.now();

        try {
            const [rows] = await this.connection.execute(sql, params);
            const duration = Date.now() - startTime;

            if (process.env.NODE_ENV === 'development' && duration > 100) {
                logger.warn('Slow query detected:', {
                    sql: sql.substring(0, 100) + '...',
                    duration: `${duration}ms`,
                    params: params?.length ? `[${params.length} params]` : 'no params',
                });
            }

            return rows as T[];
        } catch (error) {
            logger.error('Database query error:', {
                sql: sql.substring(0, 200),
                params,
                error: error instanceof Error ? error.message : error,
            });
            throw error;
        }
    }

    async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
        const results = await this.query<T>(sql, params);
        return results.length > 0 ? results[0] : null;
    }

    async transaction<T>(callback: (query: (sql: string, params?: any[]) => Promise<any[]>) => Promise<T>): Promise<T> {
        if (!this.connection) {
            throw new Error('Database connection not established');
        }

        await this.connection.beginTransaction();

        try {
            const transactionQuery = async (sql: string, params?: any[]) => {
                const [rows] = await this.connection!.execute(sql, params);
                return rows as any[];
            };

            const result = await callback(transactionQuery);
            await this.connection.commit();
            return result;
        } catch (error) {
            await this.connection.rollback();
            logger.error('Transaction rolled back:', error);
            throw error;
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.query('SELECT 1');
            return true;
        } catch (error) {
            logger.error('Connection test failed:', error);
            return false;
        }
    }

    async close(): Promise<void> {
        if (this.connection) {
            await this.connection.end();
            this.connection = null;
            logger.info('Database connection closed');
        }
    }
}

// シングルトンインスタンス
const dbManager = new DatabaseManager();

export const initializeDatabase = async (): Promise<void> => {
    await dbManager.connect();
};

export const getDatabase = (): DatabaseManager => dbManager;

export default dbManager;