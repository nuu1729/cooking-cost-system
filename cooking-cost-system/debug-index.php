<?php
// debug-index.php - エラー確認用ファイル
// このファイルをプロジェクトフォルダに保存して http://localhost/cooking-cost-system/debug-index.php でアクセス

echo "<h1>🔍 システムデバッグ</h1>";

// エラー表示を強制的に有効にする
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

echo "<h2>✅ ステップ1: 基本動作確認</h2>";
echo "<p>PHPは正常に動作しています</p>";

echo "<h2>🔧 ステップ2: config.php確認</h2>";
if (file_exists('config.php')) {
    echo "<p>✅ config.php ファイル存在</p>";
    
    try {
        require_once 'config.php';
        echo "<p>✅ config.php 読み込み成功</p>";
        
        echo "<h3>📋 データベース設定</h3>";
        echo "<ul>";
        echo "<li>ホスト: " . (defined('DB_HOST') ? DB_HOST : '未定義') . "</li>";
        echo "<li>データベース: " . (defined('DB_NAME') ? DB_NAME : '未定義') . "</li>";
        echo "<li>ユーザー: " . (defined('DB_USER') ? DB_USER : '未定義') . "</li>";
        echo "<li>パスワード: " . (defined('DB_PASS') ? (empty(DB_PASS) ? '(空)' : '(設定済み)') : '未定義') . "</li>";
        echo "</ul>";
        
    } catch (Exception $e) {
        echo "<p>❌ config.php エラー: " . $e->getMessage() . "</p>";
    }
} else {
    echo "<p>❌ config.php ファイルが見つかりません</p>";
}

echo "<h2>🗄️ ステップ3: データベース接続テスト</h2>";
if (defined('DB_HOST')) {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        echo "<p>✅ データベース接続成功</p>";
        
        // テーブル確認
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "<p>テーブル数: " . count($tables) . "</p>";
        
    } catch (PDOException $e) {
        echo "<p>❌ データベース接続エラー: " . $e->getMessage() . "</p>";
    }
} else {
    echo "<p>❌ データベース設定が不完全です</p>";
}

echo "<h2>📁 ステップ4: 必要ファイル確認</h2>";
$required_files = [
    'index.php',
    'admin.php', 
    'api.php',
    'Database.php',
    'Response.php',
    'Validator.php',
    'utils.php',
    'models/Ingredient.php',
    'models/Dish.php',
    'models/CompletedFood.php',
    'models/Memo.php'
];

echo "<ul>";
foreach ($required_files as $file) {
    if (file_exists($file)) {
        echo "<li>✅ $file</li>";
    } else {
        echo "<li>❌ $file - 見つかりません</li>";
    }
}
echo "</ul>";

echo "<h2>🔧 ステップ5: PHP設定情報</h2>";
echo "<ul>";
echo "<li>PHPバージョン: " . PHP_VERSION . "</li>";
echo "<li>メモリ制限: " . ini_get('memory_limit') . "</li>";
echo "<li>最大実行時間: " . ini_get('max_execution_time') . "秒</li>";
echo "<li>エラー表示: " . (ini_get('display_errors') ? 'ON' : 'OFF') . "</li>";
echo "</ul>";

echo "<h2>📝 ステップ6: PHPエラーログ確認</h2>";
$error_log = ini_get('error_log');
if ($error_log && file_exists($error_log)) {
    echo "<p>エラーログファイル: $error_log</p>";
    $recent_errors = shell_exec("tail -10 $error_log 2>/dev/null");
    if ($recent_errors) {
        echo "<pre style='background:#f0f0f0; padding:10px;'>$recent_errors</pre>";
    }
} else {
    echo "<p>エラーログファイルが見つからないか、アクセスできません</p>";
}

echo "<h2>🎯 次のアクション</h2>";
echo "<ol>";
echo "<li>上記の❌マークがある項目を修正</li>";
echo "<li>特にconfig.phpとデータベース接続を確認</li>";
echo "<li>必要ファイルが不足している場合は追加</li>";
echo "<li>修正後に元のindex.phpにアクセス</li>";
echo "</ol>";

echo "<p><a href='index.php' style='padding:10px 15px; background:#007cba; color:white; text-decoration:none; border-radius:5px;'>修正後: 元のページにアクセス</a></p>";
?>

<style>
body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
h1 { color: #333; }
h2 { color: #666; border-bottom: 2px solid #eee; padding-bottom: 5px; }
ul { margin: 10px 0; }
pre { background: #f0f0f0; padding: 10px; overflow-x: auto; }
</style>