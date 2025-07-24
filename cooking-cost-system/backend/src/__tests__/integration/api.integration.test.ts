import request from 'supertest';
import app from '../../app';
import { initializeDatabase, getDatabase } from '../../database';
import { createTestIngredient, createTestDish, createTestCompletedFood } from '../../../tests/utils/test-helpers';

describe('API Integration Tests', () => {
    let db: any;
    let authToken: string;

    beforeAll(async () => {
        // テスト用データベースの初期化
        await initializeDatabase();
        db = getDatabase();
        
        // テスト用認証トークンの取得
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'admin',
                password: 'admin123'
            });
        
        authToken = loginResponse.body.data.token;
    });

    afterAll(async () => {
        // テストデータのクリーンアップ
        if (db) {
            await db.close();
        }
    });

    beforeEach(async () => {
        // 各テスト前にデータベースをクリーンアップ
        await db.query('DELETE FROM food_dishes');
        await db.query('DELETE FROM completed_foods');
        await db.query('DELETE FROM dish_ingredients');
        await db.query('DELETE FROM dishes');
        await db.query('DELETE FROM ingredients');
        await db.query('DELETE FROM memos');
    });

    describe('完全なワークフロー統合テスト', () => {
        test('食材→料理→完成品の完全なフロー', async () => {
            // 1. 食材を作成
            const ingredient1Data = createTestIngredient({
                name: '豚バラ肉',
                store: 'スーパーマルエツ',
                quantity: 500,
                unit: 'g',
                price: 450,
                genre: 'meat'
            });

            const ingredient1Response = await request(app)
                .post('/api/ingredients')
                .send(ingredient1Data)
                .expect(201);

            const ingredient1 = ingredient1Response.body.data;
            expect(ingredient1.unit_price).toBe(0.9); // 450 / 500

            const ingredient2Data = createTestIngredient({
                name: '玉ねぎ',
                store: 'JA直売所',
                quantity: 3000,
                unit: 'g',
                price: 300,
                genre: 'vegetable'
            });

            const ingredient2Response = await request(app)
                .post('/api/ingredients')
                .send(ingredient2Data)
                .expect(201);

            const ingredient2 = ingredient2Response.body.data;
            expect(ingredient2.unit_price).toBe(0.1); // 300 / 3000

            // 2. 料理を作成
            const dishData = createTestDish({
                name: '豚の生姜焼き',
                genre: 'main',
                description: 'ご飯が進む定番の豚の生姜焼き',
                ingredients: [
                    {
                        ingredient_id: ingredient1.id,
                        used_quantity: 200
                    },
                    {
                        ingredient_id: ingredient2.id,
                        used_quantity: 100
                    }
                ]
            });

            const dishResponse = await request(app)
                .post('/api/dishes')
                .send(dishData)
                .expect(201);

            const dish = dishResponse.body.data;
            // 豚バラ肉200g(180円) + 玉ねぎ100g(10円) = 190円
            expect(dish.total_cost).toBe(190);

            // 3. 料理詳細を確認
            const dishDetailResponse = await request(app)
                .get(`/api/dishes/${dish.id}`)
                .expect(200);

            const dishDetail = dishDetailResponse.body.data;
            expect(dishDetail.ingredients).toHaveLength(2);
            expect(dishDetail.ingredients[0].ingredient_name).toBe('豚バラ肉');
            expect(dishDetail.ingredients[0].used_cost).toBe(180);

            // 4. 完成品を作成
            const completedFoodData = createTestCompletedFood({
                name: '生姜焼き定食',
                price: 850,
                description: '豚の生姜焼きの定食',
                dishes: [
                    {
                        dish_id: dish.id,
                        usage_quantity: 1,
                        usage_unit: 'serving',
                        description: '豚の生姜焼き 1人前'
                    }
                ]
            });

            const completedFoodResponse = await request(app)
                .post('/api/foods')
                .send(completedFoodData)
                .expect(201);

            const completedFood = completedFoodResponse.body.data;
            expect(completedFood.total_cost).toBe(190);
            expect(completedFood.profit).toBe(660); // 850 - 190
            expect(completedFood.profit_rate).toBeCloseTo(77.65, 2); // (660/850)*100

            // 5. 完成品詳細を確認
            const completedFoodDetailResponse = await request(app)
                .get(`/api/foods/${completedFood.id}`)
                .expect(200);

            const completedFoodDetail = completedFoodDetailResponse.body.data;
            expect(completedFoodDetail.dishes).toHaveLength(1);
            expect(completedFoodDetail.dishes[0].dish_name).toBe('豚の生姜焼き');
        });

        test('複数料理を使った完成品の作成', async () => {
            // 複数の食材を作成
            const ingredients = [];
            for (let i = 0; i < 4; i++) {
                const ingredientData = createTestIngredient({
                    name: `食材${i + 1}`,
                    store: 'テストスーパー',
                    quantity: 100,
                    unit: 'g',
                    price: 100,
                    genre: 'vegetable'
                });

                const response = await request(app)
                    .post('/api/ingredients')
                    .send(ingredientData)
                    .expect(201);

                ingredients.push(response.body.data);
            }

            // 複数の料理を作成
            const dishes = [];
            for (let i = 0; i < 2; i++) {
                const dishData = createTestDish({
                    name: `料理${i + 1}`,
                    genre: 'main',
                    ingredients: [
                        {
                            ingredient_id: ingredients[i * 2].id,
                            used_quantity: 50
                        },
                        {
                            ingredient_id: ingredients[i * 2 + 1].id,
                            used_quantity: 30
                        }
                    ]
                });

                const response = await request(app)
                    .post('/api/dishes')
                    .send(dishData)
                    .expect(201);

                dishes.push(response.body.data);
            }

            // 複数料理を使った完成品を作成
            const completedFoodData = createTestCompletedFood({
                name: 'セット料理',
                price: 1200,
                dishes: [
                    {
                        dish_id: dishes[0].id,
                        usage_quantity: 1,
                        usage_unit: 'serving'
                    },
                    {
                        dish_id: dishes[1].id,
                        usage_quantity: 0.5,
                        usage_unit: 'ratio'
                    }
                ]
            });

            const response = await request(app)
                .post('/api/foods')
                .send(completedFoodData)
                .expect(201);

            const completedFood = response.body.data;
            // 料理1: 50円+30円=80円, 料理2: (50円+30円)*0.5=40円, 合計120円
            expect(completedFood.total_cost).toBe(120);
        });
    });

    describe('検索・フィルタリング統合テスト', () => {
        beforeEach(async () => {
            // テスト用データをセットアップ
            const ingredients = [
                { name: '牛肉', genre: 'meat', price: 1000, quantity: 200 },
                { name: '豚肉', genre: 'meat', price: 500, quantity: 300 },
                { name: 'キャベツ', genre: 'vegetable', price: 200, quantity: 1000 },
                { name: '人参', genre: 'vegetable', price: 150, quantity: 500 }
            ];

            for (const ing of ingredients) {
                await request(app)
                    .post('/api/ingredients')
                    .send(createTestIngredient(ing))
                    .expect(201);
            }
        });

        test('食材の検索とフィルタリング', async () => {
            // 名前での検索
            const nameSearchResponse = await request(app)
                .get('/api/ingredients')
                .query({ name: '肉' })
                .expect(200);

            expect(nameSearchResponse.body.data).toHaveLength(2);
            expect(nameSearchResponse.body.data.every((item: any) => 
                item.name.includes('肉')
            )).toBe(true);

            // ジャンルでのフィルタリング
            const genreFilterResponse = await request(app)
                .get('/api/ingredients')
                .query({ genre: 'vegetable' })
                .expect(200);

            expect(genreFilterResponse.body.data).toHaveLength(2);
            expect(genreFilterResponse.body.data.every((item: any) => 
                item.genre === 'vegetable'
            )).toBe(true);

            // 価格範囲でのフィルタリング
            const priceFilterResponse = await request(app)
                .get('/api/ingredients')
                .query({ minPrice: 200, maxPrice: 600 })
                .expect(200);

            expect(priceFilterResponse.body.data).toHaveLength(2);
            expect(priceFilterResponse.body.data.every((item: any) => 
                item.price >= 200 && item.price <= 600
            )).toBe(true);
        });

        test('ソートとページネーション', async () => {
            // 価格昇順ソート
            const sortResponse = await request(app)
                .get('/api/ingredients')
                .query({ sortBy: 'price', sortOrder: 'ASC' })
                .expect(200);

            const prices = sortResponse.body.data.map((item: any) => item.price);
            expect(prices).toEqual([...prices].sort((a, b) => a - b));

            // ページネーション
            const paginationResponse = await request(app)
                .get('/api/ingredients')
                .query({ limit: 2, offset: 0 })
                .expect(200);

            expect(paginationResponse.body.data).toHaveLength(2);
        });
    });

    describe('エラーハンドリング統合テスト', () => {
        test('存在しないリソースへのアクセス', async () => {
            const response = await request(app)
                .get('/api/ingredients/999999')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('NOT_FOUND');
        });

        test('無効なデータでの作成', async () => {
            const invalidData = {
                name: '', // 空の名前
                store: 'テストスーパー',
                quantity: -1, // 負の数値
                unit: 'g',
                price: 0, // ゼロ価格
                genre: 'invalid' // 無効なジャンル
            };

            const response = await request(app)
                .post('/api/ingredients')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('BAD_REQUEST');
        });

        test('存在しない食材を使った料理の作成', async () => {
            const dishData = createTestDish({
                ingredients: [
                    {
                        ingredient_id: 999999, // 存在しないID
                        used_quantity: 100
                    }
                ]
            });

            const response = await request(app)
                .post('/api/dishes')
                .send(dishData)
                .expect(500);

            expect(response.body.success).toBe(false);
        });
    });

    describe('レポート・統計統合テスト', () => {
        beforeEach(async () => {
            // テスト用のデータセットアップ
            const ingredientResponse = await request(app)
                .post('/api/ingredients')
                .send(createTestIngredient({
                    name: '豚肉',
                    genre: 'meat',
                    price: 500,
                    quantity: 200
                }))
                .expect(201);

            const dishResponse = await request(app)
                .post('/api/dishes')
                .send(createTestDish({
                    name: '豚の生姜焼き',
                    ingredients: [{
                        ingredient_id: ingredientResponse.body.data.id,
                        used_quantity: 100
                    }]
                }))
                .expect(201);

            await request(app)
                .post('/api/foods')
                .send(createTestCompletedFood({
                    name: '生姜焼き定食',
                    price: 800,
                    dishes: [{
                        dish_id: dishResponse.body.data.id,
                        usage_quantity: 1,
                        usage_unit: 'serving'
                    }]
                }))
                .expect(201);
        });

        test('ダッシュボード統計の取得', async () => {
            const response = await request(app)
                .get('/api/reports/dashboard')
                .expect(200);

            expect(response.body.data.summary).toHaveProperty('totalIngredients');
            expect(response.body.data.summary).toHaveProperty('totalDishes');
            expect(response.body.data.summary).toHaveProperty('totalCompletedFoods');
            expect(response.body.data.summary).toHaveProperty('avgProfitRate');
            expect(response.body.data).toHaveProperty('recentActivity');
        });

        test('ジャンル別統計の取得', async () => {
            const response = await request(app)
                .get('/api/reports/genre-stats')
                .expect(200);

            expect(response.body.data).toHaveProperty('ingredients');
            expect(response.body.data).toHaveProperty('dishes');
            expect(Array.isArray(response.body.data.ingredients)).toBe(true);
        });
    });

    describe('メモ機能統合テスト', () => {
        test('メモのCRUD操作', async () => {
            // メモ作成
            const createResponse = await request(app)
                .post('/api/memo')
                .send({
                    content: 'テスト用のメモです'
                })
                .expect(201);

            const memoId = createResponse.body.data.id;
            expect(createResponse.body.data.content).toBe('テスト用のメモです');

            // メモ一覧取得
            const listResponse = await request(app)
                .get('/api/memo')
                .expect(200);

            expect(listResponse.body.data).toHaveLength(1);
            expect(listResponse.body.data[0].id).toBe(memoId);

            // メモ更新
            const updateResponse = await request(app)
                .put(`/api/memo/${memoId}`)
                .send({
                    content: '更新されたメモです'
                })
                .expect(200);

            expect(updateResponse.body.data.content).toBe('更新されたメモです');

            // メモ削除
            await request(app)
                .delete(`/api/memo/${memoId}`)
                .expect(200);

            // 削除確認
            const finalListResponse = await request(app)
                .get('/api/memo')
                .expect(200);

            expect(finalListResponse.body.data).toHaveLength(0);
        });
    });

    describe('パフォーマンステスト', () => {
        test('大量データの処理', async () => {
            const startTime = Date.now();

            // 100個の食材を作成
            const createPromises = Array.from({ length: 100 }, (_, i) =>
                request(app)
                    .post('/api/ingredients')
                    .send(createTestIngredient({
                        name: `食材${i + 1}`,
                        price: 100 + i,
                        quantity: 100 + i
                    }))
            );

            await Promise.all(createPromises);
            const creationTime = Date.now() - startTime;

            // 作成時間が合理的な範囲内であることを確認
            expect(creationTime).toBeLessThan(30000); // 30秒以内

            // 一覧取得のパフォーマンステスト
            const listStartTime = Date.now();
            const listResponse = await request(app)
                .get('/api/ingredients')
                .expect(200);
            const listTime = Date.now() - listStartTime;

            expect(listResponse.body.data).toHaveLength(100);
            expect(listTime).toBeLessThan(5000); // 5秒以内
        }, 60000); // テストタイムアウトを60秒に設定
    });
});
