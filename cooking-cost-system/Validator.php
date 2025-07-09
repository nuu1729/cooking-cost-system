<?php
// Validator.php - バリデーション用クラス

class Validator {
    public static function required($value, $field_name) {
        if (empty($value) && $value !== '0') {
            throw new Exception("{$field_name}は必須です");
        }
        return true;
    }
    
    public static function numeric($value, $field_name) {
        if (!is_numeric($value)) {
            throw new Exception("{$field_name}は数値である必要があります");
        }
        return true;
    }
    
    public static function positive($value, $field_name) {
        if (floatval($value) <= 0) {
            throw new Exception("{$field_name}は0より大きい値である必要があります");
        }
        return true;
    }
    
    public static function maxLength($value, $max_length, $field_name) {
        if (mb_strlen($value) > $max_length) {
            throw new Exception("{$field_name}は{$max_length}文字以内である必要があります");
        }
        return true;
    }
    
    public static function enum($value, $allowed_values, $field_name) {
        if (!in_array($value, $allowed_values)) {
            throw new Exception("{$field_name}は有効な値である必要があります");
        }
        return true;
    }
    
    // 食材データのバリデーション
    public static function validateIngredient($data) {
        self::required($data['name'] ?? '', '食材名');
        self::maxLength($data['name'] ?? '', 255, '食材名');
        
        self::required($data['store'] ?? '', '購入場所');
        self::maxLength($data['store'] ?? '', 100, '購入場所');
        
        self::required($data['quantity'] ?? '', '購入量');
        self::numeric($data['quantity'] ?? '', '購入量');
        self::positive($data['quantity'] ?? '', '購入量');
        
        self::required($data['unit'] ?? '', '単位');
        self::maxLength($data['unit'] ?? '', 20, '単位');
        
        self::required($data['price'] ?? '', '価格');
        self::numeric($data['price'] ?? '', '価格');
        self::positive($data['price'] ?? '', '価格');
        
        $allowed_genres = ['meat', 'vegetable', 'seasoning', 'sauce', 'frozen', 'drink'];
        self::enum($data['genre'] ?? 'meat', $allowed_genres, 'ジャンル');
        
        return true;
    }
    
    // 料理データのバリデーション
    public static function validateDish($data) {
        self::required($data['name'] ?? '', '料理名');
        self::maxLength($data['name'] ?? '', 255, '料理名');
        
        if (isset($data['ingredients']) && !is_array($data['ingredients'])) {
            throw new Exception('食材リストは配列である必要があります');
        }
        
        if (empty($data['ingredients'])) {
            throw new Exception('最低1つの食材が必要です');
        }
        
        foreach ($data['ingredients'] as $ingredient) {
            self::required($ingredient['ingredient_id'] ?? '', '食材ID');
            self::numeric($ingredient['ingredient_id'] ?? '', '食材ID');
            
            self::required($ingredient['used_quantity'] ?? '', '使用量');
            self::numeric($ingredient['used_quantity'] ?? '', '使用量');
            self::positive($ingredient['used_quantity'] ?? '', '使用量');
        }
        
        return true;
    }
    
    // 完成品データのバリデーション
    public static function validateCompletedFood($data) {
        self::required($data['name'] ?? '', '完成品名');
        self::maxLength($data['name'] ?? '', 255, '完成品名');
        
        if (isset($data['price'])) {
            self::numeric($data['price'], '価格');
            self::positive($data['price'], '価格');
        }
        
        if (isset($data['dishes']) && !is_array($data['dishes'])) {
            throw new Exception('料理リストは配列である必要があります');
        }
        
        return true;
    }
}
?>
