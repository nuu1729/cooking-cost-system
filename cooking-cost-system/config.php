<?php
// config.php - 設定ファイル（XAMPP用修正版）

// ✅ XAMPP環境用の正しい設定
define('DB_HOST', 'localhost');
define('DB_NAME', 'cooking_cost_system');
define('DB_USER', 'root');                    // ← 'your_username' から変更
define('DB_PASS', '');                        // ← 'your_password' から変更（XAMPPの場合は空）
define('DB_CHARSET', 'utf8mb4');

// タイムゾーン設定
date_default_timezone_set('Asia/Tokyo');

// エラー報告設定（開発環境）
error_reporting(E_ALL);
ini_set('display_errors', 1);

// ✅ 改良済み: APIリクエスト時のみヘッダー設定（HTMLページで不適切なヘッダーを避ける）
if (strpos($_SERVER['REQUEST_URI'], 'api.php') !== false || 
    strpos($_SERVER['REQUEST_URI'], 'reports_api.php') !== false) {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

// OPTIONSリクエスト対応
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>