-- 料理原価計算システム v2.0 (Node.js + React版)

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';

-- 既存テーブル削除（クリーンインストール用）
DROP TABLE IF EXISTS `food_dishes`;
DROP TABLE IF EXISTS `dish_ingredients`;
DROP TABLE IF EXISTS `completed_foods`;
DROP TABLE IF EXISTS `dishes`;
DROP TABLE IF EXISTS `ingredients`;
DROP TABLE IF EXISTS `memos`;
DROP TABLE IF EXISTS `activity_logs`;
DROP TABLE IF EXISTS `system_settings`;

-- 食材テーブル
CREATE TABLE `ingredients` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL COMMENT '食材名',
    `store` VARCHAR(100) NOT NULL COMMENT '購入場所',
    `quantity` DECIMAL(10,2) NOT NULL COMMENT '購入量',
    `unit` VARCHAR(20) NOT NULL COMMENT '単位',
    `price` DECIMAL(10,2) NOT NULL COMMENT '購入価格',
    `unit_price` DECIMAL(10,4) NOT NULL COMMENT '単価（自動計算）',
    `genre` ENUM('meat', 'vegetable', 'seasoning', 'sauce', 'frozen', 'drink') NOT NULL DEFAULT 'meat' COMMENT 'ジャンル',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    PRIMARY KEY (`id`),
    INDEX `idx_name` (`name`),
    INDEX `idx_store` (`store`),
    INDEX `idx_genre` (`genre`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_unit_price` (`unit_price`),
    UNIQUE KEY `uk_ingredient` (`name`, `store`, `unit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='食材マスタ';

-- 料理テーブル
CREATE TABLE `dishes` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL COMMENT '料理名',
    `total_cost` DECIMAL(10,2) NOT NULL COMMENT '総コスト',
    `genre` VARCHAR(50) NOT NULL DEFAULT 'meat' COMMENT 'ジャンル',
    `description` TEXT NULL COMMENT '説明',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    PRIMARY KEY (`id`),
    INDEX `idx_name` (`name`),
    INDEX `idx_genre` (`genre`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_total_cost` (`total_cost`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='料理マスタ';

-- 料理-食材関連テーブル
CREATE TABLE `dish_ingredients` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `dish_id` INT NOT NULL COMMENT '料理ID',
    `ingredient_id` INT NOT NULL COMMENT '食材ID',
    `used_quantity` DECIMAL(10,2) NOT NULL COMMENT '使用量',
    `used_cost` DECIMAL(10,2) NOT NULL COMMENT '使用コスト',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_dish_ingredients_dish` 
        FOREIGN KEY (`dish_id`) REFERENCES `dishes` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_dish_ingredients_ingredient` 
        FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_dish` (`dish_id`),
    INDEX `idx_ingredient` (`ingredient_id`),
    UNIQUE KEY `uk_dish_ingredient` (`dish_id`, `ingredient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='料理-食材関連';

-- 完成品テーブル
CREATE TABLE `completed_foods` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL COMMENT '完成品名',
    `price` DECIMAL(10,2) NULL COMMENT '販売価格',
    `total_cost` DECIMAL(10,2) NOT NULL COMMENT '総原価',
    `description` TEXT NULL COMMENT '説明',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    PRIMARY KEY (`id`),
    INDEX `idx_name` (`name`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_total_cost` (`total_cost`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='完成品マスタ';

-- 完成品-料理関連テーブル
CREATE TABLE `food_dishes` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `food_id` INT NOT NULL COMMENT '完成品ID',
    `dish_id` INT NOT NULL COMMENT '料理ID',
    `usage_quantity` DECIMAL(10,4) NOT NULL DEFAULT 1.0000 COMMENT '使用量',
    `usage_unit` ENUM('ratio', 'serving') NOT NULL DEFAULT 'ratio' COMMENT '使用単位',
    `usage_cost` DECIMAL(10,2) NOT NULL COMMENT '使用コスト',
    `description` VARCHAR(255) NULL COMMENT '説明',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_food_dishes_food` 
        FOREIGN KEY (`food_id`) REFERENCES `completed_foods` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_food_dishes_dish` 
        FOREIGN KEY (`dish_id`) REFERENCES `dishes` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_food` (`food_id`),
    INDEX `idx_dish` (`dish_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='完成品-料理関連';

-- メモテーブル
CREATE TABLE `memos` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `content` TEXT NULL COMMENT 'メモ内容',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='メモ';

-- 活動ログテーブル
CREATE TABLE `activity_logs` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `action_type` ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL COMMENT 'アクション種別',
    `table_name` VARCHAR(50) NOT NULL COMMENT 'テーブル名',
    `record_id` INT NOT NULL COMMENT 'レコードID',
    `record_name` VARCHAR(255) NULL COMMENT 'レコード名',
    `old_values` JSON NULL COMMENT '変更前の値',
    `new_values` JSON NULL COMMENT '変更後の値',
    `ip_address` VARCHAR(45) NULL COMMENT 'IPアドレス',
    `user_agent` TEXT NULL COMMENT 'ユーザーエージェント',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    PRIMARY KEY (`id`),
    INDEX `idx_action_type` (`action_type`),
    INDEX `idx_table_name` (`table_name`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活動ログ';

-- システム設定テーブル
CREATE TABLE `system_settings` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `setting_key` VARCHAR(100) NOT NULL UNIQUE COMMENT '設定キー',
    `setting_value` TEXT NULL COMMENT '設定値',
    `setting_type` ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string' COMMENT '設定タイプ',
    `description` TEXT NULL COMMENT '説明',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='システム設定';

-- 初期データ挿入

-- メモ初期化
INSERT INTO `memos` (`content`) VALUES 
('🍽️ 料理原価計算システム v2.0 へようこそ！\n\n✨ 新機能:\n- モダンなReact + TypeScript UI\n- ドラッグ&ドロップ操作\n- リアルタイムコスト計算\n- レスポンシブデザイン\n\n📝 使い方:\n1. 食材を登録\n2. 料理を作成（食材をドラッグ&ドロップ）\n3. 完成品を登録（料理をドラッグ&ドロップ）\n4. 原価と利益率を確認\n\nここにメモを記録できます！');

-- システム設定初期化
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `setting_type`, `description`) VALUES
('price_precision', '2', 'number', '価格表示の小数点桁数'),
('currency_symbol', '¥', 'string', '通貨記号'),
('auto_backup', 'true', 'boolean', '自動バックアップ有効/無効'),
('data_retention_days', '90', 'number', 'データ保持期間（日）'),
('system_version', '2.0', 'string', 'システムバージョン'),
('default_genre', 'meat', 'string', 'デフォルトジャンル'),
('max_upload_size', '10485760', 'number', '最大アップロードサイズ（バイト）'),
('enable_logging', 'true', 'boolean', 'ログ機能有効/無効'),
('ui_theme', 'modern', 'string', 'UIテーマ'),
('language', 'ja', 'string', '言語設定');

-- サンプルデータ挿入
INSERT INTO `ingredients` (`name`, `store`, `quantity`, `unit`, `price`, `unit_price`, `genre`) VALUES
('鶏もも肉', 'DIO', 300.00, 'g', 250.00, 0.8333, 'meat'),
('鶏むね肉', 'コスモス', 400.00, 'g', 180.00, 0.4500, 'meat'),
('豚バラ肉', 'ニシナ', 250.00, 'g', 320.00, 1.2800, 'meat'),
('牛切り落とし', 'DIO', 200.00, 'g', 480.00, 2.4000, 'meat'),
('玉ねぎ', 'コスモス', 3.00, '個', 150.00, 50.0000, 'vegetable'),
('人参', 'コスモス', 3.00, '個', 120.00, 40.0000, 'vegetable'),
('じゃがいも', 'ニシナ', 5.00, '個', 200.00, 40.0000, 'vegetable'),
('キャベツ', 'DIO', 1.00, '個', 180.00, 180.0000, 'vegetable'),
('もやし', 'コスモス', 1.00, '袋', 30.00, 30.0000, 'vegetable'),
('白菜', 'ニシナ', 1.00, '個', 250.00, 250.0000, 'vegetable'),
('醤油', 'ニシナ', 1000.00, 'ml', 180.00, 0.1800, 'seasoning'),
('塩', 'コープ', 1000.00, 'g', 100.00, 0.1000, 'seasoning'),
('胡椒', 'コープ', 20.00, 'g', 150.00, 7.5000, 'seasoning'),
('砂糖', 'DIO', 1000.00, 'g', 200.00, 0.2000, 'seasoning'),
('酢', 'コスモス', 500.00, 'ml', 120.00, 0.2400, 'seasoning'),
('サラダ油', 'DIO', 500.00, 'ml', 220.00, 0.4400, 'seasoning'),
('ケチャップ', 'DIO', 500.00, 'ml', 200.00, 0.4000, 'sauce'),
('マヨネーズ', 'DIO', 400.00, 'ml', 180.00, 0.4500, 'sauce'),
('ソース', 'ニシナ', 300.00, 'ml', 160.00, 0.5333, 'sauce'),
('味噌', 'コープ', 1000.00, 'g', 300.00, 0.3000, 'sauce'),
('冷凍ポテト', 'コスモス', 1000.00, 'g', 300.00, 0.3000, 'frozen'),
('冷凍から揚げ', 'DIO', 500.00, 'g', 400.00, 0.8000, 'frozen'),
('冷凍餃子', 'ニシナ', 12.00, '個', 250.00, 20.8333, 'frozen'),
('コーラ', 'ニシナ', 1500.00, 'ml', 150.00, 0.1000, 'drink'),
('オレンジジュース', 'DIO', 1000.00, 'ml', 200.00, 0.2000, 'drink'),
('ウーロン茶', 'コスモス', 2000.00, 'ml', 180.00, 0.0900, 'drink');

-- サンプル料理データ
INSERT INTO `dishes` (`name`, `total_cost`, `genre`, `description`) VALUES
('鶏の唐揚げ', 180.00, 'meat', '鶏もも肉を使った定番の唐揚げ'),
('ポテトサラダ', 120.00, 'vegetable', '野菜たっぷりのポテトサラダ'),
('フライドポテト', 90.00, 'frozen', '冷凍ポテトを使用した簡単サイド'),
('野菜炒め', 85.00, 'vegetable', 'もやしとキャベツの野菜炒め'),
('鶏胸肉のソテー', 95.00, 'meat', 'ヘルシーな鶏胸肉料理');

-- サンプル料理-食材関連データ
INSERT INTO `dish_ingredients` (`dish_id`, `ingredient_id`, `used_quantity`, `used_cost`) VALUES
-- 鶏の唐揚げ
(1, 1, 200.00, 166.66), -- 鶏もも肉200g
(1, 11, 30.00, 5.40),   -- 醤油30ml
(1, 16, 20.00, 8.80),   -- サラダ油20ml

-- ポテトサラダ
(2, 7, 2.00, 80.00),    -- じゃがいも2個
(2, 6, 1.00, 40.00),    -- 人参1個
(2, 18, 20.00, 9.00),   -- マヨネーズ20ml

-- フライドポテト
(3, 21, 200.00, 60.00), -- 冷凍ポテト200g
(3, 12, 2.00, 0.20),    -- 塩2g

-- 野菜炒め
(4, 9, 1.00, 30.00),    -- もやし1袋
(4, 8, 0.25, 45.00),    -- キャベツ1/4個
(4, 16, 10.00, 4.40),   -- サラダ油10ml
(4, 11, 10.00, 1.80),   -- 醤油10ml

-- 鶏胸肉のソテー
(5, 2, 150.00, 67.50),  -- 鶏むね肉150g
(5, 12, 1.00, 0.10),    -- 塩1g
(5, 13, 0.50, 3.75),    -- 胡椒0.5g
(5, 16, 15.00, 6.60);   -- サラダ油15ml

-- サンプル完成品データ
INSERT INTO `completed_foods` (`name`, `price`, `total_cost`, `description`) VALUES
('唐揚げ定食', 650.00, 320.00, '唐揚げ、ポテトサラダ、ごはんのセット'),
('ヘルシープレート', 580.00, 280.00, '鶏胸肉ソテーと野菜炒めの組み合わせ'),
('カジュアルセット', 450.00, 240.00, 'フライドポテトとドリンクの軽食セット');

-- サンプル完成品-料理関連データ
INSERT INTO `food_dishes` (`food_id`, `dish_id`, `usage_quantity`, `usage_unit`, `usage_cost`, `description`) VALUES
-- 唐揚げ定食
(1, 1, 1.0000, 'serving', 180.00, 'メイン'),
(1, 2, 0.8000, 'ratio', 96.00, 'サイド'),
(1, 3, 0.5000, 'ratio', 45.00, 'ガーニッシュ'),

-- ヘルシープレート
(2, 5, 1.0000, 'serving', 95.00, 'メイン'),
(2, 4, 1.0000, 'serving', 85.00, 'サイド'),

-- カジュアルセット
(3, 3, 1.0000, 'serving', 90.00, 'メイン');

-- パフォーマンス向上のためのインデックス追加
CREATE INDEX `idx_ingredients_search` ON `ingredients`(`name`, `store`);
CREATE INDEX `idx_dishes_search` ON `dishes`(`name`);
CREATE INDEX `idx_foods_search` ON `completed_foods`(`name`);

-- 統計用ビューの作成
CREATE VIEW `v_ingredient_statistics` AS
SELECT 
    genre,
    COUNT(*) as ingredient_count,
    AVG(unit_price) as avg_unit_price,
    MIN(unit_price) as min_unit_price,
    MAX(unit_price) as max_unit_price,
    SUM(price) as total_purchase_cost
FROM ingredients 
GROUP BY genre;

CREATE VIEW `v_dish_statistics` AS
SELECT 
    genre,
    COUNT(*) as dish_count,
    AVG(total_cost) as avg_total_cost,
    MIN(total_cost) as min_total_cost,
    MAX(total_cost) as max_total_cost
FROM dishes 
GROUP BY genre;

CREATE VIEW `v_popular_ingredients` AS
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

-- テーブル統計の更新
ANALYZE TABLE `ingredients`, `dishes`, `completed_foods`, `dish_ingredients`, `food_dishes`, `memos`, `activity_logs`, `system_settings`;

-- 外部キー制約の有効化
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET SQL_MODE=@OLD_SQL_MODE;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- セットアップ完了の確認
SELECT 'データベースセットアップが完了しました' as message,
        (SELECT COUNT(*) FROM ingredients) as sample_ingredients_count,
        (SELECT COUNT(*) FROM dishes) as sample_dishes_count,
        (SELECT COUNT(*) FROM completed_foods) as sample_completed_foods_count;
