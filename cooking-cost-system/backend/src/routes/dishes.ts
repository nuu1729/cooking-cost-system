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
const createDishValidation = [
    body('name')
        .notEmpty()
        .withMessage('料理名は必須です')
        .isLength({ max: 255 })
        .withMessage('料理名は255文字以下で入力してください'),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('説明は1000文字以下で入力してください'),
    body('ingredients')
        .isArray({ min: 1 })
        .withMessage('食材を1つ以上選択してください'),
    body('ingredients.*.ingredient_id')
        .isInt({ min: 1 })
        .withMessage('正しい食材IDを指定してください'),
    body('ingredients.*.used_quantity')
        .isFloat({ min: 0.01 })
        .withMessage('使用量は0.01以上の数値で入力してください'),
];

const updateDishValidation = [
    param('id').isInt({ min: 1 }).withMessage('正しいIDを指定してください'),
    body('name')
        .optional()
        .isLength({ max: 255 })
        .withMessage('料理名は255文字以下で入力してください'),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('説明は1000文字以下で入力してください'),
    body('ingredients')
        .optional()
        .isArray({ min: 1 })
        .withMessage('食材を1つ以上選択してください'),
];

const searchValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('ページは1以上の整数で入力してください'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('取得件数は1〜100の整数で入力してください'),
    query('name').optional().isLength({ max: 255 }).withMessage('料理名は255文字以下で入力してください'),
    query('genre').optional().isLength({ max: 50 }).withMessage('ジャンルは50文字以下で入力してください'),
    query('minCost').optional().isFloat({ min: 0 }).withMessage('最小コストは0以上の数値で入力してください'),
    query('maxCost').optional().isFloat({ min: 0 }).withMessage('最大コストは0以上の数値で入力してください'),
    query('sortBy').optional().isIn(['name', 'total_cost', 'created_at']).withMessage('正しいソート項目を選択してください'),
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

// 料理一覧取得 (GET /api/dishes)
router.get('/', searchValidation, checkValidation, asyncHandler(async (req: Request, res: Response) => {
    const {
        page = 1,
        limit = 20,
        name,
        genre,
        minCost,
        maxCost,
        sortBy = 'created_at',
        sortOrder = 'desc'
    } = req.query;

    // 検索条件構築
    const conditions: string[] = [];
    const params: any[] = [];

    if (name) {
        conditions.push('d.name LIKE ?');
        params.push(`%${name}%`);
    }

    if (genre) {
        conditions.push('d.genre LIKE ?');
        params.push(`%${genre}%`);
    }

    if (minCost) {
        conditions.push('d.total_cost >= ?');
        params.push(minCost);
    }

    if (maxCost) {
        conditions.push('d.total_cost <= ?');
        params.push(maxCost);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = `ORDER BY d.${sortBy} ${sortOrder}`;

    const sql = `
        SELECT 
            d.id,
            d.name,
            d.total_cost,
            d.genre,
            d.description,
            d.created_at,
            d.updated_at,
            COUNT(di.ingredient_id) as ingredient_count
        FROM dishes d
        LEFT JOIN dish_ingredients di ON d.id = di.dish_id
        ${whereClause}
        GROUP BY d.id
        ${orderClause}
    `;

    const result = await executePaginatedQuery(
        sql,
        params,
        Number(page),
        Number(limit)
    );

    logger.info('Dishes retrieved', {
        count: result.data.length,
        page: result.pagination.page,
        filters: { name, genre, minCost, maxCost }
    });

    res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
    });
}));

// 料理詳細取得 (GET /api/dishes/:id)
router.get('/:id', 
    param('id').isInt({ min: 1 }).withMessage('正しいIDを指定してください'),
    checkValidation,
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        // 料理基本情報取得
        const dish = await executeQueryOne(`
            SELECT 
                id,
                name,
                total_cost,
                genre,
                description,
                created_at,
                updated_at
            FROM dishes 
            WHERE id = ?
        `, [id]);

        if (!dish) {
            throw new NotFoundError('指定された料理が見つかりません');
        }

        // 料理の食材情報取得
        const ingredients = await executeQuery(`
            SELECT 
                di.ingredient_id,
                di.used_quantity,
                di.used_cost,
                i.name as ingredient_name,
                i.unit,
                i.unit_price,
                i.genre as ingredient_genre
            FROM dish_ingredients di
            JOIN ingredients i ON di.ingredient_id = i.id
            WHERE di.dish_id = ?
            ORDER BY di.created_at
        `, [id]);

        // 使用履歴取得
        const usageHistory = await executeQuery(`
            SELECT 
                cf.name as food_name,
                fd.usage_quantity,
                fd.usage_cost,
                fd.created_at
            FROM food_dishes fd
            JOIN completed_foods cf ON fd.food_id = cf.id
            WHERE fd.dish_id = ?
            ORDER BY fd.created_at DESC
            LIMIT 10
        `, [id]);

        res.json({
            success: true,
            data: {
                ...dish,
                ingredients,
                usageHistory
            },
            timestamp: new Date().toISOString(),
        });
    })
);

// 料理作成 (POST /api/dishes)
router.post('/', createDishValidation, checkValidation, asyncHandler(async (req: Request, res: Response) => {
    const { name, description, ingredients } = req.body;

    const result = await executeTransaction(async (connection) => {
        // 食材の存在確認と単価取得
        const ingredientIds = ingredients.map((ing: any) => ing.ingredient_id);
        const placeholders = ingredientIds.map(() => '?').join(',');
        
        const [ingredientRows] = await connection.execute(`
            SELECT id, unit_price 
            FROM ingredients 
            WHERE id IN (${placeholders})
        `, ingredientIds);

        const ingredientMap = new Map();
        (ingredientRows as any[]).forEach(ing => {
            ingredientMap.set(ing.id, ing.unit_price);
        });

        // 総コスト計算
        let totalCost = 0;
        const dishIngredients = ingredients.map((ing: any) => {
            const unitPrice = ingredientMap.get(ing.ingredient_id);
            if (!unitPrice) {
                throw new Error(`食材ID ${ing.ingredient_id} が見つかりません`);
            }
            const usedCost = unitPrice * ing.used_quantity;
            totalCost += usedCost;
            return {
                ...ing,
                used_cost: usedCost
            };
        });

        // ジャンル推定（最も多く使われている食材のジャンル）
        const [genreRows] = await connection.execute(`
            SELECT i.genre, SUM(?) as total_quantity
            FROM ingredients i
            WHERE i.id IN (${placeholders})
            GROUP BY i.genre
            ORDER BY total_quantity DESC
            LIMIT 1
        `, [
            ...ingredients.map((ing: any) => ing.used_quantity),
            ...ingredientIds
        ]);

        const genre = (genreRows as any[])[0]?.genre || 'meat';

        // 料理登録
        const [dishResult] = await connection.execute(`
            INSERT INTO dishes (name, total_cost, genre, description)
            VALUES (?, ?, ?, ?)
        `, [name, totalCost, genre, description]);

        const dishId = (dishResult as any).insertId;

        // 料理-食材関連登録
        for (const ingredient of dishIngredients) {
            await connection.execute(`
                INSERT INTO dish_ingredients (dish_id, ingredient_id, used_quantity, used_cost)
                VALUES (?, ?, ?, ?)
            `, [dishId, ingredient.ingredient_id, ingredient.used_quantity, ingredient.used_cost]);
        }

        return dishId;
    });

    // 作成された料理を取得
    const newDish = await executeQueryOne(`
        SELECT 
            d.id,
            d.name,
            d.total_cost,
            d.genre,
            d.description,
            d.created_at,
            d.updated_at,
            COUNT(di.ingredient_id) as ingredient_count
        FROM dishes d
        LEFT JOIN dish_ingredients di ON d.id = di.dish_id
        WHERE d.id = ?
        GROUP BY d.id
    `, [result]);

    logger.info('Dish created', {
        id: result,
        name,
        totalCost: newDish.total_cost,
        ingredientCount: ingredients.length
    });

    res.status(201).json({
        success: true,
        data: newDish,
        message: '料理を作成しました',
        timestamp: new Date().toISOString(),
    });
}));

// 料理更新 (PUT /api/dishes/:id)
router.put('/:id', updateDishValidation, checkValidation, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, ingredients } = req.body;

    // 料理の存在確認
    const existingDish = await executeQueryOne('SELECT id FROM dishes WHERE id = ?', [id]);
    if (!existingDish) {
        throw new NotFoundError('指定された料理が見つかりません');
    }

    const result = await executeTransaction(async (connection) => {
        // 基本情報の更新
        const updateFields: string[] = [];
        const updateParams: any[] = [];

        if (name !== undefined) {
            updateFields.push('name = ?');
            updateParams.push(name);
        }

        if (description !== undefined) {
            updateFields.push('description = ?');
            updateParams.push(description);
        }

        // 食材が更新される場合の処理
        if (ingredients && ingredients.length > 0) {
            // 既存の食材関連削除
            await connection.execute('DELETE FROM dish_ingredients WHERE dish_id = ?', [id]);

            // 食材情報取得と総コスト計算
            const ingredientIds = ingredients.map((ing: any) => ing.ingredient_id);
            const placeholders = ingredientIds.map(() => '?').join(',');
            
            const [ingredientRows] = await connection.execute(`
                SELECT id, unit_price 
                FROM ingredients 
                WHERE id IN (${placeholders})
            `, ingredientIds);

            const ingredientMap = new Map();
            (ingredientRows as any[]).forEach(ing => {
                ingredientMap.set(ing.id, ing.unit_price);
            });

            let totalCost = 0;
            for (const ingredient of ingredients) {
                const unitPrice = ingredientMap.get(ingredient.ingredient_id);
                if (!unitPrice) {
                    throw new Error(`食材ID ${ingredient.ingredient_id} が見つかりません`);
                }
                const usedCost = unitPrice * ingredient.used_quantity;
                totalCost += usedCost;

                // 新しい食材関連登録
                await connection.execute(`
                    INSERT INTO dish_ingredients (dish_id, ingredient_id, used_quantity, used_cost)
                    VALUES (?, ?, ?, ?)
                `, [id, ingredient.ingredient_id, ingredient.used_quantity, usedCost]);
            }

            updateFields.push('total_cost = ?');
            updateParams.push(totalCost);
        }

        if (updateFields.length > 0) {
            updateFields.push('updated_at = NOW()');
            updateParams.push(id);

            await connection.execute(`
                UPDATE dishes 
                SET ${updateFields.join(', ')} 
                WHERE id = ?
            `, updateParams);
        }

        return id;
    });

    // 更新された料理を取得
    const updatedDish = await executeQueryOne(`
        SELECT 
            d.id,
            d.name,
            d.total_cost,
            d.genre,
            d.description,
            d.created_at,
            d.updated_at,
            COUNT(di.ingredient_id) as ingredient_count
        FROM dishes d
        LEFT JOIN dish_ingredients di ON d.id = di.dish_id
        WHERE d.id = ?
        GROUP BY d.id
    `, [id]);

    logger.info('Dish updated', {
        id,
        updates: Object.keys(req.body)
    });

    res.json({
        success: true,
        data: updatedDish,
        message: '料理を更新しました',
        timestamp: new Date().toISOString(),
    });
}));

// 料理削除 (DELETE /api/dishes/:id)
router.delete('/:id', 
    param('id').isInt({ min: 1 }).withMessage('正しいIDを指定してください'),
    checkValidation,
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        // 料理の存在確認
        const dish = await executeQueryOne('SELECT name FROM dishes WHERE id = ?', [id]);
        if (!dish) {
            throw new NotFoundError('指定された料理が見つかりません');
        }

        // 使用中かチェック
        const usageCount = await executeQueryOne(
            'SELECT COUNT(*) as count FROM food_dishes WHERE dish_id = ?',
            [id]
        );

        if ((usageCount as any).count > 0) {
            throw new Error('この料理は完成品で使用されているため削除できません');
        }

        const affectedRows = await executeUpdate('DELETE FROM dishes WHERE id = ?', [id]);

        if (affectedRows === 0) {
            throw new NotFoundError('料理の削除に失敗しました');
        }

        logger.info('Dish deleted', {
            id,
            name: dish.name
        });

        res.json({
            success: true,
            message: '料理を削除しました',
            timestamp: new Date().toISOString(),
        });
    })
);

// 料理統計情報取得 (GET /api/dishes/stats/summary)
router.get('/stats/summary', asyncHandler(async (req: Request, res: Response) => {
    const stats = await executeQuery(`
        SELECT 
            genre,
            COUNT(*) as count,
            AVG(total_cost) as avg_total_cost,
            MIN(total_cost) as min_total_cost,
            MAX(total_cost) as max_total_cost
        FROM dishes
        GROUP BY genre
        ORDER BY count DESC
    `);

    const totalStats = await executeQueryOne(`
        SELECT 
            COUNT(*) as total_dishes,
            AVG(total_cost) as avg_total_cost,
            SUM(total_cost) as total_cost
        FROM dishes
    `);

    const popularIngredients = await executeQuery(`
        SELECT 
            i.name,
            i.genre,
            COUNT(di.dish_id) as usage_count,
            AVG(di.used_quantity) as avg_used_quantity,
            SUM(di.used_cost) as total_used_cost
        FROM dish_ingredients di
        JOIN ingredients i ON di.ingredient_id = i.id
        GROUP BY i.id
        ORDER BY usage_count DESC
        LIMIT 10
    `);

    res.json({
        success: true,
        data: {
            byGenre: stats,
            total: totalStats,
            popularIngredients
        },
        timestamp: new Date().toISOString(),
    });
}));

export default router;