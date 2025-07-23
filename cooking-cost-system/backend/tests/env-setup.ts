// ================================
// tests/env-setup.ts - 環境変数設定
// ================================

// テスト環境用の環境変数を設定
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

// データベース設定（テスト用）
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_NAME = 'cooking_cost_system_test';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';

// セキュリティ設定
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.CORS_ORIGIN = 'http://localhost:3000';

// ファイルアップロード設定
process.env.MAX_FILE_SIZE = '10485760';
process.env.UPLOAD_DIR = './test-uploads';

// ログ設定（テスト時は最小限に）
process.env.LOG_LEVEL = 'error';

// ================================
// tests/global-setup.ts - グローバルセットアップ
// ================================

import mysql from 'mysql2/promise';

export default async function globalSetup() {
    console.log('🧪 テスト環境のセットアップを開始します...');

    try {
        // テスト用データベースの作成
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: 'root',
            password: 'root_password',
        });

        // テスト用データベースが存在しない場合は作成
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
        await connection.execute(`GRANT ALL PRIVILEGES ON \`${process.env.DB_NAME}\`.* TO '${process.env.DB_USER}'@'%'`);
        await connection.execute('FLUSH PRIVILEGES');
        
        console.log('✅ テスト用データベースの準備が完了しました');
        await connection.end();

        // テスト用ディレクトリの作成
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const testDirs = [
            './test-uploads',
            './test-logs',
            './coverage'
        ];

        for (const dir of testDirs) {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
                console.log(`✅ テスト用ディレクトリを作成しました: ${dir}`);
            }
        }

        console.log('🎯 テスト環境のセットアップが完了しました');

    } catch (error) {
        console.error('❌ テスト環境のセットアップに失敗しました:', error);
        throw error;
    }
}

// ================================
// tests/global-teardown.ts - グローバルクリーンアップ
// ================================

import mysql from 'mysql2/promise';

export default async function globalTeardown() {
    console.log('🧹 テスト環境のクリーンアップを開始します...');

    try {
        // テスト用データベースのクリーンアップ
        if (process.env.NODE_ENV === 'test') {
            const connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '3306'),
                user: 'root',
                password: 'root_password',
            });

            // テスト用データベースを削除
            await connection.execute(`DROP DATABASE IF EXISTS \`${process.env.DB_NAME}\``);
            console.log('✅ テスト用データベースを削除しました');
            await connection.end();
        }

        // テスト用ファイルの削除
        const fs = await import('fs/promises');
        const path = await import('path');

        const testDirs = [
            './test-uploads',
            './test-logs'
        ];

        for (const dir of testDirs) {
            try {
                await fs.access(dir);
                const files = await fs.readdir(dir);
                
                // ディレクトリ内のファイルを削除
                for (const file of files) {
                    await fs.unlink(path.join(dir, file));
                }
                
                // 空のディレクトリを削除
                await fs.rmdir(dir);
                console.log(`✅ テスト用ディレクトリを削除しました: ${dir}`);
            } catch {
                // ディレクトリが存在しない場合は無視
            }
        }

        console.log('🎯 テスト環境のクリーンアップが完了しました');

    } catch (error) {
        console.error('❌ テスト環境のクリーンアップに失敗しました:', error);
        // クリーンアップの失敗はテストの失敗にしない
    }
}

// ================================
// tests/sample.test.ts - サンプルテスト
// ================================

import request from 'supertest';
import app from '../src/app';

describe('API Health Check', () => {
    test('GET /health should return health status', async () => {
        const response = await request(app)
            .get('/health')
            .expect(200);

        expect(response.body).toHaveProperty('message', 'OK');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('uptime');
    });

    test('GET / should return API information', async () => {
        const response = await request(app)
            .get('/')
            .expect(200);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('料理原価計算システム');
        expect(response.body).toHaveProperty('version');
        expect(response.body).toHaveProperty('status', 'running');
    });
});

describe('API Routes', () => {
    test('GET /api should return API information', async () => {
        const response = await request(app)
            .get('/api')
            .expect(200);

        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('version');
        expect(response.body).toHaveProperty('endpoints');
        expect(response.body.endpoints).toHaveProperty('ingredients');
        expect(response.body.endpoints).toHaveProperty('dishes');
        expect(response.body.endpoints).toHaveProperty('completedFoods');
    });

    test('GET /api/ingredients should return ingredients list', async () => {
        const response = await request(app)
            .get('/api/ingredients')
            .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/dishes should return dishes list', async () => {
        const response = await request(app)
            .get('/api/dishes')
            .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /nonexistent-route should return 404', async () => {
        const response = await request(app)
            .get('/nonexistent-route')
            .expect(404);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
    });
});

describe('Error Handling', () => {
    test('Invalid JSON should return 400', async () => {
        const response = await request(app)
            .post('/api/ingredients')
            .send('invalid json')
            .set('Content-Type', 'application/json')
            .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
    });

    test('Missing required fields should return validation error', async () => {
        const response = await request(app)
            .post('/api/ingredients')
            .send({})
            .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
    });
});

// ================================
// tests/utils/test-helpers.ts - テストヘルパー関数
// ================================

import { CreateIngredientRequest, CreateDishRequest, CreateCompletedFoodRequest } from '../src/types';

export const createTestIngredient = (overrides: Partial<CreateIngredientRequest> = {}): CreateIngredientRequest => ({
    name: 'テスト食材',
    store: 'テストスーパー',
    quantity: 100,
    unit: 'g',
    price: 200,
    genre: 'vegetable',
    ...overrides,
});

export const createTestDish = (overrides: Partial<CreateDishRequest> = {}): CreateDishRequest => ({
    name: 'テスト料理',
    genre: 'main',
    description: 'テスト用の料理です',
    ingredients: [
        {
            ingredient_id: 1,
            used_quantity: 50,
        },
    ],
    ...overrides,
});

export const createTestCompletedFood = (overrides: Partial<CreateCompletedFoodRequest> = {}): CreateCompletedFoodRequest => ({
    name: 'テスト完成品',
    price: 500,
    description: 'テスト用の完成品です',
    dishes: [
        {
            dish_id: 1,
            usage_quantity: 1,
            usage_unit: 'serving',
        },
    ],
    ...overrides,
});

export const createAuthHeaders = (token: string = 'test-token') => ({
    Authorization: `Bearer ${token}`,
});

export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const cleanupTestData = async () => {
    // テストデータのクリーンアップ処理
    // 実際の実装ではデータベースからテストデータを削除
};

export default {
    createTestIngredient,
    createTestDish,
    createTestCompletedFood,
    createAuthHeaders,
    waitFor,
    cleanupTestData,
};
