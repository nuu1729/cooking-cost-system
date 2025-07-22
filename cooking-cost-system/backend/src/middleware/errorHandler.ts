import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface CustomError extends Error {
    status?: number;
    statusCode?: number;
    code?: string;
    errno?: number;
    sqlMessage?: string;
    sql?: string;
    sqlState?: string;
}

interface ErrorResponse {
    success: false;
    error: string;
    message: string;
    details?: any;
    timestamp: string;
    path?: string;
    method?: string;
    requestId?: string;
}

// エラータイプの判定
const getErrorType = (error: CustomError): string => {
    if (error.code === 'ER_DUP_ENTRY') return 'DUPLICATE_ENTRY';
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return 'FOREIGN_KEY_CONSTRAINT';
    if (error.code === 'ER_ROW_IS_REFERENCED_2') return 'REFERENCED_ROW';
    if (error.code === 'ER_BAD_NULL_ERROR') return 'NULL_CONSTRAINT';
    if (error.code === 'ER_PARSE_ERROR') return 'SQL_SYNTAX_ERROR';
    if (error.code === 'ECONNREFUSED') return 'DATABASE_CONNECTION_ERROR';
    if (error.code === 'ENOTFOUND') return 'SERVICE_NOT_FOUND';
    if (error.name === 'ValidationError') return 'VALIDATION_ERROR';
    if (error.name === 'JsonWebTokenError') return 'JWT_ERROR';
    if (error.name === 'TokenExpiredError') return 'JWT_EXPIRED';
    if (error.name === 'MulterError') return 'FILE_UPLOAD_ERROR';
    return 'INTERNAL_ERROR';
};

// エラーメッセージの日本語化
const getJapaneseErrorMessage = (error: CustomError, errorType: string): string => {
    switch (errorType) {
        case 'DUPLICATE_ENTRY':
            if (error.sqlMessage?.includes('uk_ingredient')) {
                return 'この食材は既に登録されています（名前・店舗・単位の組み合わせが重複）';
            }
            return 'データが重複しています';
            
        case 'FOREIGN_KEY_CONSTRAINT':
            return '関連するデータが存在しないため、操作を実行できません';
            
        case 'REFERENCED_ROW':
            return 'このデータは他の場所で使用されているため削除できません';
            
        case 'NULL_CONSTRAINT':
            return '必須項目が入力されていません';
            
        case 'SQL_SYNTAX_ERROR':
            return 'データベースエラーが発生しました';
            
        case 'DATABASE_CONNECTION_ERROR':
            return 'データベースに接続できません';
            
        case 'SERVICE_NOT_FOUND':
            return 'サービスが見つかりません';
            
        case 'VALIDATION_ERROR':
            return '入力データが正しくありません';
            
        case 'JWT_ERROR':
            return '認証に失敗しました';
            
        case 'JWT_EXPIRED':
            return '認証の有効期限が切れています';
            
        case 'FILE_UPLOAD_ERROR':
            return 'ファイルのアップロードに失敗しました';
            
        default:
            return '内部エラーが発生しました';
    }
};

// HTTPステータスコードの決定
const getStatusCode = (error: CustomError, errorType: string): number => {
    if (error.status || error.statusCode) {
        return error.status || error.statusCode || 500;
    }
    
    switch (errorType) {
        case 'DUPLICATE_ENTRY':
        case 'VALIDATION_ERROR':
            return 400;
            
        case 'JWT_ERROR':
        case 'JWT_EXPIRED':
            return 401;
            
        case 'FOREIGN_KEY_CONSTRAINT':
        case 'REFERENCED_ROW':
            return 409;
            
        case 'SERVICE_NOT_FOUND':
            return 404;
            
        case 'FILE_UPLOAD_ERROR':
            return 413;
            
        case 'DATABASE_CONNECTION_ERROR':
            return 503;
            
        default:
            return 500;
    }
};

// 詳細エラー情報の生成（開発環境用）
const getErrorDetails = (error: CustomError, errorType: string) => {
    if (process.env.NODE_ENV === 'production') {
        return undefined;
    }
    
    return {
        type: errorType,
        name: error.name,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        stack: error.stack,
    };
};

// エラーログの記録
const logError = (error: CustomError, req: Request, errorType: string, statusCode: number) => {
    const logData = {
        error: {
            message: error.message,
            type: errorType,
            code: error.code,
            stack: error.stack,
        },
        request: {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            body: req.body,
            params: req.params,
            query: req.query,
        },
        statusCode,
        timestamp: new Date().toISOString(),
    };
    
    if (statusCode >= 500) {
        logger.error('Server Error', logData);
    } else {
        logger.warn('Client Error', logData);
    }
};

// メインのエラーハンドラー
export const errorHandler = (
    error: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errorType = getErrorType(error);
    const statusCode = getStatusCode(error, errorType);
    const message = getJapaneseErrorMessage(error, errorType);
    const details = getErrorDetails(error, errorType);
    
    // エラーログ記録
    logError(error, req, errorType, statusCode);
    
    // レスポンス生成
    const errorResponse: ErrorResponse = {
        success: false,
        error: errorType,
        message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method,
    };
    
    // 開発環境では詳細情報を追加
    if (details) {
        errorResponse.details = details;
    }
    
    // レスポンス送信
    res.status(statusCode).json(errorResponse);
};

// 非同期エラーハンドラー
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// 404エラーハンドラー
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    const error = new Error(`Route ${req.originalUrl} not found`) as CustomError;
    error.status = 404;
    next(error);
};

// バリデーションエラーハンドラー
export const validationErrorHandler = (errors: any[]) => {
    const error = new Error('Validation failed') as CustomError;
    error.name = 'ValidationError';
    error.status = 400;
    (error as any).validationErrors = errors;
    return error;
};

// カスタムエラークラス
export class AppError extends Error {
    public status: number;
    public type: string;
    public isOperational: boolean;
    
    constructor(message: string, status: number = 500, type: string = 'INTERNAL_ERROR') {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
        this.type = type;
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

// よく使うエラー
export class BadRequestError extends AppError {
    constructor(message: string = '不正なリクエストです') {
        super(message, 400, 'BAD_REQUEST');
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = '認証が必要です') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'アクセス権限がありません') {
        super(message, 403, 'FORBIDDEN');
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'リソースが見つかりません') {
        super(message, 404, 'NOT_FOUND');
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'データが競合しています') {
        super(message, 409, 'CONFLICT');
    }
}

export class TooManyRequestsError extends AppError {
    constructor(message: string = 'リクエストが多すぎます') {
        super(message, 429, 'TOO_MANY_REQUESTS');
    }
}

export class InternalServerError extends AppError {
    constructor(message: string = '内部サーバーエラーが発生しました') {
        super(message, 500, 'INTERNAL_SERVER_ERROR');
    }
}

export class ServiceUnavailableError extends AppError {
    constructor(message: string = 'サービスが利用できません') {
        super(message, 503, 'SERVICE_UNAVAILABLE');
    }
}

export default {
    errorHandler,
    asyncHandler,
    notFoundHandler,
    validationErrorHandler,
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    TooManyRequestsError,
    InternalServerError,
    ServiceUnavailableError,
};