// ================================
// テスト環境セットアップ
// ================================

import 'reflect-metadata';
import { jest } from '@jest/globals';

// 環境変数の設定
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_NAME = 'cooking_cost_system_test';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.LOG_LEVEL = 'error';

// ================================
// グローバルモック設定
// ================================

// Winstonロガーのモック
jest.mock('../src/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        http: jest.fn(),
    },
    requestLogger: jest.fn((req, res, next) => next()),
    debugLogger: {
        query: jest.fn(),
        api: jest.fn(),
        performance: jest.fn(),
    },
}));

// データベース接続のモック
jest.mock('../src/database', () => ({
    initializeDatabase: jest.fn().mockResolvedValue(undefined),
    getDatabase: jest.fn(() => ({
        query: jest.fn().mockResolvedValue([]),
        queryOne: jest.fn().mockResolvedValue(null),
        transaction: jest.fn().mockImplementation((callback) => callback(jest.fn())),
        testConnection: jest.fn().mockResolvedValue(true),
        close: jest.fn().mockResolvedValue(undefined),
    })),
}));

// ファイルシステムのモック
jest.mock('fs/promises', () => ({
    access: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn().mockResolvedValue([]),
    stat: jest.fn().mockResolvedValue({
        size: 1024,
        birthtime: new Date(),
        mtime: new Date(),
    }),
    unlink: jest.fn().mockResolvedValue(undefined),
}));

// Multerのモック
jest.mock('multer', () => {
    const multer = jest.fn(() => ({
        single: jest.fn(() => (req: any, res: any, next: any) => {
            req.file = {
                filename: 'test-file.jpg',
                originalname: 'test.jpg',
                size: 1024,
                mimetype: 'image/jpeg',
                path: '/test/path/test-file.jpg',
            };
            next();
        }),
        array: jest.fn(() => (req: any, res: any, next: any) => {
            req.files = [
                {
                    filename: 'test-file-1.jpg',
                    originalname: 'test1.jpg',
                    size: 1024,
                    mimetype: 'image/jpeg',
                    path: '/test/path/test-file-1.jpg',
                },
            ];
            next();
        }),
    }));
    
    (multer as any).diskStorage = jest.fn(() => ({}));
    return multer;
});

// ================================
// テストユーティリティ関数
// ================================

// モックリクエストオブジェクトの作成
export const createMockRequest = (overrides: any = {}) => {
    return {
        method: 'GET',
        url: '/test',
        originalUrl: '/test',
        ip: '127.0.0.1',
        get: jest.fn((header: string) => {
            const headers: Record<string, string> = {
                'User-Agent': 'Jest Test Agent',
                'Content-Type': 'application/json',
            };
            return headers[header];
        }),
        body: {},
        params: {},
        query: {},
        headers: {},
        ...overrides,
    };
};

// モックレスポンスオブジェクトの作成
export const createMockResponse = () => {
    const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
        get: jest.fn(),
        on: jest.fn(),
        statusCode: 200,
    };
    return res;
};

// モック next 関数の作成
export const createMockNext = () => jest.fn();

// ================================
// データベーステストユーティリティ
// ================================

export const mockDatabase = {
    // 食材のモックデータ
    ingredients: [
        {
            id: 1,
            name: '豚バラ肉',
            store: 'スーパーマルエツ',
            quantity: 500.00,
            unit: 'g',
            price: 450.00,
            unit_price: 0.9000,
            genre: 'meat',
            created_at: new Date(),
            updated_at: new Date(),
        },
        {
            id: 2,
            name: '玉ねぎ',
            store: 'JA直売所',
            quantity: 3000.00,
            unit: 'g',
            price: 300.00,
            unit_price: 0.1000,
            genre: 'vegetable',
            created_at: new Date(),
            updated_at: new Date(),
        },
    ],

    // 料理のモックデータ
    dishes: [
        {
            id: 1,
            name: '豚の生姜焼き',
            total_cost: 238.00,
            genre: 'main',
            description: 'ご飯が進む定番の豚の生姜焼き',
            created_at: new Date(),
            updated_at: new Date(),
        },
    ],

    // 完成品のモックデータ
    completedFoods: [
        {
            id: 1,
            name: '定食A（生姜焼き定食）',
            price: 850.00,
            total_cost: 283.35,
            description: '豚の生姜焼き、味噌汁、サラダのセット',
            created_at: new Date(),
            updated_at: new Date(),
        },
    ],

    // メモのモックデータ
    memos: [
        {
            id: 1,
            content: '今月の目標：食材ロス率を5%以下に抑える',
            created_at: new Date(),
            updated_at: new Date(),
        },
    ],
};

// ================================
// APIテストユーティリティ
// ================================

export const createSuccessResponse = <T>(data: T, message?: string) => ({
    success: true,
    data,
    message,
    timestamp: expect.any(String),
});

export const createErrorResponse = (error: string, message: string, statusCode?: number) => ({
    success: false,
    error,
    message,
    timestamp: expect.any(String),
    path: expect.any(String),
    method: expect.any(String),
});

// ================================
// カスタムマッチャー
// ================================

// レスポンス形式のカスタムマッチャー
expect.extend({
    toBeSuccessResponse(received, data) {
        const pass = 
            received.success === true &&
            received.timestamp &&
            (data ? JSON.stringify(received.data) === JSON.stringify(data) : true);

        if (pass) {
            return {
                message: () => `expected ${JSON.stringify(received)} not to be a success response`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${JSON.stringify(received)} to be a success response`,
                pass: false,
            };
        }
    },

    toBeErrorResponse(received, error) {
        const pass = 
            received.success === false &&
            received.error &&
            received.message &&
            received.timestamp &&
            (error ? received.error === error : true);

        if (pass) {
            return {
                message: () => `expected ${JSON.stringify(received)} not to be an error response`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${JSON.stringify(received)} to be an error response`,
                pass: false,
            };
        }
    },
});

// ================================
// TypeScript型定義拡張
// ================================

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeSuccessResponse(data?: any): R;
            toBeErrorResponse(error?: string): R;
        }
    }
}

// ================================
// テスト後のクリーンアップ
// ================================

afterEach(() => {
    // 全てのモックをクリア
    jest.clearAllMocks();
});

afterAll(async () => {
    // テスト完了後のクリーンアップ
    if (global.gc) {
        global.gc();
    }
});

// ================================
// エクスポート
// ================================

export default {
    createMockRequest,
    createMockResponse,
    createMockNext,
    mockDatabase,
    createSuccessResponse,
    createErrorResponse,
};
