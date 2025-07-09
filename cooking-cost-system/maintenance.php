<?php
// maintenance.php - メンテナンスモード
if (file_exists(__DIR__ . '/.maintenance')) {
    http_response_code(503);
    ?>
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>メンテナンス中</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
            }
            .maintenance-container {
                background: white;
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-width: 500px;
            }
            .maintenance-icon {
                font-size: 4rem;
                margin-bottom: 20px;
            }
            .maintenance-title {
                font-size: 2rem;
                color: #333;
                margin-bottom: 15px;
            }
            .maintenance-message {
                color: #666;
                font-size: 1.1rem;
                line-height: 1.6;
            }
        </style>
    </head>
    <body>
        <div class="maintenance-container">
            <div class="maintenance-icon">🔧</div>
            <h1 class="maintenance-title">メンテナンス中</h1>
            <p class="maintenance-message">
                現在システムのメンテナンスを行っております。<br>
                しばらくお待ちください。<br><br>
                ご不便をおかけして申し訳ございません。
            </p>
        </div>
    </body>
    </html>
    <?php
    exit;
}
?>
