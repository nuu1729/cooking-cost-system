import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ErrorResponse } from '../types';

// カスタムエラークラス
export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;
    public code?: string;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.name = this.constructor.name;

        Error.captureStackTrace(this, this.constructor);
    }
}

// バリデーションエラークラス
export class ValidationError extends AppError {
    public details: Array<{ field: string; message: string; value?: any }>;

    constructor(message: string, details: Array<{ field: string; message: string; value?: any }> = []) {
        super(message, 400);
        this.details = details;
        this.code = 'VALIDATION_ERROR';
    }
}

// 未認証エラークラス
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401);
        this.code = 'UNAUTHORIZED';
    }
}

// 権限不足エラークラス
export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 403);
        this.code = 'FORBIDDEN';
    }
}

// 見つからないエラークラス
export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(message, 404);
        this.code = 'NOT_FOUND';
    }
}

// 不正なリクエストエラークラス
export class BadRequestError extends AppError {
    constructor(message: string = 'Bad Request') {
        super(message, 400);
        this.code = 'BAD_REQUEST';
    }
}

// 競合エラークラス
export class ConflictError extends AppError {
    constructor(message: string = 'Resource conflict') {
        super(message, 409);
        this.code = 'CONFLICT';
    }
}

// レート制限エラークラス
export class RateLimitError extends AppError {
    constructor(message: string = 'Too many requests') {
        super(message, 429);
        this.code = 'RATE_LIMIT_EXCEEDED';
    }
}

// データベースエラーハンドラー
const handleDatabaseError = (error: any): AppError => {
    let message = 'Database operation failed';
    let statusCode = 500;

    // MySQL エラーコード別処理
    switch (error.code) {
        case 'ER_DUP_ENTRY':
            message = 'Duplicate entry detected';
            statusCode = 409;
            break;
        case 'ER_NO_REFERENCED_ROW_2':
            message = 'Referenced record not found';
            statusCode = 400;
            break;
        case 'ER_ROW_IS_REFERENCED_2':
            message = 'Cannot delete record because it is referenced by other records';
            statusCode = 400;
            break;
        case 'ER_DATA_TOO_LONG':
            message = 'Data too long for column';
            statusCode = 400;
            break;
        case 'ER_BAD_NULL_ERROR':
            message = 'Required field cannot be null';
            statusCode = 400;
            break;
        case 'ECONNREFUSED':
            message = 'Database connection refused';
            statusCode = 503;
            break;
        case 'PROTOCOL_CONNECTION_LOST':
            message = 'Database connection lost';
            statusCode = 503;
            break;
        default:
            message = 'Database error occurred';
    }

    return new AppError(message, statusCode);
};

// JWTエラーハンドラー
const handleJWTError = (error: any): AppError => {
    if (error.name === 'JsonWebTokenError') {
        return new UnauthorizedError('Invalid token');
    }
    if (error.name === 'TokenExpiredError') {
        return new UnauthorizedError('Token expired');
    }
    return new UnauthorizedError('Authentication failed');
};

// バリデーションエラーハンドラー
const handleValidationError = (error: any): ValidationError => {
    const details = error.details?.map((detail: any) => ({
        field: detail.path?.join('.') || detail.context?.key || 'unknown',
        message: detail.message,
        value: detail.context?.value,
    })) || [];

    return new ValidationError('Validation failed', details);
};

// 開発環境用エラーレスポンス
const sendErrorDev = (err: AppError, req: Request, res: Response) => {
    const errorResponse: ErrorResponse = {
        success: false,
        error: err.name || 'Error',
        message: err.message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method,
    };

    // バリデーションエラーの場合は詳細情報を追加
    if (err instanceof ValidationError) {
        errorResponse.details = err.details;
    }

    // 開発環境では追加情報を含める
    if (process.env.NODE_ENV === 'development') {
        (errorResponse as any).stack = err.stack;
        (errorResponse as any).code = err.code;
    }

    res.status(err.statusCode).json(errorResponse);
};

// 本番環境用エラーレスポンス
const sendErrorProd = (err: AppError, req: Request, res: Response) => {
    // 運用上のエラーのみクライアントに詳細を送信
    if (err.isOperational) {
        const errorResponse: ErrorResponse = {
            success: false,
            error: err.code || 'Error',
            message: err.message,
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method,
        };

        // バリデーションエラーの場合は詳細情報を追加
        if (err instanceof ValidationError) {
            errorResponse.details = err.details;
        }

        res.status(err.statusCode).json(errorResponse);
    } else {
        // プログラミングエラーの場合は一般的なメッセージを送信
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Something went wrong',
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method,
        });
    }
};

// メインエラーハンドラー
export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let error = { ...err };
    error.message = err.message;

    // エラーログ出力
    logger.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body,
        params: req.params,
        query: req.query,
    });

    // 既にAppErrorインスタンスの場合はそのまま処理
    if (err instanceof AppError) {
        error = err;
    }
    // データベースエラーの処理
    else if (err.code && (err.code.startsWith('ER_') || err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST')) {
        error = handleDatabaseError(err);
    }
    // JWTエラーの処理
    else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        error = handleJWTError(err);
    }
    // バリデーションエラーの処理
    else if (err.name === 'ValidationError' && err.details) {
        error = handleValidationError(err);
    }
    // SyntaxErrorの処理（JSONパースエラーなど）
    else if (err instanceof SyntaxError && 'body' in err) {
        error = new AppError('Invalid JSON format', 400);
    }
    // その他の未知のエラー
    else {
        error = new AppError('Internal server error', 500, false);
    }

    // 環境に応じてエラーレスポンスを送信
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(error, req, res);
    } else {
        sendErrorProd(error, req, res);
    }
};

// 404ハンドラー
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
    const error = new NotFoundError(`Route ${req.originalUrl} not found`);
    next(error);
};

// 非同期エラーキャッチャー
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// グローバル例外ハンドラー
export const setupGlobalErrorHandlers = (): void => {
    // 未処理のPromise拒否
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
        logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        // アプリケーションを終了（本番環境では適切な処理を実装）
        process.exit(1);
    });

    // 未処理の例外
    process.on('uncaughtException', (error: Error) => {
        logger.error('Uncaught Exception:', error);
        process.exit(1);
    });

    // プロセス終了シグナル
    process.on('SIGTERM', () => {
        logger.info('SIGTERM received, shutting down gracefully');
        process.exit(0);
    });

    process.on('SIGINT', () => {
        logger.info('SIGINT received, shutting down gracefully');
        process.exit(0);
    });
};

export {
    AppError as default,
};