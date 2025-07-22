import { Router, Request, Response } from 'express';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { Dish } from '../models/Dish';
import { DishData } from '../models/Dish';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/dishes - 料理一覧取得
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const searchParams = {
        name: req.query.name as string,
        genre: req.query.genre as string,
        minCost: req.query.minCost ? parseFloat(req.query.minCost as string) : undefined,
        maxCost: req.query.maxCost ? parseFloat(req.query.maxCost as string) : undefined,
        sortBy: (req.query.sortBy as string) || 'created_at',
        sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const dishes = await Dish.search(searchParams);
    
    logger.info(`Retrieved ${dishes.length} dishes`, { searchParams });
    
    res.json({
        success: true,
        data: dishes,
        count: dishes.length,
        timestamp: new Date().toISOString(),
    });
}));

// GET /api/dishes/:id - 料理詳細取得（食材付き）
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        throw new BadRequestError('Invalid dish ID');
    }

    const dish = await Dish.findByIdWithIngredients(id);
    
    if (!dish) {
        throw new NotFoundError('Dish');
    }

    res.json({
        success: true,
        data: dish,
        timestamp: new Date().toISOString(),
    });
}));

// POST /api/dishes - 料理作成
router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const data: DishData = req.body;

    // バリデーション
    if (!data.name) {
        throw new BadRequestError('Dish name is required');
    }

    if (!data.ingredients || data.ingredients.length === 0) {
        throw new BadRequestError('At least one ingredient is required');
    }

    // 食材データの検証
    for (const ingredient of data.ingredients) {
        if (!ingredient.ingredient_id || ingredient.used_quantity <= 0) {
            throw new BadRequestError('Invalid ingredient data');
        }
    }

    const dish = new Dish({
        name: data.name,
        genre: data.genre,
        description: data.description,
    });

    await dish.createWithIngredients(data.ingredients);

    logger.info(`Created dish: ${dish.name}`, { id: dish.id, ingredientCount: data.ingredients.length });

    res.status(201).json({
        success: true,
        data: dish,
        message: 'Dish created successfully',
        timestamp: new Date().toISOString(),
    });
}));

// PUT /api/dishes/:id - 料理更新
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const data = req.body;

    if (isNaN(id)) {
        throw new BadRequestError('Invalid dish ID');
    }

    const dish = await Dish.findById(id);
    
    if (!dish) {
        throw new NotFoundError('Dish');
    }

    // 基本情報更新
    if (data.name) dish.name = data.name;
    if (data.genre) dish.genre = data.genre;
    if (data.description !== undefined) dish.description = data.description;

    await dish.save();

    // 食材が更新される場合は再作成が必要
    if (data.ingredients) {
        // 既存の関連データを削除してから再作成
        await dish.delete();
        await dish.createWithIngredients(data.ingredients);
    }

    logger.info(`Updated dish: ${dish.name}`, { id });

    res.json({
        success: true,
        data: dish,
        message: 'Dish updated successfully',
        timestamp: new Date().toISOString(),
    });
}));

// DELETE /api/dishes/:id - 料理削除
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        throw new BadRequestError('Invalid dish ID');
    }

    const dish = await Dish.findById(id);
    
    if (!dish) {
        throw new NotFoundError('Dish');
    }

    await dish.delete();

    logger.info(`Deleted dish: ${dish.name}`, { id });

    res.json({
        success: true,
        message: 'Dish deleted successfully',
        timestamp: new Date().toISOString(),
    });
}));

// GET /api/dishes/stats/genre - ジャンル別統計
router.get('/stats/genre', asyncHandler(async (req: Request, res: Response) => {
    const stats = await Dish.getGenreStatistics();
    
    res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
    });
}));

export default router;