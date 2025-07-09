<?php
// config.php - 設定ファイル
define('DB_HOST', 'localhost');
define('DB_NAME', 'cooking_cost_system');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
define('DB_CHARSET', 'utf8mb4');

// タイムゾーン設定
date_default_timezone_set('Asia/Tokyo');

// エラー報告設定（開発環境）
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS設定（必要に応じて）
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// OPTIONSリクエスト対応
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

?>