-- setup.sql - 完全なデータベースセットアップ
-- 料理原価計算システム v5.0

-- データベース作成（既存の場合はスキップ）
CREATE DATABASE IF NOT EXISTS cooking_cost_system 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE cooking_cost_system;

-- 既存テーブル削除（クリーンインストール用）
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS food_dishes;
DROP TABLE IF EXISTS dish_ingredients;
DROP TABLE IF EXISTS completed_foods;
DROP TABLE IF EXISTS dishes;
DROP TABLE IF EXISTS ingredients;
DROP TABLE IF EXISTS memos;
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS system_settings;
SET FOREIGN_KEY_CHECKS = 1;

-- 食材テーブル
CREATE TABLE ingredients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL COMMENT '食材名',
    store VARCHAR(100) NOT NULL COMMENT '購入場所',
    quantity DECIMAL(10,2) NOT NULL COMMENT '購入量',
    unit VARCHAR(20) NOT NULL COMMENT '単位',
    price DECIMAL(10,2) NOT NULL COMMENT '購入価格',
    unit_price DECIMAL(10,4) NOT NULL COMMENT '単価',
    genre ENUM('meat', 'vegetable', 'seasoning', 'sauce', 'frozen', 'drink') DEFAULT 'meat' COMMENT 'ジャンル',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    INDEX idx_name (name),
    INDEX idx_store (store),
    INDEX idx_genre (genre),
    INDEX idx_created_at (created_at),
    UNIQUE KEY uk_ingredient (name, store, unit)
) ENGINE=InnoDB COMMENT='食材マスタ';

-- 料理テーブル
CREATE TABLE dishes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL COMMENT '料理名',
    total_cost DECIMAL(10,2) NOT NULL COMMENT '総コスト',
    genre ENUM('meat', 'vegetable', 'seasoning', 'sauce', 'frozen', 'drink') DEFAULT 'meat' COMMENT 'ジャンル',
    description TEXT COMMENT '説明',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    INDEX idx_name (name),
    INDEX idx_genre (genre),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='料理マスタ';

-- 料理-食材関連テーブル
CREATE TABLE dish_ingredients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dish_id INT NOT NULL COMMENT '料理ID',
    ingredient_id INT NOT NULL COMMENT '食材ID',
    used_quantity DECIMAL(10,2) NOT NULL COMMENT '使用量',
    used_cost DECIMAL(10,2) NOT NULL COMMENT '使用コスト',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
    INDEX idx_dish (dish_id),
    INDEX idx_ingredient (ingredient_id),
    UNIQUE KEY uk_dish_ingredient (dish_id, ingredient_id)
) ENGINE=InnoDB COMMENT='料理-食材関連';

-- 完成品テーブル
CREATE TABLE completed_foods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL COMMENT '完成品名',
    price DECIMAL(10,2) DEFAULT NULL COMMENT '販売価格',
    total_cost DECIMAL(10,2) NOT NULL COMMENT '総原価',
    description TEXT COMMENT '説明',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    INDEX idx_name (name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='完成品マスタ';

-- 完成品-料理関連テーブル
CREATE TABLE food_dishes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    food_id INT NOT NULL COMMENT '完成品ID',
    dish_id INT NOT NULL COMMENT '料理ID',
    usage_quantity DECIMAL(10,4) NOT NULL DEFAULT 1.0 COMMENT '使用量',
    usage_unit ENUM('割合', '人前') DEFAULT '割合' COMMENT '使用単位',
    usage_cost DECIMAL(10,2) NOT NULL COMMENT '使用コスト',
    description VARCHAR(255) DEFAULT NULL COMMENT '説明',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    FOREIGN KEY (food_id) REFERENCES completed_foods(id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
    INDEX idx_food (food_id),
    INDEX idx_dish (dish_id)
) ENGINE=InnoDB COMMENT='完成品-料理関連';

-- メモテーブル
CREATE TABLE memos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    content TEXT COMMENT 'メモ内容',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時'
) ENGINE=InnoDB COMMENT='メモ';

-- 活動ログテーブル
CREATE TABLE activity_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    action_type ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL COMMENT 'アクション種別',
    table_name VARCHAR(50) NOT NULL COMMENT 'テーブル名',
    record_id INT NOT NULL COMMENT 'レコードID',
    record_name VARCHAR(255) DEFAULT NULL COMMENT 'レコード名',
    old_values JSON DEFAULT NULL COMMENT '変更前の値',
    new_values JSON DEFAULT NULL COMMENT '変更後の値',
    ip_address VARCHAR(45) DEFAULT NULL COMMENT 'IPアドレス',
    user_agent TEXT DEFAULT NULL COMMENT 'ユーザーエージェント',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    INDEX idx_action_type (action_type),
    INDEX idx_table_name (table_name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='活動ログ';

-- システム設定テーブル
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE COMMENT '設定キー',
    setting_value TEXT COMMENT '設定値',
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string' COMMENT '設定タイプ',
    description TEXT COMMENT '説明',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB COMMENT='システム設定';

-- 初期メモレコード挿入
INSERT INTO memos (content) VALUES ('料理原価計算システムへようこそ！\n\nここにメモを記録できます。');

-- 初期システム設定
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('price_precision', '2', 'number', '価格表示の小数点桁数'),
('currency_symbol', '¥', 'string', '通貨記号'),
('auto_backup', 'true', 'boolean', '自動バックアップ有効/無効'),
('data_retention_days', '90', 'number', 'データ保持期間（日）'),
('system_version', '5.0', 'string', 'システムバージョン'),
('default_genre', 'meat', 'string', 'デフォルトジャンル'),
('max_upload_size', '10485760', 'number', '最大アップロードサイズ（バイト）'),
('enable_logging', 'true', 'boolean', 'ログ機能有効/無効');

-- サンプルデータ挿入
INSERT INTO ingredients (name, store, quantity, unit, price, unit_price, genre) VALUES
('鶏もも肉', 'DIO', 300, 'g', 250, 0.83, 'meat'),
('玉ねぎ', 'コスモス', 3, '個', 150, 50, 'vegetable'),
('人参', 'コスモス', 3, '個', 120, 40, 'vegetable'),
('じゃがいも', 'ニシナ', 5, '個', 200, 40, 'vegetable'),
('醤油', 'ニシナ', 1000, 'ml', 180, 0.18, 'seasoning'),
('サラダ油', 'DIO', 500, 'ml', 220, 0.44, 'seasoning'),
('塩', 'コープ', 1000, 'g', 100, 0.10, 'seasoning'),
('胡椒', 'コープ', 20, 'g', 150, 7.50, 'seasoning'),
('ケチャップ', 'DIO', 500, 'ml', 200, 0.40, 'sauce'),
('マヨネーズ', 'DIO', 400, 'ml', 180, 0.45, 'sauce'),
('冷凍ポテト', 'コスモス', 1000, 'g', 300, 0.30, 'frozen'),
('コーラ', 'ニシナ', 1500, 'ml', 150, 0.10, 'drink');

-- サンプル料理データ
INSERT INTO dishes (name, total_cost, genre, description) VALUES
('唐揚げ', 180, 'meat', '鶏もも肉を使った定番料理'),
('ポテトサラダ', 120, 'vegetable', '野菜たっぷりのサラダ'),
('フライドポテト', 90, 'frozen', '冷凍ポテトを使用');

-- サンプル料理-食材関連データ
INSERT INTO dish_ingredients (dish_id, ingredient_id, used_quantity, used_cost) VALUES
(1, 1, 200, 166), -- 唐揚げ: 鶏もも肉200g
(1, 5, 30, 5.4),  -- 唐揚げ: 醤油30ml
(1, 6, 20, 8.8),  -- 唐揚げ: サラダ油20ml
(2, 4, 2, 80),    -- ポテトサラダ: じゃがいも2個
(2, 3, 1, 40),    -- ポテトサラダ: 人参1個
(2, 10, 20, 9),   -- ポテトサラダ: マヨネーズ20ml
(3, 11, 200, 60), -- フライドポテト: 冷凍ポテト200g
(3, 7, 2, 0.2);   -- フライドポテト: 塩2g

-- サンプル完成品データ
INSERT INTO completed_foods (name, price, total_cost, description) VALUES
('唐揚げ定食', 650, 320, '唐揚げ、ポテトサラダ、ご飯のセット'),
('フライドポテトセット', 450, 240, 'フライドポテトとドリンクのセット');

-- サンプル完成品-料理関連データ
INSERT INTO food_dishes (food_id, dish_id, usage_quantity, usage_unit, usage_cost, description) VALUES
(1, 1, 1.0, '人前', 180, 'メイン'),
(1, 2, 0.8, '割合', 96, 'サイド'),
(1, 3, 0.5, '割合', 45, 'ガーニッシュ'),
(2, 3, 1.0, '人前', 90, 'メイン');

-- パフォーマンス向上のためのインデックス追加
CREATE INDEX idx_ingredients_search ON ingredients(name, store);
CREATE INDEX idx_dishes_search ON dishes(name);
CREATE INDEX idx_foods_search ON completed_foods(name);
CREATE INDEX idx_ingredients_unit_price ON ingredients(unit_price);
CREATE INDEX idx_dishes_total_cost ON dishes(total_cost);
CREATE INDEX idx_foods_total_cost ON completed_foods(total_cost);

-- 統計用ビューの作成
CREATE VIEW v_ingredient_statistics AS
SELECT 
    genre,
    COUNT(*) as ingredient_count,
    AVG(unit_price) as avg_unit_price,
    MIN(unit_price) as min_unit_price,
    MAX(unit_price) as max_unit_price,
    SUM(price) as total_purchase_cost
FROM ingredients 
GROUP BY genre;

CREATE VIEW v_dish_statistics AS
SELECT 
    genre,
    COUNT(*) as dish_count,
    AVG(total_cost) as avg_total_cost,
    MIN(total_cost) as min_total_cost,
    MAX(total_cost) as max_total_cost
FROM dishes 
GROUP BY genre;

CREATE VIEW v_popular_ingredients AS
SELECT 
    i.name,
    i.store,
    i.genre,
    COUNT(di.dish_id) as usage_count,
    AVG(di.used_quantity) as avg_used_quantity,
    SUM(di.used_cost) as total_used_cost
FROM ingredients i
LEFT JOIN dish_ingredients di ON i.id = di.ingredient_id
GROUP BY i.id
ORDER BY usage_count DESC;

CREATE VIEW v_cost_efficiency AS
SELECT 
    cf.name as food_name,
    cf.price as selling_price,
    cf.total_cost,
    (cf.price - cf.total_cost) as profit,
    CASE 
        WHEN cf.price > 0 THEN ROUND(((cf.price - cf.total_cost) / cf.price) * 100, 2)
        ELSE NULL 
    END as profit_margin_percent,
    cf.created_at
FROM completed_foods cf
WHERE cf.price IS NOT NULL
ORDER BY profit_margin_percent DESC;

-- データベースの文字セット確認と最適化
ALTER DATABASE cooking_cost_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- テーブル統計の更新
ANALYZE TABLE ingredients, dishes, completed_foods, dish_ingredients, food_dishes, memos, activity_log, system_settings;

-- 権限設定用のSQL（必要に応じて実行）
-- CREATE USER 'cooking_app'@'localhost' IDENTIFIED BY 'secure_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON cooking_cost_system.* TO 'cooking_app'@'localhost';
-- GRANT EXECUTE ON cooking_cost_system.* TO 'cooking_app'@'localhost';
-- FLUSH PRIVILEGES;

-- セットアップ完了の確認
SELECT 'データベースセットアップが完了しました' as message,
       COUNT(*) as sample_ingredients_count 
FROM ingredients;

SELECT 'サンプルデータの確認' as message,
       (SELECT COUNT(*) FROM ingredients) as ingredients,
       (SELECT COUNT(*) FROM dishes) as dishes,
       (SELECT COUNT(*) FROM completed_foods) as completed_foods,
       (SELECT COUNT(*) FROM system_settings) as settings;

-- ストレージエンジンとテーブルサイズの確認
SELECT 
    table_name,
    engine,
    table_rows,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb
FROM information_schema.tables 
WHERE table_schema = 'cooking_cost_system' 
ORDER BY (data_length + index_length) DESC;
