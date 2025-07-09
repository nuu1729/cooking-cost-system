<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>料理原価計算システム - インストール</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .install-container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
        }
        
        .install-header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .install-title {
            font-size: 2rem;
            color: #333;
            margin-bottom: 10px;
        }
        
        .install-subtitle {
            color: #666;
            font-size: 1.1rem;
        }
        
        .install-step {
            margin-bottom: 25px;
            padding: 20px;
            border: 2px solid #e0e0e0;
            border-radius: 12px;
        }
        
        .install-step.success {
            border-color: #4caf50;
            background: rgba(76, 175, 80, 0.1);
        }
        
        .install-step.error {
            border-color: #f44336;
            background: rgba(244, 67, 54, 0.1);
        }
        
        .step-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .step-content {
            color: #666;
            line-height: 1.6;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #555;
        }
        
        .form-input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s ease;
        }
        
        .form-input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .install-btn {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.3s ease;
            width: 100%;
        }
        
        .install-btn:hover {
            transform: translateY(-2px);
        }
        
        .install-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        
        .status-icon {
            font-size: 1.5rem;
        }
        
        .message {
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        
        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .progress {
            background: #f0f0f0;
            border-radius: 10px;
            height: 20px;
            margin: 15px 0;
            overflow: hidden;
        }
        
        .progress-bar {
            background: linear-gradient(45deg, #4caf50, #81c784);
            height: 100%;
            transition: width 0.3s ease;
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <div class="install-container">
        <div class="install-header">
            <h1 class="install-title">🍽️ 料理原価計算システム</h1>
            <p class="install-subtitle">インストールウィザード</p>
        </div>

        <?php
        $step = $_GET['step'] ?? 'check';
        $message = '';
        $messageType = '';

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if ($step === 'database') {
                // データベース設定処理
                $host = $_POST['db_host'] ?? 'localhost';
                $name = $_POST['db_name'] ?? 'cooking_cost_system';
                $user = $_POST['db_user'] ?? 'root';
                $pass = $_POST['db_pass'] ?? '';

                try {
                    // データベース接続テスト
                    $dsn = "mysql:host={$host};charset=utf8mb4";
                    $pdo = new PDO($dsn, $user, $pass);
                    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

                    // データベース作成
                    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                    $pdo->exec("USE `{$name}`");

                    // テーブル作成
                    $sql = file_get_contents(__DIR__ . '/setup.sql');
                    if ($sql) {
                        $pdo->exec($sql);
                        $message = 'データベースが正常にセットアップされました！';
                        $messageType = 'success';
                        $step = 'complete';
                    } else {
                        throw new Exception('setup.sqlファイルが見つかりません');
                    }

                    // config.phpファイル生成
                    $configContent = "<?php\n";
                    $configContent .= "define('DB_HOST', '{$host}');\n";
                    $configContent .= "define('DB_NAME', '{$name}');\n";
                    $configContent .= "define('DB_USER', '{$user}');\n";
                    $configContent .= "define('DB_PASS', '{$pass}');\n";
                    $configContent .= "define('DB_CHARSET', 'utf8mb4');\n\n";
                    $configContent .= "date_default_timezone_set('Asia/Tokyo');\n\n";
                    $configContent .= "error_reporting(E_ALL);\n";
                    $configContent .= "ini_set('display_errors', 1);\n\n";
                    $configContent .= "header('Content-Type: application/json; charset=utf-8');\n";
                    $configContent .= "header('Access-Control-Allow-Origin: *');\n";
                    $configContent .= "header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');\n";
                    $configContent .= "header('Access-Control-Allow-Headers: Content-Type, Authorization');\n\n";
                    $configContent .= "if (\$_SERVER['REQUEST_METHOD'] === 'OPTIONS') {\n";
                    $configContent .= "    http_response_code(200);\n";
                    $configContent .= "    exit();\n";
                    $configContent .= "}\n";
                    $configContent .= "?>";

                    file_put_contents(__DIR__ . '/config.php', $configContent);

                } catch (Exception $e) {
                    $message = 'エラー: ' . $e->getMessage();
                    $messageType = 'error';
                }
            }
        }

        // システム要件チェック
        function checkRequirements() {
            $checks = [
                'PHP Version (7.4+)' => version_compare(PHP_VERSION, '7.4.0', '>='),
                'PDO Extension' => extension_loaded('pdo'),
                'PDO MySQL Extension' => extension_loaded('pdo_mysql'),
                'JSON Extension' => extension_loaded('json'),
                'mbstring Extension' => extension_loaded('mbstring'),
                'Directory Writable' => is_writable(__DIR__),
            ];
            return $checks;
        }

        if ($step === 'check'): 
            $requirements = checkRequirements();
            $allPassed = !in_array(false, $requirements);
        ?>

        <div class="install-step <?= $allPassed ? 'success' : 'error' ?>">
            <div class="step-title">
                <span class="status-icon"><?= $allPassed ? '✅' : '❌' ?></span>
                システム要件チェック
            </div>
            <div class="step-content">
                <?php foreach ($requirements as $req => $passed): ?>
                    <div style="margin: 8px 0;">
                        <span style="color: <?= $passed ? '#4caf50' : '#f44336' ?>;">
                            <?= $passed ? '✓' : '✗' ?>
                        </span>
                        <?= $req ?>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>

        <?php if ($allPassed): ?>
            <a href="?step=database" class="install-btn">次へ: データベース設定</a>
        <?php else: ?>
            <div class="message error">
                システム要件を満たしていません。必要な拡張機能をインストールしてください。
            </div>
        <?php endif; ?>

        <?php elseif ($step === 'database'): ?>

        <div class="install-step">
            <div class="step-title">
                <span class="status-icon">🗄️</span>
                データベース設定
            </div>
            <div class="step-content">
                <form method="POST">
                    <div class="form-group">
                        <label class="form-label">ホスト名</label>
                        <input type="text" name="db_host" class="form-input" value="localhost" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">データベース名</label>
                        <input type="text" name="db_name" class="form-input" value="cooking_cost_system" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">ユーザー名</label>
                        <input type="text" name="db_user" class="form-input" value="root" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">パスワード</label>
                        <input type="password" name="db_pass" class="form-input">
                    </div>
                    
                    <button type="submit" class="install-btn">データベースをセットアップ</button>
                </form>
            </div>
        </div>

        <?php elseif ($step === 'complete'): ?>

        <div class="install-step success">
            <div class="step-title">
                <span class="status-icon">🎉</span>
                インストール完了
            </div>
            <div class="step-content">
                <p>料理原価計算システムのインストールが正常に完了しました！</p>
                <br>
                <p><strong>次のステップ:</strong></p>
                <ul style="margin-left: 20px; line-height: 1.8;">
                    <li>このinstall.phpファイルを削除してください（セキュリティのため）</li>
                    <li><a href="index.php" style="color: #667eea;">index.php</a>にアクセスしてシステムを使用開始</li>
                    <li>必要に応じて管理者設定を行ってください</li>
                </ul>
            </div>
        </div>

        <a href="index.php" class="install-btn">システムを開始</a>

        <?php endif; ?>

        <?php if ($message): ?>
        <div class="message <?= $messageType ?>">
            <?= htmlspecialchars($message) ?>
        </div>
        <?php endif; ?>

        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 0.9rem;">
            料理原価計算システム v5.0 - Made with hayate
        </div>
    </div>
</body>
</html>