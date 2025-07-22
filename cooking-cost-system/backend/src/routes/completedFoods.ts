import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { 
    executeQuery, 
    executeQueryOne, 
    executeInsert, 
    executeUpdate,
    executePaginatedQuery,
    executeTransaction 
} from '../database';
import { asyncHandler, validationErrorHandler, NotFoundError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// バリデーションルール
const createCompletedFoodValidation = [
    body('name')
        .notEmpty()
        .withMessage('完成品名は必須です')
        .isLength({ max: 255 })
        .withMessage('完成品名は255文字以下で入力してください'),
    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('販売価格は0以上の数値で入力してください'),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('説明は1000文字以下で入力してください'),
    body('dishes')
        .isArray({ min: 1 })
        .withMessage('料理を1つ以上選択してください'),
    body('dishes.*.dish_id')
        .isInt({ min: 1 })
        .withMessage('正しい料理IDを指定してください'),
    body('dishes.*.usage_quantity')
        .isFloat({ min: 0.01 })
        .withMessage('使用量は0.01以上の数値で入力してください'),
    body('dishes.*.usage_unit')
        .isIn(['ratio', 'serving'])
        .withMessage('使用単位は ratio または serving を指定してください'),
    body('dishes.*.description')
        .optional()
        .isLength({ max: 255 })
        .withMessage('説明は255文字以下で入力してください'),
];

const updateCompletedFoodValidation = [
    param('id').isInt({ min: 1 }).withMessage('正しいIDを指定してください'),
    body('name')
        .optional()
        .isLength({ max: 255 })
        .withMessage('完成品名は255文字以下で入力してください'),
    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('販売価格は0以上の数値で入力してください'),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('説明は1000文字以下で入力してください'),
    body('dishes')
        .optional()
        .isArray({ min: 1 })
        .withMessage('料理を1つ以上選択してください'),
];

const searchValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('ページは1以上の整数で入力してください'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('取得件数は1〜100の整数で入力してください'),
    query('name').optional().isLength({ max: 255 }).withMessage('完成品名は255文字以下で入力してください'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('最小価格は0以上の数値で入力してください'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('最大価格は0以上の数値で入力してください'),
    query('minCost').optional().isFloat({ min: 0 }).withMessage('最小コストは0以上の数値で入力してください'),
    query('maxCost').optional().isFloat({ min: 0 }).withMessage('最大コストは0以上の数値で入力してください'),
    query('sortBy').optional().isIn(['name', 'price', 'total_cost', 'created_at']).withMessage('正しいソート項目を選択してください'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('ソート順序はascまたはdescを指定してください'),
];

// バリデーションエラーチェック
const checkValidation = (req: Request, res: Response, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw validationErrorHandler(errors.array());
    }
    next();
};

// 完成品一覧取得 (GET /api/foods)
router.get('/', searchValidation, checkValidation, asyncHandler(async (req: Request, res: Response) => {
    const {
        page = 1,
        limit = 20,
        name,
        minPrice,
        maxPrice,
        minCost,
        maxCost,
        sortBy = 'created_at',
        sortOrder = 'desc'
    } = req.query;

    // 検索条件構築
    const conditions: string[] = [];
    const params: any[] = [];

    if (name) {
        conditions.push('cf.name LIKE ?');
        params.push(`%${name}%`);
    }

    if (minPrice) {
        conditions.push('cf.price >= ?');
        params.push(minPrice);
    }

    if (maxPrice) {
        conditions.push('cf.price <= ?');
        params.push(maxPrice);
    }

    if (minCost) {
        conditions.push('cf.total_cost >= ?');
        params.push(minCost);
    }

    if (maxCost) {
        conditions.push('cf.total_cost <= ?');
        params.push(maxCost);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = `ORDER BY cf.${sortBy} ${sortOrder}`;

    const sql = `
        SELECT 
            cf.id,
            cf.name,
            cf.price,
            cf.total_cost,
            cf.description,
            cf.created_at,
            cf.updated_at,
            COUNT(fd.dish_id) as dish_count,
            CASE 
                WHEN cf.price IS NOT NULL AND cf.price > 0 
                THEN cf.price - cf.total_cost 
                ELSE NULL 
            END as profit,
            CASE 
                WHEN cf.price IS NOT NULL AND cf.price > 0 
                THEN ROUND(((cf.price - cf.total_cost) / cf.price) * 100, 2)
                ELSE NULL 
            END as profit_rate
        FROM completed_foods cf
        LEFT JOIN food_dishes fd ON cf.id = fd.food_id
        ${whereClause}
        GROUP BY cf.id
        ${orderClause}
    `;

    const result = await executePaginatedQuery(
        sql,
        params,
        Number(page),
        Number(limit)
    );

    logger.info('Completed foods retrieved', {
        count: result.data.length,
        page: result.pagination.page,
        filters: { name, minPrice, maxPrice, minCost, maxCost }
    });

    res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
    });
}));

// 完成品詳細取得 (GET /api/foods/:id)
router.get('/:id', 
    param('id').isInt({ min: 1 }).withMessage('正しいIDを指定してください'),
    checkValidation,
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        // 完成品基本情報取得
        const completedFood = await executeQueryOne(`
            SELECT 
                id,
                name,
                price,
                total_cost,
                description,
                created_at,
                updated_at,
                CASE 
                    WHEN price IS NOT NULL AND price > 0 
                    THEN price - total_cost 
                    ELSE NULL 
                END as profit,
                CASE 
                    WHEN price IS NOT NULL AND price > 0 
                    THEN ROUND(((price - total_cost) / price) * 100, 2)
                    ELSE NULL 
                END as profit_rate
            FROM completed_foods 
            WHERE id = ?
        `, [id]);

        if (!completedFood) {
            throw new NotFoundError('指定された完成品が見つかりません');
        }

        // 完成品の料理情報取得
        const dishes = await executeQuery(`
            SELECT 
                fd.dish_id,
                fd.usage_quantity,
                fd.usage_unit,
                fd.usage_cost,
                fd.description as usage_description,
                d.name as dish_name,
                d.total_cost as dish_total_cost,
                d.genre as dish_genre
            FROM food_dishes fd
            JOIN dishes d ON fd.dish_id = d.id
            WHERE fd.food_id = ?
            ORDER BY fd.created_at
        `, [id]);

        // 各料理の食材詳細も取得
        const detailedDishes = await Promise.all(dishes.map(async (dish: any) => {
            const ingredients = await executeQuery(`
                SELECT 
                    i.name as ingredient_name,
                    i.genre as ingredient_genre,
                    di.used_quantity,
                    di.used_cost
                FROM dish_ingredients di
                JOIN ingredients i ON di.ingredient_id = i.id
                WHERE di.dish_id = ?
            `, [dish.dish_id]);

            return {
                ...dish,
                ingredients
            };
        }));

        res.json({
            success: true,
            data: {
                ...completedFood,
                dishes: detailedDishes
            },
            timestamp: new Date().toISOString(),
        });
    })
);

// 完成品作成 (POST /api/foods)
router.post('/', createCompletedFoodValidation, checkValidation, asyncHandler(async (req: Request, res: Response) => {
    const { name, price, description, dishes } = req.body;

    const result = await executeTransaction(async (connection) => {
        // 料理の存在確認とコスト取得
        const dishIds = dishes.map((dish: any) => dish.dish_id);
        const placeholders = dishIds.map(() => '?').join(',');
        
        const [dishRows] = await connection.execute(`
            SELECT id, total_cost 
            FROM dishes 
            WHERE id IN (${placeholders})
        `, dishIds);

        const dishMap = new Map();
        (dishRows as any[]).forEach(dish => {
            dishMap.set(dish.id, dish.total_cost);
        });

        // 総コスト計算
        let totalCost = 0;
        const foodDishes = dishes.map((dish: any) => {
            const dishTotalCost = dishMap.get(dish.dish_id);
            if (!dishTotalCost) {
                throw new Error(`料理ID ${dish.dish_id} が見つかりません`);
            }
            
            let usageCost;
            if (dish.usage_unit === 'ratio') {
                usageCost = dishTotalCost * dish.usage_quantity;
            } else { // serving
                usageCost = dishTotalCost * dish.usage_quantity;
            }
            
            totalCost += usageCost;
            
            return {
                ...dish,
                usage_cost: usageCost
            };
        });

        // 完成品登録
        const [foodResult] = await connection.execute(`
            INSERT INTO completed_foods (name, price, total_cost, description)
            VALUES (?, ?, ?, ?)
        `, [name, price || null, totalCost, description]);

        const foodId = (foodResult as any).insertId;

        // 完成品-料理関連登録
        for (const dish of foodDishes) {
            await connection.execute(`
                INSERT INTO food_dishes (food_id, dish_id, usage_quantity, usage_unit, usage_cost, description)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [foodId, dish.dish_id, dish.usage_quantity, dish.usage_unit, dish.usage_cost, dish.description]);
        }

        return foodId;
    });

    // 作成された完成品を取得
    const newCompletedFood = await executeQueryOne(`
        SELECT 
            cf.id,
            cf.name,
            cf.price,
            cf.total_cost,
            cf.description,
            cf.created_at,
            cf.updated_at,
            COUNT(fd.dish_id) as dish_count,
            CASE 
                WHEN cf.price IS NOT NULL AND cf.price > 0 
                THEN cf.price - cf.total_cost 
                ELSE NULL 
            END as profit,
            CASE 
                WHEN cf.price IS NOT NULL AND cf.price > 0 
                THEN ROUND(((cf.price - cf.total_cost) / cf.price) * 100, 2)
                ELSE NULL 
            END as profit_rate
        FROM completed_foods cf
        LEFT JOIN food_dishes fd ON cf.id = fd.food_id
        WHERE cf.id = ?
        GROUP BY cf.id
    `, [result]);

    logger.info('Completed food created', {
        id: result,
        name,
        totalCost,
        price: price || null,
        dishCount: dishes.length
    });

    res.status(201).json({
        success: true,
        data: newCompletedFood,
        message: '完成品を作成しました',
        timestamp: new Date().toISOString(),
    });
}));

// 完成品更新 (PUT /api/foods/:id)
router.put('/:id', updateCompletedFoodValidation, checkValidation, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, price, description, dishes } = req.body;

    // 完成品の存在確認
    const existingFood = await executeQueryOne('SELECT id FROM completed_foods WHERE id = ?', [id]);
    if (!existingFood) {
        throw new NotFoundError('指定された完成品が見つかりません');
    }

    const result = await executeTransaction(async (connection) => {
        // 基本情報の更新
        const updateFields: string[] = [];
        const updateParams: any[] = [];

        if (name !== undefined) {
            updateFields.push('name = ?');
            updateParams.push(name);
        }

        if (price !== undefined) {
            updateFields.push('price = ?');
            updateParams.push(price || null);
        }

        if (description !== undefined) {
            updateFields.push('description = ?');
            updateParams.push(description);
        }

        // 料理が更新される場合の処理
        if (dishes && dishes.length > 0) {
            // 既存の料理関連削除
            await connection.execute('DELETE FROM food_dishes WHERE food_id = ?', [id]);

            // 料理情報取得と総コスト計算
            const dishIds = dishes.map((dish: any) => dish.dish_id);
            const placeholders = dishIds.map(() => '?').join(',');
            
            const [dishRows] = await connection.execute(`
                SELECT id, total_cost 
                FROM dishes 
                WHERE id IN (${placeholders})
            `, dishIds);

            const dishMap = new Map();
            (dishRows as any[]).forEach(dish => {
                dishMap.set(dish.id, dish.total_cost);
            });

            let totalCost = 0;
            for (const dish of dishes) {
                const dishTotalCost = dishMap.get(dish.dish_id);
                if (!dishTotalCost) {
                    throw new Error(`料理ID ${dish.dish_id} が見つかりません`);
                }
                
                let usageCost;
                if (dish.usage_unit === 'ratio') {
                    usageCost = dishTotalCost * dish.usage_quantity;
                } else {
                    usageCost = dishTotalCost * dish.usage_quantity;
                }
                
                totalCost += usageCost;

                // 新しい料理関連登録
                await connection.execute(`
                    INSERT INTO food_dishes (food_id, dish_id, usage_quantity, usage_unit, usage_cost, description)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [id, dish.dish_id, dish.usage_quantity, dish.usage_unit, usageCost, dish.description]);
            }

            updateFields.push('total_cost = ?');
            updateParams.push(totalCost);
        }

        if (updateFields.length > 0) {
            updateFields.push('updated_at = NOW()');
            updateParams.push(id);

            await connection.execute(`
                UPDATE completed_foods 
                SET ${updateFields.join(', ')} 
                WHERE id = ?
            `, updateParams);
        }

        return id;
    });

    // 更新された完成品を取得
    const updatedCompletedFood = await executeQueryOne(`
        SELECT 
            cf.id,
            cf.name,
            cf.price,
            cf.total_cost,
            cf.description,
            cf.created_at,
            cf.updated_at,
            COUNT(fd.dish_id) as dish_count,
            CASE 
                WHEN cf.price IS NOT NULL AND cf.price > 0 
                THEN cf.price - cf.total_cost 
                ELSE NULL 
            END as profit,
            CASE 
                WHEN cf.price IS NOT NULL AND cf.price > 0 
                THEN ROUND(((cf.price - cf.total_cost) / cf.price) * 100, 2)
                ELSE NULL 
            END as profit_rate
        FROM completed_foods cf
        LEFT JOIN food_dishes fd ON cf.id = fd.food_id
        WHERE cf.id = ?
        GROUP BY cf.id
    `, [id]);

    logger.info('Completed food updated', {
        id,
        updates: Object.keys(req.body)
    });

    res.json({
        success: true,
        data: updatedCompletedFood,
        message: '完成品を更新しました',
        timestamp: new Date().toISOString(),
    });
}));

// 完成品削除 (DELETE /api/foods/:id)
router.delete('/:id', 
    param('id').isInt({ min: 1 }).withMessage('正しいIDを指定してください'),
    checkValidation,
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        // 完成品の存在確認
        const completedFood = await executeQueryOne('SELECT name FROM completed_foods WHERE id = ?', [id]);
        if (!completedFood) {
            throw new NotFoundError('指定された完成品が見つかりません');
        }

        const affectedRows = await executeUpdate('DELETE FROM completed_foods WHERE id = ?', [id]);

        if (affectedRows === 0) {
            throw new NotFoundError('完成品の削除に失敗しました');
        }

        logger.info('Completed food deleted', {
            id,
            name: completedFood.name
        });

        res.json({
            success: true,
            message: '完成品を削除しました',
            timestamp: new Date().toISOString(),
        });
    })
);

// 完成品統計情報取得 (GET /api/foods/stats/summary)
router.get('/stats/summary', asyncHandler(async (req: Request, res: Response) => {
    const totalStats = await executeQueryOne(`
        SELECT 
            COUNT(*) as total_foods,
            AVG(total_cost) as avg_total_cost,
            AVG(price) as avg_price,
            AVG(CASE WHEN price IS NOT NULL AND price > 0 THEN ((price - total_cost) / price) * 100 ELSE NULL END) as avg_profit_rate,
            SUM(CASE WHEN price IS NOT NULL THEN price ELSE 0 END) as total_revenue,
            SUM(total_cost) as total_cost,
            SUM(CASE WHEN price IS NOT NULL THEN price - total_cost ELSE 0 END) as total_profit
        FROM completed_foods
    `);

    const profitabilityStats = await executeQuery(`
        SELECT 
            CASE 
                WHEN price IS NULL OR price = 0 THEN '価格未設定'
                WHEN ((price - total_cost) / price) * 100 >= 30 THEN '高利益率(30%以上)'
                WHEN ((price - total_cost) / price) * 100 >= 20 THEN '中利益率(20-30%)'
                WHEN ((price - total_cost) / price) * 100 >= 10 THEN '低利益率(10-20%)'
                ELSE '要改善(10%未満)'
            END as profitability_category,
            COUNT(*) as count,
            AVG(total_cost) as avg_cost,
            AVG(price) as avg_price
        FROM completed_foods
        GROUP BY profitability_category
        ORDER BY count DESC
    `);

    const topProfitableFoods = await executeQuery(`
        SELECT 
            name,
            price,
            total_cost,
            price - total_cost as profit,
            ROUND(((price - total_cost) / price) * 100, 2) as profit_rate
        FROM completed_foods
        WHERE price IS NOT NULL AND price > 0
        ORDER BY profit_rate DESC
        LIMIT 10
    `);

    res.json({
        success: true,
        data: {
            total: totalStats,
            profitability: profitabilityStats,
            topProfitable: topProfitableFoods
        },
        timestamp: new Date().toISOString(),
    });
}));

export default router;