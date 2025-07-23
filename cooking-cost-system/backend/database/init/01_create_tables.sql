-- 料理原価計算システム データベーススキーマ
-- 作成日: 2025-01-01
-- バージョン: 2.0

SET FOREIGN_KEY_CHECKS = 0;

-- ================================
-- 食材テーブル
-- ================================
CREATE TABLE IF NOT EXISTS `ingredients` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL COMMENT '食材名',
    `store` varchar(100) NOT NULL COMMENT '購入店舗',
    `quantity` decimal(10,2) NOT NULL COMMENT '購入数量',
    `unit` varchar(20) NOT NULL COMMENT '単位',
    `price` decimal(10,2) NOT NULL COMMENT '購入価格',
    `unit_price` decimal(10,4) NOT NULL COMMENT '単価 (price / quantity)',
    `genre` enum('meat','vegetable','seasoning','sauce','frozen','drink') NOT NULL DEFAULT 'vegetable' COMMENT 'ジャンル',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    PRIMARY KEY (`id`),
    KEY `idx_name` (`name`),
    KEY `idx_genre` (`genre`),
    KEY `idx_store` (`store`),
    KEY `idx_unit_price` (`unit_price`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='食材マスタ';

-- ================================
-- 料理テーブル
-- ================================
CREATE TABLE IF NOT EXISTS `dishes` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL COMMENT '料理名',
    `total_cost` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '総原価',
    `genre` varchar(50) NOT NULL DEFAULT 'main' COMMENT 'ジャンル',
    `description` text COMMENT '説明・メモ',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    PRIMARY KEY (`id`),
    KEY `idx_name` (`name`),
    KEY `idx_genre` (`genre`),
    KEY `idx_total_cost` (`total_cost`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='料理マスタ';

-- ================================
-- 料理-食材関連テーブル
-- ================================
CREATE TABLE IF NOT EXISTS `dish_ingredients` (
    `id` int NOT NULL AUTO_INCREMENT,
    `dish_id` int NOT NULL COMMENT '料理ID',
    `ingredient_id` int NOT NULL COMMENT '食材ID',
    `used_quantity` decimal(10,2) NOT NULL COMMENT '使用量',
    `used_cost` decimal(10,2) NOT NULL COMMENT '使用コスト',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_dish_ingredient` (`dish_id`, `ingredient_id`),
    KEY `fk_dish_ingredients_dish` (`dish_id`),
    KEY `fk_dish_ingredients_ingredient` (`ingredient_id`),
    KEY `idx_used_cost` (`used_cost`),
    CONSTRAINT `fk_dish_ingredients_dish` 
        FOREIGN KEY (`dish_id`) REFERENCES `dishes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_dish_ingredients_ingredient` 
        FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='料理-食材関連';

-- ================================
-- 完成品テーブル
-- ================================
CREATE TABLE IF NOT EXISTS `completed_foods` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL COMMENT '完成品名',
    `price` decimal(10,2) DEFAULT NULL COMMENT '販売価格',
    `total_cost` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '総原価',
    `description` text COMMENT '説明・メモ',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    PRIMARY KEY (`id`),
    KEY `idx_name` (`name`),
    KEY `idx_price` (`price`),
    KEY `idx_total_cost` (`total_cost`),
    KEY `idx_profit` ((price - total_cost)),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='完成品マスタ';

-- ================================
-- 完成品-料理関連テーブル
-- ================================
CREATE TABLE IF NOT EXISTS `food_dishes` (
    `id` int NOT NULL AUTO_INCREMENT,
    `food_id` int NOT NULL COMMENT '完成品ID',
    `dish_id` int NOT NULL COMMENT '料理ID',
    `usage_quantity` decimal(10,4) NOT NULL COMMENT '使用量',
    `usage_unit` enum('ratio','serving') NOT NULL DEFAULT 'ratio' COMMENT '使用単位 (ratio: 割合, serving: 人前)',
    `usage_cost` decimal(10,2) NOT NULL COMMENT '使用コスト',
    `description` varchar(255) DEFAULT NULL COMMENT '説明・メモ',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    PRIMARY KEY (`id`),
    KEY `fk_food_dishes_food` (`food_id`),
    KEY `fk_food_dishes_dish` (`dish_id`),
    KEY `idx_usage_cost` (`usage_cost`),
    CONSTRAINT `fk_food_dishes_food` 
        FOREIGN KEY (`food_id`) REFERENCES `completed_foods` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_food_dishes_dish` 
        FOREIGN KEY (`dish_id`) REFERENCES `dishes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='完成品-料理関連';

-- ================================
-- メモテーブル
-- ================================
CREATE TABLE IF NOT EXISTS `memos` (
    `id` int NOT NULL AUTO_INCREMENT,
    `content` text NOT NULL COMMENT 'メモ内容',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    PRIMARY KEY (`id`),
    KEY `idx_created_at` (`created_at`),
    FULLTEXT KEY `ft_content` (`content`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='メモ';

-- ================================
-- ユーザーテーブル (将来用)
-- ================================
CREATE TABLE IF NOT EXISTS `users` (
    `id` int NOT NULL AUTO_INCREMENT,
    `username` varchar(50) NOT NULL COMMENT 'ユーザー名',
    `email` varchar(255) NOT NULL COMMENT 'メールアドレス',
    `password_hash` varchar(255) NOT NULL COMMENT 'パスワードハッシュ',
    `role` enum('admin','user') NOT NULL DEFAULT 'user' COMMENT '権限',
    `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'アクティブフラグ',
    `last_login_at` timestamp NULL COMMENT '最終ログイン日時',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    UNIQUE KEY `uk_email` (`email`),
    KEY `idx_role` (`role`),
    KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ユーザー';

-- ================================
-- セッションテーブル (将来用)
-- ================================
CREATE TABLE IF NOT EXISTS `sessions` (
    `id` varchar(128) NOT NULL,
    `user_id` int DEFAULT NULL,
    `data` text,
    `expires_at` timestamp NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `fk_sessions_user` (`user_id`),
    KEY `idx_expires_at` (`expires_at`),
    CONSTRAINT `fk_sessions_user` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='セッション';

-- ================================
-- 監査ログテーブル (将来用)
-- ================================
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `user_id` int DEFAULT NULL COMMENT 'ユーザーID',
    `action` varchar(50) NOT NULL COMMENT 'アクション',
    `table_name` varchar(50) NOT NULL COMMENT 'テーブル名',
    `record_id` int NOT NULL COMMENT 'レコードID',
    `old_values` json DEFAULT NULL COMMENT '変更前の値',
    `new_values` json DEFAULT NULL COMMENT '変更後の値',
    `ip_address` varchar(45) DEFAULT NULL COMMENT 'IPアドレス',
    `user_agent` text COMMENT 'ユーザーエージェント',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    PRIMARY KEY (`id`),
    KEY `fk_audit_logs_user` (`user_id`),
    KEY `idx_action` (`action`),
    KEY `idx_table_name` (`table_name`),
    KEY `idx_record_id` (`record_id`),
    KEY `idx_created_at` (`created_at`),
    CONSTRAINT `fk_audit_logs_user` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='監査ログ';

SET FOREIGN_KEY_CHECKS = 1;

-- ================================
-- ビュー作成
-- ================================

-- 食材使用統計ビュー
CREATE OR REPLACE VIEW `v_ingredient_usage_stats` AS
SELECT 
    i.id,
    i.name,
    i.genre,
    i.unit_price,
    COUNT(di.dish_id) as usage_count,
    COALESCE(SUM(di.used_quantity), 0) as total_used_quantity,
    COALESCE(SUM(di.used_cost), 0) as total_used_cost,
    COALESCE(AVG(di.used_quantity), 0) as avg_used_quantity,
    COALESCE(AVG(di.used_cost), 0) as avg_used_cost
FROM ingredients i
LEFT JOIN dish_ingredients di ON i.id = di.ingredient_id
GROUP BY i.id, i.name, i.genre, i.unit_price;

-- 料理コスト詳細ビュー
CREATE OR REPLACE VIEW `v_dish_cost_details` AS
SELECT 
    d.id,
    d.name,
    d.genre,
    d.total_cost,
    COUNT(di.ingredient_id) as ingredient_count,
    GROUP_CONCAT(
        CONCAT(i.name, ': ', di.used_quantity, i.unit, ' (¥', di.used_cost, ')')
        ORDER BY di.used_cost DESC
        SEPARATOR '; '
    ) as ingredient_details
FROM dishes d
LEFT JOIN dish_ingredients di ON d.id = di.dish_id
LEFT JOIN ingredients i ON di.ingredient_id = i.id
GROUP BY d.id, d.name, d.genre, d.total_cost;

-- 完成品利益分析ビュー
CREATE OR REPLACE VIEW `v_food_profit_analysis` AS
SELECT 
    f.id,
    f.name,
    f.price,
    f.total_cost,
    CASE 
        WHEN f.price IS NOT NULL THEN f.price - f.total_cost 
        ELSE NULL 
    END as profit,
    CASE 
        WHEN f.price IS NOT NULL AND f.price > 0 THEN 
            ROUND(((f.price - f.total_cost) / f.price) * 100, 2)
        ELSE NULL 
    END as profit_rate,
    COUNT(fd.dish_id) as dish_count,
    GROUP_CONCAT(
        CONCAT(d.name, ': ', fd.usage_quantity, 
               CASE fd.usage_unit WHEN 'ratio' THEN '倍' ELSE '人前' END,
               ' (¥', fd.usage_cost, ')')
        ORDER BY fd.usage_cost DESC
        SEPARATOR '; '
    ) as dish_details
FROM completed_foods f
LEFT JOIN food_dishes fd ON f.id = fd.food_id
LEFT JOIN dishes d ON fd.dish_id = d.id
GROUP BY f.id, f.name, f.price, f.total_cost;

-- ================================
-- インデックス最適化
-- ================================

-- 複合インデックス追加
ALTER TABLE `ingredients` ADD INDEX `idx_genre_unit_price` (`genre`, `unit_price`);
ALTER TABLE `dishes` ADD INDEX `idx_genre_total_cost` (`genre`, `total_cost`);
ALTER TABLE `completed_foods` ADD INDEX `idx_price_total_cost` (`price`, `total_cost`);

-- 統計情報更新
ANALYZE TABLE `ingredients`, `dishes`, `dish_ingredients`, `completed_foods`, `food_dishes`, `memos`;
