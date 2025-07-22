import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { executeQuery, executeQueryOne } from '../database';
import { asyncHandler, validationErrorHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// バリデーションルール
const dateRangeValidation = [
    query('startDate').optional().isDate().withMessage('開始日は正しい日付形式で入力してください'),
    query('endDate').optional().isDate().withMessage('終了日は正しい日付形式で入力してください'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('取得件数は1〜1000の整数で入力してください'),
];

// バリデーションエラーチェック
const checkValidation = (req: Request, res: Response, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw validationErrorHandler(errors.array());
    }
    next();
};

// 統合レポート取得 (GET /api/reports)
router.get('/', dateRangeValidation, checkValidation, asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, limit = 100 } = req.query;

    // 日付範囲の条件構築
    let dateCondition = '';
    const dateParams: any[] = [];

    if (startDate && endDate) {
        dateCondition = 'AND created_at BETWEEN ? AND ?';
        dateParams.push(startDate, endDate);
    } else if (startDate) {
        dateCondition = 'AND created_at >= ?';
        dateParams.push(startDate);
    } else if (endDate) {
        dateCondition = 'AND created_at <= ?';
        dateParams.push(endDate);
    }

    // 食材ジャンル別統計
    const genreStatistics = await executeQuery(`
        SELECT 
            genre,
            COUNT(*) as ingredient_count,
            AVG(unit_price) as avg_unit_price,
            MIN(unit_price) as min_unit_price,
            MAX(unit_price) as max_unit_price,
            SUM(price) as total_purchase_cost
        FROM ingredients
        WHERE 1=1 ${dateCondition}
        GROUP BY genre
        ORDER BY ingredient_count DESC
    `, dateParams);

    // 料理ジャンル別統計
    const dishStatistics = await executeQuery(`
        SELECT 
            genre,
            COUNT(*) as dish_count,
            AVG(total_cost) as avg_total_cost,
            MIN(total_cost) as min_total_cost,
            MAX(total_cost) as max_total_cost
        FROM dishes
        WHERE 1=1 ${dateCondition}
        GROUP BY genre
        ORDER BY dish_count DESC
    `);

    // 人気食材トップ10
    const popularIngredients = await executeQuery(`
        SELECT 
            i.id,
            i.name,
            i.store,
            i.genre,
            COUNT(di.dish_id) as usage_count,
            AVG(di.used_quantity) as avg_used_quantity,
            SUM(di.used_cost) as total_used_cost,
            i.unit_price
        FROM ingredients i
        LEFT JOIN dish_ingredients di ON i.id = di.ingredient_id
        LEFT JOIN dishes d ON di.dish_id = d.id
        WHERE i.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY i.id
        ORDER BY usage_count DESC, total_used_cost DESC
        LIMIT ?
    `, [limit]);

    // コストトレンド（直近30日）
    const costTrends = await executeQuery(`
        SELECT 
            DATE(created_at) as date,
            'ingredient' as type,
            AVG(unit_price) as avg_cost,
            COUNT(*) as total_items
        FROM ingredients
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        
        UNION ALL
        
        SELECT 
            DATE(created_at) as date,
            'dish' as type,
            AVG(total_cost) as avg_cost,
            COUNT(*) as total_items
        FROM dishes
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        
        UNION ALL
        
        SELECT 
            DATE(created_at) as date,
            'food' as type,
            AVG(total_cost) as avg_cost,
            COUNT(*) as total_items
        FROM completed_foods
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        
        ORDER BY date DESC, type
    `);

    // サマリー統計
    const summary = await executeQueryOne(`
        SELECT 
            (SELECT COUNT(*) FROM ingredients) as totalIngredients,
            (SELECT COUNT(*) FROM dishes) as totalDishes,
            (SELECT COUNT(*) FROM completed_foods) as totalCompletedFoods,
            (SELECT AVG(CASE WHEN price IS NOT NULL AND price > 0 THEN ((price - total_cost) / price) * 100 ELSE NULL END) FROM completed_foods) as avgProfitRate,
            (SELECT SUM(CASE WHEN price IS NOT NULL THEN price ELSE 0 END) FROM completed_foods) as totalRevenue,
            (SELECT SUM(total_cost) FROM completed_foods) as totalCost,
            (SELECT SUM(CASE WHEN price IS NOT NULL THEN price - total_cost ELSE 0 END) FROM completed_foods) as totalProfit
    `);

    const reportData = {
        genreStatistics,
        dishStatistics,
        popularIngredients,
        costTrends,
        summary
    };

    logger.info('Comprehensive report generated', {
        dateRange: { startDate, endDate },
        dataPoints: {
            genres: genreStatistics.length,
            dishes: dishStatistics.length,
            popularIngredients: popularIngredients.length,
            costTrends: costTrends.length
        }
    });

    res.json({
        success: true,
        data: reportData,
        meta: {
            generatedAt: new Date().toISOString(),
            dateRange: { startDate, endDate },
            totalDataPoints: genreStatistics.length + dishStatistics.length + popularIngredients.length + costTrends.length
        },
        timestamp: new Date().toISOString(),
    });
}));

// ジャンル別統計 (GET /api/reports/genre-stats)
router.get('/genre-stats', asyncHandler(async (req: Request, res: Response) => {
    const ingredientGenreStats = await executeQuery(`
        SELECT 
            i.genre,
            COUNT(i.id) as ingredient_count,
            AVG(i.unit_price) as avg_unit_price,
            MIN(i.unit_price) as min_unit_price,
            MAX(i.unit_price) as max_unit_price,
            SUM(i.price) as total_purchase_cost,
            COUNT(DISTINCT di.dish_id) as dishes_using_genre,
            AVG(di.used_cost) as avg_usage_cost
        FROM ingredients i
        LEFT JOIN dish_ingredients di ON i.id = di.ingredient_id
        GROUP BY i.genre
        ORDER BY ingredient_count DESC
    `);

    const dishGenreStats = await executeQuery(`
        SELECT 
            d.genre,
            COUNT(d.id) as dish_count,
            AVG(d.total_cost) as avg_total_cost,
            MIN(d.total_cost) as min_total_cost,
            MAX(d.total_cost) as max_total_cost,
            COUNT(DISTINCT fd.food_id) as foods_using_genre,
            AVG(fd.usage_cost) as avg_food_usage_cost
        FROM dishes d
        LEFT JOIN food_dishes fd ON d.id = fd.dish_id
        GROUP BY d.genre
        ORDER BY dish_count DESC
    `);

    // 月別ジャンル使用トレンド
    const genreUsageTrend = await executeQuery(`
        SELECT 
            DATE_FORMAT(d.created_at, '%Y-%m') as month,
            i.genre,
            COUNT(DISTINCT d.id) as dishes_created,
            AVG(d.total_cost) as avg_dish_cost
        FROM dishes d
        JOIN dish_ingredients di ON d.id = di.dish_id
        JOIN ingredients i ON di.ingredient_id = i.id
        WHERE d.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY month, i.genre
        ORDER BY month DESC, dishes_created DESC
    `);

    res.json({
        success: true,
        data: {
            ingredientGenreStats,
            dishGenreStats,
            genreUsageTrend
        },
        timestamp: new Date().toISOString(),
    });
}));

// 人気食材レポート (GET /api/reports/popular-ingredients)
router.get('/popular-ingredients', 
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('取得件数は1〜100の整数で入力してください'),
    checkValidation,
    asyncHandler(async (req: Request, res: Response) => {
        const { limit = 20 } = req.query;

        const popularIngredients = await executeQuery(`
            SELECT 
                i.id,
                i.name,
                i.store,
                i.genre,
                i.unit_price,
                COUNT(di.dish_id) as usage_count,
                AVG(di.used_quantity) as avg_used_quantity,
                SUM(di.used_cost) as total_used_cost,
                COUNT(DISTINCT d.id) as dishes_count,
                MIN(di.created_at) as first_used,
                MAX(di.created_at) as last_used
            FROM ingredients i
            LEFT JOIN dish_ingredients di ON i.id = di.ingredient_id
            LEFT JOIN dishes d ON di.dish_id = d.id
            GROUP BY i.id
            HAVING usage_count > 0
            ORDER BY usage_count DESC, total_used_cost DESC
            LIMIT ?
        `, [limit]);

        // 使用頻度別分布
        const usageDistribution = await executeQuery(`
            SELECT 
                CASE 
                    WHEN usage_count = 0 THEN '未使用'
                    WHEN usage_count = 1 THEN '1回使用'
                    WHEN usage_count <= 3 THEN '2-3回使用'
                    WHEN usage_count <= 5 THEN '4-5回使用'
                    WHEN usage_count <= 10 THEN '6-10回使用'
                    ELSE '10回以上使用'
                END as usage_category,
                COUNT(*) as ingredient_count,
                AVG(unit_price) as avg_unit_price
            FROM (
                SELECT 
                    i.id,
                    i.unit_price,
                    COUNT(di.dish_id) as usage_count
                FROM ingredients i
                LEFT JOIN dish_ingredients di ON i.id = di.ingredient_id
                GROUP BY i.id
            ) as ingredient_usage
            GROUP BY usage_category
            ORDER BY 
                CASE usage_category
                    WHEN '未使用' THEN 1
                    WHEN '1回使用' THEN 2
                    WHEN '2-3回使用' THEN 3
                    WHEN '4-5回使用' THEN 4
                    WHEN '6-10回使用' THEN 5
                    ELSE 6
                END
        `);

        // コスト効率ランキング
        const costEfficiencyRanking = await executeQuery(`
            SELECT 
                i.name,
                i.genre,
                i.unit_price,
                COUNT(di.dish_id) as usage_count,
                i.unit_price / NULLIF(COUNT(di.dish_id), 0) as cost_per_usage
            FROM ingredients i
            LEFT JOIN dish_ingredients di ON i.id = di.ingredient_id
            GROUP BY i.id
            HAVING usage_count > 0
            ORDER BY cost_per_usage ASC
            LIMIT ?
        `, [limit]);

        res.json({
            success: true,
            data: {
                popularIngredients,
                usageDistribution,
                costEfficiencyRanking
            },
            timestamp: new Date().toISOString(),
        });
    })
);

// コストトレンド分析 (GET /api/reports/cost-trends)
router.get('/cost-trends', 
    query('period').optional().isIn(['7d', '30d', '90d', '365d']).withMessage('期間は7d、30d、90d、365dのいずれかを指定してください'),
    checkValidation,
    asyncHandler(async (req: Request, res: Response) => {
        const { period = '30d' } = req.query;

        const periodDays = {
            '7d': 7,
            '30d': 30,
            '90d': 90,
            '365d': 365
        };

        const days = periodDays[period as keyof typeof periodDays];

        // 日別コストトレンド
        const dailyTrends = await executeQuery(`
            SELECT 
                DATE(created_at) as date,
                'ingredient' as category,
                AVG(unit_price) as avg_cost,
                COUNT(*) as count
            FROM ingredients
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            
            UNION ALL
            
            SELECT 
                DATE(created_at) as date,
                'dish' as category,
                AVG(total_cost) as avg_cost,
                COUNT(*) as count
            FROM dishes
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            
            UNION ALL
            
            SELECT 
                DATE(created_at) as date,
                'completed_food' as category,
                AVG(total_cost) as avg_cost,
                COUNT(*) as count
            FROM completed_foods
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            
            ORDER BY date DESC, category
        `, [days, days, days]);

        // 週別集計
        const weeklyTrends = await executeQuery(`
            SELECT 
                YEARWEEK(created_at) as week,
                DATE_SUB(DATE_ADD(MAKEDATE(LEFT(YEARWEEK(created_at), 4), 1), INTERVAL RIGHT(YEARWEEK(created_at), 2) - 1 WEEK), INTERVAL DAYOFWEEK(DATE_ADD(MAKEDATE(LEFT(YEARWEEK(created_at), 4), 1), INTERVAL RIGHT(YEARWEEK(created_at), 2) - 1 WEEK)) - 2 DAY) as week_start,
                COUNT(DISTINCT i.id) as ingredients_added,
                COUNT(DISTINCT d.id) as dishes_created,
                COUNT(DISTINCT cf.id) as foods_completed,
                AVG(i.unit_price) as avg_ingredient_unit_price,
                AVG(d.total_cost) as avg_dish_cost,
                AVG(cf.total_cost) as avg_food_cost
            FROM ingredients i
            LEFT JOIN dish_ingredients di ON i.id = di.ingredient_id
            LEFT JOIN dishes d ON di.dish_id = d.id AND DATE(d.created_at) = DATE(i.created_at)
            LEFT JOIN food_dishes fd ON d.id = fd.dish_id
            LEFT JOIN completed_foods cf ON fd.food_id = cf.id AND DATE(cf.created_at) = DATE(d.created_at)
            WHERE i.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY YEARWEEK(i.created_at)
            ORDER BY week DESC
        `, [days]);

        // コスト変動分析
        const costVariation = await executeQueryOne(`
            SELECT 
                STDDEV(unit_price) as ingredient_price_stddev,
                AVG(unit_price) as ingredient_price_avg,
                STDDEV(total_cost) as dish_cost_stddev,
                AVG(total_cost) as dish_cost_avg,
                (SELECT STDDEV(total_cost) FROM completed_foods WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)) as food_cost_stddev,
                (SELECT AVG(total_cost) FROM completed_foods WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)) as food_cost_avg
            FROM ingredients
            LEFT JOIN dish_ingredients di ON ingredients.id = di.ingredient_id
            LEFT JOIN dishes ON di.dish_id = dishes.id
            WHERE ingredients.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `, [days, days, days]);

        res.json({
            success: true,
            data: {
                period,
                dailyTrends,
                weeklyTrends,
                costVariation
            },
            timestamp: new Date().toISOString(),
        });
    })
);

// 利益率分析 (GET /api/reports/profitability)
router.get('/profitability', asyncHandler(async (req: Request, res: Response) => {
    // 完成品の利益率分析
    const profitabilityAnalysis = await executeQuery(`
        SELECT 
            cf.id,
            cf.name,
            cf.price,
            cf.total_cost,
            cf.price - cf.total_cost as profit,
            CASE 
                WHEN cf.price IS NOT NULL AND cf.price > 0 
                THEN ROUND(((cf.price - cf.total_cost) / cf.price) * 100, 2)
                ELSE NULL 
            END as profit_rate,
            COUNT(fd.dish_id) as dish_count
        FROM completed_foods cf
        LEFT JOIN food_dishes fd ON cf.id = fd.food_id
        WHERE cf.price IS NOT NULL AND cf.price > 0
        GROUP BY cf.id
        ORDER BY profit_rate DESC
    `);

    // 利益率分布
    const profitDistribution = await executeQuery(`
        SELECT 
            CASE 
                WHEN price IS NULL OR price = 0 THEN '価格未設定'
                WHEN ((price - total_cost) / price) * 100 >= 50 THEN '非常に高い(50%以上)'
                WHEN ((price - total_cost) / price) * 100 >= 30 THEN '高い(30-50%)'
                WHEN ((price - total_cost) / price) * 100 >= 20 THEN '中程度(20-30%)'
                WHEN ((price - total_cost) / price) * 100 >= 10 THEN '低い(10-20%)'
                ELSE '要改善(10%未満)'
            END as profit_category,
            COUNT(*) as count,
            AVG(total_cost) as avg_cost,
            AVG(price) as avg_price,
            AVG(CASE WHEN price IS NOT NULL AND price > 0 THEN ((price - total_cost) / price) * 100 ELSE NULL END) as avg_profit_rate
        FROM completed_foods
        GROUP BY profit_category
        ORDER BY 
            CASE profit_category
                WHEN '価格未設定' THEN 6
                WHEN '要改善(10%未満)' THEN 5
                WHEN '低い(10-20%)' THEN 4
                WHEN '中程度(20-30%)' THEN 3
                WHEN '高い(30-50%)' THEN 2
                WHEN '非常に高い(50%以上)' THEN 1
            END
    `);

    // 月別利益トレンド
    const monthlyProfitTrend = await executeQuery(`
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as month,
            COUNT(*) as foods_created,
            AVG(total_cost) as avg_cost,
            AVG(price) as avg_price,
            AVG(CASE WHEN price IS NOT NULL AND price > 0 THEN ((price - total_cost) / price) * 100 ELSE NULL END) as avg_profit_rate,
            SUM(CASE WHEN price IS NOT NULL THEN price - total_cost ELSE 0 END) as total_profit
        FROM completed_foods
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month DESC
    `);

    res.json({
        success: true,
        data: {
            profitabilityAnalysis,
            profitDistribution,
            monthlyProfitTrend
        },
        timestamp: new Date().toISOString(),
    });
}));

// データエクスポート (GET /api/reports/export)
router.get('/export', 
    query('format').isIn(['csv', 'json']).withMessage('フォーマットはcsvまたはjsonを指定してください'),
    query('type').isIn(['ingredients', 'dishes', 'foods', 'all']).withMessage('タイプはingredients、dishes、foods、allのいずれかを指定してください'),
    checkValidation,
    asyncHandler(async (req: Request, res: Response) => {
        const { format, type } = req.query;

        let data: any = {};

        if (type === 'ingredients' || type === 'all') {
            data.ingredients = await executeQuery(`
                SELECT 
                    i.*,
                    COUNT(di.dish_id) as usage_count,
                    SUM(di.used_cost) as total_used_cost
                FROM ingredients i
                LEFT JOIN dish_ingredients di ON i.id = di.ingredient_id
                GROUP BY i.id
                ORDER BY i.created_at DESC
            `);
        }

        if (type === 'dishes' || type === 'all') {
            data.dishes = await executeQuery(`
                SELECT 
                    d.*,
                    COUNT(di.ingredient_id) as ingredient_count,
                    COUNT(fd.food_id) as food_usage_count
                FROM dishes d
                LEFT JOIN dish_ingredients di ON d.id = di.dish_id
                LEFT JOIN food_dishes fd ON d.id = fd.dish_id
                GROUP BY d.id
                ORDER BY d.created_at DESC
            `);
        }

        if (type === 'foods' || type === 'all') {
            data.completedFoods = await executeQuery(`
                SELECT 
                    cf.*,
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
                GROUP BY cf.id
                ORDER BY cf.created_at DESC
            `);
        }

        if (format === 'csv') {
            // CSV形式での出力（簡易実装）
            let csvContent = '';
            Object.keys(data).forEach(key => {
                csvContent += `\n\n=== ${key.toUpperCase()} ===\n`;
                if (data[key].length > 0) {
                    const headers = Object.keys(data[key][0]);
                    csvContent += headers.join(',') + '\n';
                    data[key].forEach((row: any) => {
                        csvContent += headers.map(header => `"${row[header] || ''}"`).join(',') + '\n';
                    });
                }
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="cooking-cost-export-${type}-${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csvContent);
        } else {
            // JSON形式
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="cooking-cost-export-${type}-${new Date().toISOString().split('T')[0]}.json"`);
            res.json({
                exportedAt: new Date().toISOString(),
                type,
                data
            });
        }

        logger.info('Data exported', {
            format,
            type,
            recordCount: Object.values(data).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0)
        });
    })
);

export default router;