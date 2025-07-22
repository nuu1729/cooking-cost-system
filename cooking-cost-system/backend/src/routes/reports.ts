import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { Ingredient } from '../models/Ingredient';
import { Dish } from '../models/Dish';
import { CompletedFood } from '../models/CompletedFood';
import { getDatabase } from '../database';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/reports/dashboard - ダッシュボード統計
router.get('/dashboard', asyncHandler(async (req: Request, res: Response) => {
    const db = getDatabase();

    // 基本統計
    const [totalIngredients] = await db.query('SELECT COUNT(*) as count FROM ingredients');
    const [totalDishes] = await db.query('SELECT COUNT(*) as count FROM dishes');
    const [totalFoods] = await db.query('SELECT COUNT(*) as count FROM completed_foods');

    // 平均利益率計算
    const [avgProfitRate] = await db.query(`
        SELECT AVG(CASE WHEN price > 0 THEN ((price - total_cost) / price) * 100 ELSE 0 END) as avg_profit_rate
        FROM completed_foods
        WHERE price IS NOT NULL AND price > 0
    `);

    // 総売上・原価・利益
    const [totals] = await db.query(`
        SELECT 
            COALESCE(SUM(price), 0) as total_revenue,
            COALESCE(SUM(total_cost), 0) as total_cost,
            COALESCE(SUM(price - total_cost), 0) as total_profit
        FROM completed_foods
        WHERE price IS NOT NULL
    `);

    // 最近の活動
    const recentActivity = await db.query(`
        (SELECT 'ingredient' as type, CONCAT('食材「', name, '」を追加') as message, created_at as timestamp
         FROM ingredients ORDER BY created_at DESC LIMIT 5)
        UNION ALL
        (SELECT 'dish' as type, CONCAT('料理「', name, '」を作成') as message, created_at as timestamp
         FROM dishes ORDER BY created_at DESC LIMIT 5)
        UNION ALL
        (SELECT 'food' as type, CONCAT('完成品「', name, '」を登録') as message, created_at as timestamp
         FROM completed_foods ORDER BY created_at DESC LIMIT 5)
        ORDER BY timestamp DESC LIMIT 10
    `);

    const dashboardData = {
        summary: {
            totalIngredients: totalIngredients[0]?.count || 0,
            totalDishes: totalDishes[0]?.count || 0,
            totalCompletedFoods: totalFoods[0]?.count || 0,
            avgProfitRate: parseFloat(avgProfitRate[0]?.avg_profit_rate || '0').toFixed(2),
            totalRevenue: parseFloat(totals[0]?.total_revenue || '0'),
            totalCost: parseFloat(totals[0]?.total_cost || '0'),
            totalProfit: parseFloat(totals[0]?.total_profit || '0'),
        },
        recentActivity: recentActivity.map((activity: any, index: number) => ({
            id: index + 1,
            type: activity.type,
            message: activity.message,
            timestamp: activity.timestamp,
        })),
    };

    logger.info('Generated dashboard report');

    res.json({
        success: true,
        data: dashboardData,
        timestamp: new Date().toISOString(),
    });
}));

// GET /api/reports/genre-stats - ジャンル統計
router.get('/genre-stats', asyncHandler(async (req: Request, res: Response) => {
    const ingredientStats = await Ingredient.getGenreStatistics();
    const dishStats = await Dish.getGenreStatistics();

    res.json({
        success: true,
        data: {
            ingredients: ingredientStats,
            dishes: dishStats,
        },
        timestamp: new Date().toISOString(),
    });
}));

// GET /api/reports/cost-trends - コスト推移
router.get('/cost-trends', asyncHandler(async (req: Request, res: Response) => {
    const db = getDatabase();
    const days = parseInt(req.query.days as string) || 30;

    const costTrends = await db.query(`
        SELECT 
            DATE(created_at) as date,
            AVG(unit_price) as avg_ingredient_cost,
            COUNT(*) as ingredient_count
        FROM ingredients
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
    `, [days]);

    const dishTrends = await db.query(`
        SELECT 
            DATE(created_at) as date,
            AVG(total_cost) as avg_dish_cost,
            COUNT(*) as dish_count
        FROM dishes
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
    `, [days]);

    const foodTrends = await db.query(`
        SELECT 
            DATE(created_at) as date,
            AVG(total_cost) as avg_food_cost,
            AVG(CASE WHEN price > 0 THEN ((price - total_cost) / price) * 100 ELSE 0 END) as avg_profit_rate,
            COUNT(*) as food_count
        FROM completed_foods
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
    `, [days]);

    res.json({
        success: true,
        data: {
            ingredients: costTrends,
            dishes: dishTrends,
            foods: foodTrends,
        },
        timestamp: new Date().toISOString(),
    });
}));

// GET /api/reports/popular-items - 人気アイテム
router.get('/popular-items', asyncHandler(async (req: Request, res: Response) => {
    const popularIngredients = await Ingredient.getPopularIngredients(10);
    const profitableFoods = await CompletedFood.findByProfitRate(10);

    res.json({
        success: true,
        data: {
            popularIngredients,
            profitableFoods,
        },
        timestamp: new Date().toISOString(),
    });
}));

// GET /api/reports/export - レポートエクスポート
router.get('/export', asyncHandler(async (req: Request, res: Response) => {
    const format = req.query.format as string || 'json';
    const type = req.query.type as string || 'summary';

    let data: any = {};

    switch (type) {
        case 'ingredients':
            data = await Ingredient.findAll();
            break;
        case 'dishes':
            data = await Dish.findAll();
            break;
        case 'foods':
            data = await CompletedFood.findAll();
            break;
        default:
            // Summary report
            const ingredientStats = await Ingredient.getGenreStatistics();
            const dishStats = await Dish.getGenreStatistics();
            data = { ingredientStats, dishStats };
    }

    if (format === 'csv') {
        // CSV形式での出力（簡易実装）
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}_report.csv"`);
        
        // CSV変換（実際の実装では専用ライブラリを使用）
        const csvData = Array.isArray(data) 
            ? data.map(item => Object.values(item).join(',')).join('\n')
            : JSON.stringify(data);
        
        res.send(csvData);
    } else {
        res.json({
            success: true,
            data,
            exportType: type,
            format,
            timestamp: new Date().toISOString(),
        });
    }

    logger.info(`Exported ${type} report in ${format} format`);
}));

export default router;
