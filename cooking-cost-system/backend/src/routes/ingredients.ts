// cooking-cost-system/backend/src/routes/ingredients.ts
import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { 
    executeQuery, 
    executeQueryOne, 
    executeInsert, 
    executeUpdate,
    executePaginatedQuery 
} from '../database';
import { asyncHandler, validationErrorHandler, NotFoundError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// バリデーションルール
const createIngredientValidation = [
    body('name')
        .notEmpty()
        .withMessage('食材名は必須です')
        .isLength({ max: 255 })
        .withMessage('食材名は255文字以下で入力してください'),
    body('store')
        .notEmpty()
        .withMessage('購入場所は必須です')
        .isLength({ max: 100 })
        .withMessage('購入場所は100文字以下で入力してください'),
    body('quantity')
        .isFloat({ min: 0.01 })
        .withMessage('購入量は0.01以上の数値で入力してください'),
    body('unit')
        .notEmpty()
        .withMessage('単位は必須です')
        .isLength({ max: 20 })
        .withMessage('単位は20文字以下で入力してください'),
    body('price')
        .isFloat({ min: 0.01 })
        .withMessage('価格は0.01以上の数値で入力してください'),
    body('genre')
        .isIn(['meat', 'vegetable', 'seasoning', 'sauce', 'frozen', 'drink'])
        .withMessage('正しいジャンルを選択してください'),
];

const updateIngredientValidation = [
    param('id').isInt({ min: 1 }).withMessage('正しいIDを指定してください'),
    ...createIngredientValidation.map(rule => rule.optional()),
];

const searchValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('ページは1以上の整数で入力してください'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('取得件数は1〜100の整数で入力してください'),
    query('name').optional().isLength({ max: 255 }).withMessage('食材名は255文字以下で入力してください'),
    query('store').optional().isLength({ max: 100 }).withMessage('購入場所は100文字以下で入力してください'),
    query('genre').optional().isIn(['meat', 'vegetable', 'seasoning', 'sauce', 'frozen', 'drink']).withMessage('正しいジャンルを選択してください'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('最小価格は0以上の数値で入力してください'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('最大価格は0以上の数値で入力してください'),
    query('sortBy').optional().isIn(['name', 'price', 'unit_price', 'created_at']).withMessage('正しいソート項目を選択してください'),
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

// 食材一覧取得 (GET /api/ingredients)
router.get('/', searchValidation, checkValidation, asyncHandler(async (req: Request, res: Response) => {
    const {
        page = 1,
        limit = 20,
        name,
        store,
        genre,
        minPrice,
        maxPrice,
        sortBy = 'created_at',
        sortOrder = 'desc'
    } = req.query;

    // 検索条件構築
    const conditions: string[] = [];
    const params: any[] = [];

    if (name) {
        conditions.push('name LIKE ?');
        params.push(`%${name}%`);
    }

    if (store) {
        conditions.push('store LIKE ?');
        params.push(`%${store}%`);
    }

    if (genre) {
        conditions.push('genre = ?');
        params.push(genre);
    }

    if (minPrice) {
        conditions.push('price >= ?');
        params.push(minPrice);
    }

    if (maxPrice) {
        conditions.push('price <= ?');
        params.push(maxPrice);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = `ORDER BY ${sortBy} ${sortOrder}`;

    const sql = `
        SELECT 
            id,
            name,
            store,
            quantity,
            unit,
            price,
            unit_price,
            genre,
            created_at,
            updated_at
        FROM ingredients 
        ${whereClause} 
        ${orderClause}
    `;

    const result = await executePaginatedQuery(
        sql,
        params,
        Number(page),
        Number(limit)
    );

    logger.info('Ingredients retrieved', {
        count: result.data.length,
        page: result.pagination.page,
        filters: { name, store, genre, minPrice, maxPrice }
    });

    res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
    });
}));

// 食材詳細取得 (GET /api/ingredients/:id)
router.get('/:id', 
    param('id').isInt({ min: 1 }).withMessage('正しいIDを指定してください'),
    checkValidation,
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        const ingredient = await executeQueryOne(`
            SELECT 
                id,
                name,
                store,
                quantity,
                unit,
                price,
                unit_price,
                genre,
                created_at,
                updated_at
            FROM ingredients 
            WHERE id = ?
        `, [id]);

        if (!ingredient) {
            throw new NotFoundError('指定された食材が見つかりません');
        }

        // 使用履歴も取得
        const usageHistory = await executeQuery(`
            SELECT 
                d.name as dish_name,
                di.used_quantity,
                di.used_cost,
                di.created_at
            FROM dish_ingredients di
            JOIN dishes d ON di.dish_id = d.id
            WHERE di.ingredient_id = ?
            ORDER BY di.created_at DESC
            LIMIT 10
        `, [id]);

        res.json({
            success: true,
            data: {
                ...ingredient,
                usageHistory
            },
            timestamp: new Date().toISOString(),
        });
    })
);

// 食材登録 (POST /api/ingredients)
router.post('/', createIngredientValidation, checkValidation, asyncHandler(async (req: Request, res: Response) => {
    const { name, store, quantity, unit, price, genre } = req.body;
    
    // 単価計算
    const unitPrice = price / quantity;

    const insertId = await executeInsert(`
        INSERT INTO ingredients (name, store, quantity, unit, price, unit_price, genre)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, store, quantity, unit, price, unitPrice, genre]);

    // 作成された食材を取得
    const newIngredient = await executeQueryOne(`
        SELECT 
            id,
            name,
            store,
            quantity,
            unit,
            price,
            unit_price,
            genre,
            created_at,
            updated_at
        FROM ingredients 
        WHERE id = ?
    `, [insertId]);

    logger.info('Ingredient created', {
        id: insertId,
        name,
        store,
        genre
    });

    res.status(201).json({
        success: true,
        data: newIngredient,
        message: '食材を登録しました',
        timestamp: new Date().toISOString(),
    });
}));

// 食材更新 (PUT /api/ingredients/:id)
router.put('/:id', updateIngredientValidation, checkValidation, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    // 食材の存在確認
    const existingIngredient = await executeQueryOne('SELECT id FROM ingredients WHERE id = ?', [id]);
    if (!existingIngredient) {
        throw new NotFoundError('指定された食材が見つかりません');
    }

    // 更新フィールドの構築
    const setFields: string[] = [];
    const params: any[] = [];

    Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
            if (key === 'quantity' || key === 'price') {
                setFields.push(`${key} = ?`);
                params.push(updates[key]);
                
                // 単価の再計算が必要
                if (key === 'quantity' || key === 'price') {
                    setFields.push('unit_price = ?');
                    const quantity = updates.quantity || existingIngredient.quantity;
                    const price = updates.price || existingIngredient.price;
                    params.push(price / quantity);
                }
            } else {
                setFields.push(`${key} = ?`);
                params.push(updates[key]);
            }
        }
    });

    if (setFields.length === 0) {
        throw new Error('更新する項目が指定されていません');
    }

    setFields.push('updated_at = NOW()');
    params.push(id);

    const affectedRows = await executeUpdate(`
        UPDATE ingredients 
        SET ${setFields.join(', ')} 
        WHERE id = ?
    `, params);

    if (affectedRows === 0) {
        throw new NotFoundError('食材の更新に失敗しました');
    }

    // 更新された食材を取得
    const updatedIngredient = await executeQueryOne(`
        SELECT 
            id,
            name,
            store,
            quantity,
            unit,
            price,
            unit_price,
            genre,
            created_at,
            updated_at
        FROM ingredients 
        WHERE id = ?
    `, [id]);

    logger.info('Ingredient updated', {
        id,
        updates: Object.keys(updates)
    });

    res.json({
        success: true,
        data: updatedIngredient,
        message: '食材を更新しました',
        timestamp: new Date().toISOString(),
    });
}));

// 食材削除 (DELETE /api/ingredients/:id)
router.delete('/:id', 
    param('id').isInt({ min: 1 }).withMessage('正しいIDを指定してください'),
    checkValidation,
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        // 食材の存在確認
        const ingredient = await executeQueryOne('SELECT name FROM ingredients WHERE id = ?', [id]);
        if (!ingredient) {
            throw new NotFoundError('指定された食材が見つかりません');
        }

        // 使用中かチェック
        const usageCount = await executeQueryOne(
            'SELECT COUNT(*) as count FROM dish_ingredients WHERE ingredient_id = ?',
            [id]
        );

        if ((usageCount as any).count > 0) {
            throw new Error('この食材は料理で使用されているため削除できません');
        }

        const affectedRows = await executeUpdate('DELETE FROM ingredients WHERE id = ?', [id]);

        if (affectedRows === 0) {
            throw new NotFoundError('食材の削除に失敗しました');
        }

        logger.info('Ingredient deleted', {
            id,
            name: ingredient.name
        });

        res.json({
            success: true,
            message: '食材を削除しました',
            timestamp: new Date().toISOString(),
        });
    })
);

// 食材統計情報取得 (GET /api/ingredients/stats)
router.get('/stats/summary', asyncHandler(async (req: Request, res: Response) => {
    const stats = await executeQuery(`
        SELECT 
            genre,
            COUNT(*) as count,
            AVG(unit_price) as avg_unit_price,
            MIN(unit_price) as min_unit_price,
            MAX(unit_price) as max_unit_price,
            SUM(price) as total_purchase_cost
        FROM ingredients
        GROUP BY genre
        ORDER BY count DESC
    `);

    const totalStats = await executeQueryOne(`
        SELECT 
            COUNT(*) as total_ingredients,
            AVG(unit_price) as avg_unit_price,
            SUM(price) as total_purchase_cost
        FROM ingredients
    `);

    res.json({
        success: true,
        data: {
            byGenre: stats,
            total: totalStats
        },
        timestamp: new Date().toISOString(),
    });
}));

export default router;