import { Router, Request, Response } from 'express';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { CompletedFood } from '../models/CompletedFood';
import { CompletedFoodData } from '../models/CompletedFood';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/foods - 完成品一覧取得
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const searchParams = {
        name: req.query.name as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        minCost: req.query.minCost ? parseFloat(req.query.minCost as string) : undefined,
        maxCost: req.query.maxCost ? parseFloat(req.query.maxCost as string) : undefined,
        sortBy: (req.query.sortBy as string) || 'created_at',
        sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const foods = await CompletedFood.search(searchParams);
    
    // 利益と利益率を計算して追加
    const foodsWithProfit = foods.map(food => ({
        ...food.toJSON(),
        profit: food.profit,
        profit_rate: food.profit_rate,
    }));
    
    logger.info(`Retrieved ${foods.length} completed foods`, { searchParams });
    
    res.json({
        success: true,
        data: foodsWithProfit,
        count: foods.length,
        timestamp: new Date().toISOString(),
    });
}));

// GET /api/foods/:id - 完成品詳細取得（料理付き）
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        throw new BadRequestError('Invalid food ID');
    }

    const food = await CompletedFood.findByIdWithDishes(id);
    
    if (!food) {
        throw new NotFoundError('Completed Food');
    }

    const foodData = {
        ...food.toJSON(),
        profit: food.profit,
        profit_rate: food.profit_rate,
    };

    res.json({
        success: true,
        data: foodData,
        timestamp: new Date().toISOString(),
    });
}));

// POST /api/foods - 完成品作成
router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const data: CompletedFoodData = req.body;

    // バリデーション
    if (!data.name) {
        throw new BadRequestError('Food name is required');
    }

    if (!data.dishes || data.dishes.length === 0) {
        throw new BadRequestError('At least one dish is required');
    }

    // 料理データの検証
    for (const dish of data.dishes) {
        if (!dish.dish_id || dish.usage_quantity <= 0) {
            throw new BadRequestError('Invalid dish data');
        }
        if (!['ratio', 'serving'].includes(dish.usage_unit)) {
            throw new BadRequestError('Invalid usage unit');
        }
    }

    const food = new CompletedFood({
        name: data.name,
        price: data.price,
        description: data.description,
    });

    await food.createWithDishes(data.dishes);

    const foodData = {
        ...food.toJSON(),
        profit: food.profit,
        profit_rate: food.profit_rate,
    };

    logger.info(`Created completed food: ${food.name}`, { 
        id: food.id, 
        dishCount: data.dishes.length,
        totalCost: food.total_cost,
        profit: food.profit,
    });

    res.status(201).json({
        success: true,
        data: foodData,
        message: 'Completed food created successfully',
        timestamp: new Date().toISOString(),
    });
}));

// PUT /api/foods/:id - 完成品更新
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const data = req.body;

    if (isNaN(id)) {
        throw new BadRequestError('Invalid food ID');
    }

    const food = await CompletedFood.findById(id);
    
    if (!food) {
        throw new NotFoundError('Completed Food');
    }

    // 基本情報更新
    if (data.name) food.name = data.name;
    if (data.price !== undefined) food.price = data.price;
    if (data.description !== undefined) food.description = data.description;

    await food.save();

    // 料理が更新される場合は再作成が必要
    if (data.dishes) {
        // 既存の関連データを削除してから再作成
        await food.delete();
        await food.createWithDishes(data.dishes);
    }

    const foodData = {
        ...food.toJSON(),
        profit: food.profit,
        profit_rate: food.profit_rate,
    };

    logger.info(`Updated completed food: ${food.name}`, { id });

    res.json({
        success: true,
        data: foodData,
        message: 'Completed food updated successfully',
        timestamp: new Date().toISOString(),
    });
}));

// DELETE /api/foods/:id - 完成品削除
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        throw new BadRequestError('Invalid food ID');
    }

    const food = await CompletedFood.findById(id);
    
    if (!food) {
        throw new NotFoundError('Completed Food');
    }

    await food.delete();

    logger.info(`Deleted completed food: ${food.name}`, { id });

    res.json({
        success: true,
        message: 'Completed food deleted successfully',
        timestamp: new Date().toISOString(),
    });
}));

// GET /api/foods/stats/profit - 利益率順で取得
router.get('/stats/profit', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const profitableFoods = await CompletedFood.findByProfitRate(limit);
    
    res.json({
        success: true,
        data: profitableFoods,
        timestamp: new Date().toISOString(),
    });
}));

export default router;