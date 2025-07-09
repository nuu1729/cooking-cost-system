<?php
// export.php - データエクスポート機能
require_once 'config.php';
require_once 'Database.php';
require_once 'utils.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['export'])) {
    try {
        $database = new Database();
        $db = $database->connect();
        
        $exportType = $_GET['export'];
        $format = $_GET['format'] ?? 'json';
        
        switch ($exportType) {
            case 'ingredients':
                $query = "SELECT * FROM ingredients ORDER BY name";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $data = $stmt->fetchAll();
                
                if ($format === 'csv') {
                    Utils::arrayToCSV($data, 'ingredients_' . date('Y-m-d') . '.csv');
                } else {
                    Utils::jsonResponse(['success' => true, 'data' => $data]);
                }
                break;
                
            case 'dishes':
                $query = "SELECT d.*, GROUP_CONCAT(i.name SEPARATOR ', ') as ingredients_list 
                         FROM dishes d 
                         LEFT JOIN dish_ingredients di ON d.id = di.dish_id 
                         LEFT JOIN ingredients i ON di.ingredient_id = i.id 
                         GROUP BY d.id ORDER BY d.name";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $data = $stmt->fetchAll();
                
                if ($format === 'csv') {
                    Utils::arrayToCSV($data, 'dishes_' . date('Y-m-d') . '.csv');
                } else {
                    Utils::jsonResponse(['success' => true, 'data' => $data]);
                }
                break;
                
            case 'foods':
                $query = "SELECT * FROM completed_foods ORDER BY name";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $data = $stmt->fetchAll();
                
                if ($format === 'csv') {
                    Utils::arrayToCSV($data, 'completed_foods_' . date('Y-m-d') . '.csv');
                } else {
                    Utils::jsonResponse(['success' => true, 'data' => $data]);
                }
                break;
                
            default:
                Utils::jsonResponse(['success' => false, 'message' => '無効なエクスポートタイプです'], 400);
        }
        
    } catch (Exception $e) {
        Utils::log('ERROR', 'Export failed: ' . $e->getMessage());
        Utils::jsonResponse(['success' => false, 'message' => 'エクスポートに失敗しました'], 500);
    }
}
?>