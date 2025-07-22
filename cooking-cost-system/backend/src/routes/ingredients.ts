import { Router, Request, Response } from 'express';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { Ingredient } from '../models/Ingredient';
import { CreateIngredientRequest, UpdateIngredientRequest, IngredientSearchParams } from '../types/ingredient';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/ingredients - 食材一覧取得
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const searchParams: IngredientSearchParams = {
        name: req.query.name as string,
        store: req.query.store as string,
        genre: req.query.genre as any,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        sortBy: (req.query.sortBy as string) || 'created_at',
        sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const ingredients = await Ingredient.search(searchParams);
    
    logger.info(`Retrieved ${ingredients.length} ingredients`, { searchParams });
    
    res.json({
        success: true,
        data: ingredients,
        count: ingredients.length,
        timestamp: new Date().toISOString(),
    });
}));

// GET /api/ingredients/:id - 食材詳細取得
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        throw new BadRequestError('Invalid ingredient ID');
    }

    const ingredient = await Ingredient.findById(id);
    
    if (!ingredient) {
        throw new NotFoundError('Ingredient');
    }

    res.json({
        success: true,
        data: ingredient,
        timestamp: new Date().toISOString(),
    });
}));

// POST /api/ingredients - 食材作成
router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const data: CreateIngredientRequest = req.body;

    // バリデーション
    if (!data.name || !data.store || !data.unit) {
        throw new BadRequestError('Name, store, and unit are required');
    }

    if (data.quantity <= 0 || data.price <= 0) {
        throw new BadRequestError('Quantity and price must be positive numbers');
    }

    const ingredient = new Ingredient(data);
    await ingredient.save();

    logger.info(`Created ingredient: ${ingredient.name}`, { id: ingredient.id });

    res.status(201).json({
        success: true,
        data: ingredient,
        message: 'Ingredient created successfully',
        timestamp: new Date().toISOString(),
    });
}));

// PUT /api/ingredients/:id - 食材更新
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const data: UpdateIngredientRequest = req.body;

    if (isNaN(id)) {
        throw new BadRequestError('Invalid ingredient ID');
    }

    const ingredient = await Ingredient.findById(id);
    
    if (!ingredient) {
        throw new NotFoundError('Ingredient');
    }

    // データ更新
    Object.assign(ingredient, data);
    await ingredient.save();

    logger.info(`Updated ingredient: ${ingredient.name}`, { id });

    res.json({
        success: true,
        data: ingredient,
        message: 'Ingredient updated successfully',
        timestamp: new Date().toISOString(),
    });
}));

// DELETE /api/ingredients/:id - 食材削除
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        throw new BadRequestError('Invalid ingredient ID');
    }

    const ingredient = await Ingredient.findById(id);
    
    if (!ingredient) {
        throw new NotFoundError('Ingredient');
    }

    await ingredient.delete();

    logger.info(`Deleted ingredient: ${ingredient.name}`, { id });

    res.json({
        success: true,
        message: 'Ingredient deleted successfully',
        timestamp: new Date().toISOString(),
    });
}));

// GET /api/ingredients/stats/genre - ジャンル別統計
router.get('/stats/genre', asyncHandler(async (req: Request, res: Response) => {
    const stats = await Ingredient.getGenreStatistics();
    
    res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
    });
}));

// GET /api/ingredients/popular - よく使われる食材
router.get('/popular', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const popularIngredients = await Ingredient.getPopularIngredients(limit);
    
    res.json({
        success: true,
        data: popularIngredients,
        timestamp: new Date().toISOString(),
    });
}));

export default router;
