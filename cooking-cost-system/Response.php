<?php
// Response.php - APIレスポンス用クラス

class Response {
    public static function json($data, $status_code = 200) {
        http_response_code($status_code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit();
    }
    
    public static function success($data = null, $message = 'Success') {
        self::json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ]);
    }
    
    public static function error($message = 'Error', $status_code = 400, $details = null) {
        self::json([
            'success' => false,
            'message' => $message,
            'details' => $details
        ], $status_code);
    }
    
    public static function notFound($message = 'Not Found') {
        self::error($message, 404);
    }
    
    public static function serverError($message = 'Internal Server Error') {
        self::error($message, 500);
    }
}
?>
