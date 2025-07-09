<?php
// reports_api.php - レポート用API
require_once 'config.php';
require_once 'Database.php';
require_once 'Response.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $database = new Database();
        $db = $database->connect();
        
        $reportType = $_GET['type'] ?? 'summary';
        
        switch ($reportType) {
            case 'summary':
                // 概要統計
                $stats = [];
                
                // 食材数
                $stmt = $db->prepare("SELECT COUNT(*) as count FROM ingredients");
                $stmt->execute();
                $stats['ingredients_count'] = $stmt->fetch()['count'];
                
                // 料理数
                $stmt = $db->prepare("SELECT COUNT(*) as count FROM dishes");
                $stmt->execute();
                $stats['dishes_count'] = $stmt->fetch()['count'];
                
                // 完成品数
                $stmt = $db->prepare("SELECT COUNT(*) as count FROM completed_foods");
                $stmt->execute();
                $stats['foods_count'] = $stmt->fetch()['count'];
                
                // 平均原価
                $stmt = $db->prepare("SELECT AVG(total_cost) as avg_cost FROM completed_foods");
                $stmt->execute();
                $stats['average_cost'] = $stmt->fetch()['avg_cost'] ?: 0;
                
                // ジャンル別統計
                $stmt = $db->prepare("SELECT genre, COUNT(*) as count FROM ingredients GROUP BY genre");
                $stmt->execute();
                $stats['genre_distribution'] = $stmt->fetchAll();
                
                Response::success($stats);
                break;
                
            case 'cost_analysis':
                // コスト分析
                $period = $_GET['period'] ?? '30';
                
                $stmt = $db->prepare("
                    SELECT DATE(created_at) as date, 
                           COUNT(*) as items_created,
                           AVG(total_cost) as avg_cost
                    FROM completed_foods 
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                    GROUP BY DATE(created_at)
                    ORDER BY date DESC
                ");
                $stmt->execute([$period]);
                $analysis = $stmt->fetchAll();
                
                Response::success($analysis);
                break;
                
            case 'efficiency':
                // 効率分析
                $stmt = $db->prepare("
                    SELECT i.name,
                           i.unit_price,
                           COUNT(di.dish_id) as usage_count,
                           AVG(di.used_quantity) as avg_usage
                    FROM ingredients i
                    LEFT JOIN dish_ingredients di ON i.id = di.ingredient_id
                    GROUP BY i.id
                    ORDER BY usage_count DESC
                    LIMIT 20
                ");
                $stmt->execute();
                $efficiency = $stmt->fetchAll();
                
                Response::success($efficiency);
                break;
                
            case 'ingredient_price_trends':
                // 食材価格トレンド分析
                $period = $_GET['period'] ?? '90';
                
                $stmt = $db->prepare("
                    SELECT DATE(updated_at) as date,
                           name,
                           store,
                           unit_price,
                           genre
                    FROM ingredients 
                    WHERE updated_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                    ORDER BY updated_at DESC
                ");
                $stmt->execute([$period]);
                $trends = $stmt->fetchAll();
                
                Response::success($trends);
                break;
                
            case 'popular_dishes':
                // 人気料理ランキング
                $stmt = $db->prepare("
                    SELECT d.name,
                           d.total_cost,
                           d.genre,
                           COUNT(fd.dish_id) as usage_count,
                           AVG(fd.usage_cost) as avg_usage_cost
                    FROM dishes d
                    LEFT JOIN food_dishes fd ON d.id = fd.dish_id
                    GROUP BY d.id
                    ORDER BY usage_count DESC, d.total_cost ASC
                    LIMIT 15
                ");
                $stmt->execute();
                $popular = $stmt->fetchAll();
                
                Response::success($popular);
                break;
                
            case 'cost_efficiency':
                // コスト効率分析
                $stmt = $db->prepare("
                    SELECT cf.name,
                           cf.total_cost,
                           cf.price,
                           (cf.price - cf.total_cost) as profit,
                           CASE 
                               WHEN cf.price > 0 THEN ROUND(((cf.price - cf.total_cost) / cf.price) * 100, 2)
                               ELSE NULL 
                           END as profit_margin_percent,
                           cf.created_at
                    FROM completed_foods cf
                    WHERE cf.price IS NOT NULL AND cf.price > 0
                    ORDER BY profit_margin_percent DESC
                    LIMIT 20
                ");
                $stmt->execute();
                $efficiency = $stmt->fetchAll();
                
                Response::success($efficiency);
                break;
                
            case 'monthly_summary':
                // 月次サマリー
                $stmt = $db->prepare("
                    SELECT 
                        DATE_FORMAT(created_at, '%Y-%m') as month,
                        COUNT(*) as total_items,
                        AVG(total_cost) as avg_cost,
                        MIN(total_cost) as min_cost,
                        MAX(total_cost) as max_cost,
                        SUM(total_cost) as total_cost_sum
                    FROM completed_foods
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                    ORDER BY month DESC
                ");
                $stmt->execute();
                $monthly = $stmt->fetchAll();
                
                Response::success($monthly);
                break;
                
            case 'database_info':
                // データベース情報
                $info = [];
                
                // テーブルサイズ情報
                $stmt = $db->prepare("
                    SELECT 
                        table_name,
                        table_rows,
                        ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb
                    FROM information_schema.tables 
                    WHERE table_schema = DATABASE()
                    ORDER BY (data_length + index_length) DESC
                ");
                $stmt->execute();
                $info['table_sizes'] = $stmt->fetchAll();
                
                // データベース合計サイズ
                $stmt = $db->prepare("
                    SELECT 
                        ROUND(SUM((data_length + index_length) / 1024 / 1024), 2) as total_size_mb
                    FROM information_schema.tables 
                    WHERE table_schema = DATABASE()
                ");
                $stmt->execute();
                $info['total_size'] = $stmt->fetch()['total_size_mb'];
                
                // 各テーブルのレコード数
                $tables = ['ingredients', 'dishes', 'completed_foods', 'dish_ingredients', 'food_dishes', 'memos'];
                $info['record_counts'] = [];
                
                foreach ($tables as $table) {
                    $stmt = $db->prepare("SELECT COUNT(*) as count FROM {$table}");
                    $stmt->execute();
                    $info['record_counts'][$table] = $stmt->fetch()['count'];
                }
                
                Response::success($info);
                break;
                
            default:
                Response::error('無効なレポートタイプです', 400);
        }
        
    } catch (Exception $e) {
        Utils::log('ERROR', 'Report generation failed: ' . $e->getMessage());
        Response::serverError('レポート生成に失敗しました');
    }
} else {
    Response::error('GETメソッドのみサポートしています', 405);
}
?>
