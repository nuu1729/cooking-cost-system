<?php
// utils.php - ユーティリティ関数集

class Utils {
    /**
     * 価格を適切な形式でフォーマット
     */
    public static function formatPrice($price, $currency = '¥') {
        return $currency . number_format($price, 2);
    }
    
    /**
     * 日付を日本語形式でフォーマット
     */
    public static function formatDate($date, $format = 'Y年m月d日 H:i') {
        if (is_string($date)) {
            $date = new DateTime($date);
        }
        return $date->format($format);
    }
    
    /**
     * 単価計算
     */
    public static function calculateUnitPrice($price, $quantity) {
        if ($quantity <= 0) {
            throw new Exception('数量は0より大きい必要があります');
        }
        return $price / $quantity;
    }
    
    /**
     * 使用コスト計算
     */
    public static function calculateUsageCost($unitPrice, $usageQuantity) {
        return $unitPrice * $usageQuantity;
    }
    
    /**
     * 利益率計算
     */
    public static function calculateProfitMargin($sellingPrice, $cost) {
        if ($sellingPrice <= 0) {
            return 0;
        }
        return (($sellingPrice - $cost) / $sellingPrice) * 100;
    }
    
    /**
     * ファイルサイズを人間が読みやすい形式に変換
     */
    public static function formatFileSize($bytes) {
        $units = ['B', 'KB', 'MB', 'GB'];
        $factor = floor((strlen($bytes) - 1) / 3);
        return sprintf("%.2f", $bytes / pow(1024, $factor)) . ' ' . $units[$factor];
    }
    
    /**
     * 配列をCSV形式に変換
     */
    public static function arrayToCSV($data, $filename = 'export.csv') {
        if (empty($data)) {
            throw new Exception('エクスポートするデータがありません');
        }
        
        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Pragma: no-cache');
        header('Expires: 0');
        
        // BOM追加（Excel対応）
        echo "\xEF\xBB\xBF";
        
        $output = fopen('php://output', 'w');
        
        // ヘッダー行
        if (!empty($data)) {
            fputcsv($output, array_keys($data[0]));
        }
        
        // データ行
        foreach ($data as $row) {
            fputcsv($output, $row);
        }
        
        fclose($output);
    }
    
    /**
     * JSON形式でのレスポンス
     */
    public static function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
    
    /**
     * ログ出力
     */
    public static function log($level, $message, $context = []) {
        $logFile = __DIR__ . '/logs/app.log';
        
        // ログディレクトリ作成
        $logDir = dirname($logFile);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        $timestamp = date('Y-m-d H:i:s');
        $contextStr = empty($context) ? '' : ' ' . json_encode($context, JSON_UNESCAPED_UNICODE);
        $logEntry = "[{$timestamp}] {$level}: {$message}{$contextStr}" . PHP_EOL;
        
        file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * セキュアなランダム文字列生成
     */
    public static function generateSecureToken($length = 32) {
        return bin2hex(random_bytes($length / 2));
    }
    
    /**
     * SQLクエリのデバッグ用ログ
     */
    public static function logQuery($query, $params = [], $executionTime = null) {
        if (defined('DEBUG_QUERIES') && DEBUG_QUERIES) {
            $message = "SQL: {$query}";
            if (!empty($params)) {
                $message .= " | Params: " . json_encode($params, JSON_UNESCAPED_UNICODE);
            }
            if ($executionTime !== null) {
                $message .= " | Time: {$executionTime}ms";
            }
            self::log('DEBUG', $message);
        }
    }
    
    /**
     * メモリ使用量取得
     */
    public static function getMemoryUsage() {
        return [
            'current' => self::formatFileSize(memory_get_usage()),
            'peak' => self::formatFileSize(memory_get_peak_usage()),
            'limit' => ini_get('memory_limit')
        ];
    }
    
    /**
     * システム情報取得
     */
    public static function getSystemInfo() {
        return [
            'php_version' => PHP_VERSION,
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'memory_usage' => self::getMemoryUsage(),
            'max_execution_time' => ini_get('max_execution_time'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size')
        ];
    }
}
