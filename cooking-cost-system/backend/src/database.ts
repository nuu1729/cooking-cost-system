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
                acquireTimeout: this.config.acquireTimeout,
                timeout: this.config.timeout,
                multipleStatements: false,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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

// --------------------------------

// backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ValidationError } from 'class-validator';

export interface ApiError extends Error {
    statusCode?: number;
    code?: string;
    details?: any;
}

export const errorHandler = (
    error: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // ログ出力
    const errorLog = {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
    };

    if (error.statusCode && error.statusCode < 500) {
        logger.warn('Client Error:', errorLog);
    } else {
        logger.error('Server Error:', errorLog);
    }

    // バリデーションエラー
    if (error.name === 'ValidationError' || Array.isArray((error as any).details)) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            error: 'VALIDATION_ERROR',
            details: (error as any).details || error.message,
            timestamp: new Date().toISOString(),
        });
    }

    // データベースエラー
    if ((error as any).code?.startsWith('ER_')) {
        const dbError = error as any;
        let message = 'Database error occurred';
        let statusCode = 500;

        switch (dbError.code) {
            case 'ER_DUP_ENTRY':
                message = 'Duplicate entry - resource already exists';
                statusCode = 409;
                break;
            case 'ER_NO_REFERENCED_ROW_2':
                message = 'Referenced resource not found';
                statusCode = 400;
                break;
            case 'ER_ROW_IS_REFERENCED_2':
                message = 'Cannot delete - resource is being used';
                statusCode = 400;
                break;
            case 'ER_BAD_NULL_ERROR':
                message = 'Required field is missing';
                statusCode = 400;
                break;
        }

        return res.status(statusCode).json({
            success: false,
            message,
            error: 'DATABASE_ERROR',
            code: dbError.code,
            timestamp: new Date().toISOString(),
        });
    }

    // HTTP エラー
    const statusCode = error.statusCode || 500;
    const errorCode = error.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');

    // 本番環境では詳細なエラー情報を隠す
    const responseError = process.env.NODE_ENV === 'production' 
        ? 'An error occurred while processing your request'
        : error.message;

    res.status(statusCode).json({
        success: false,
        message: responseError,
        error: errorCode,
        ...(process.env.NODE_ENV !== 'production' && { 
            stack: error.stack,
            details: error.details 
        }),
        timestamp: new Date().toISOString(),
    });
};

// 非同期エラー処理のためのラッパー
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// カスタムエラークラス
export class AppError extends Error {
    public statusCode: number;
    public code: string;
    public details?: any;

    constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
        super(message);
        this.statusCode = statusCode;
        this.code = code || 'CUSTOM_ERROR';
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

export class BadRequestError extends AppError {
    constructor(message: string = 'Bad request', details?: any) {
        super(message, 400, 'BAD_REQUEST', details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}