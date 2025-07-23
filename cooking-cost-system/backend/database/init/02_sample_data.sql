-- 料理原価計算システム サンプルデータ
-- 開発・テスト用の初期データを挿入

SET FOREIGN_KEY_CHECKS = 0;

-- ================================
-- 食材サンプルデータ
-- ================================

INSERT INTO `ingredients` (`name`, `store`, `quantity`, `unit`, `price`, `unit_price`, `genre`) VALUES
-- 肉類
('豚バラ肉', 'スーパーマルエツ', 500.00, 'g', 450.00, 0.9000, 'meat'),
('鶏もも肉', 'コストコ', 2000.00, 'g', 980.00, 0.4900, 'meat'),
('牛肩ロース', 'イオン', 300.00, 'g', 890.00, 2.9667, 'meat'),
('鶏胸肉', '業務スーパー', 1000.00, 'g', 280.00, 0.2800, 'meat'),
('豚ひき肉', 'スーパーマルエツ', 500.00, 'g', 320.00, 0.6400, 'meat'),

-- 野菜類
('玉ねぎ', 'JA直売所', 3000.00, 'g', 300.00, 0.1000, 'vegetable'),
('人参', 'JA直売所', 1000.00, 'g', 150.00, 0.1500, 'vegetable'),
('じゃがいも', 'JA直売所', 2000.00, 'g', 280.00, 0.1400, 'vegetable'),
('キャベツ', 'スーパーマルエツ', 1200.00, 'g', 198.00, 0.1650, 'vegetable'),
('ピーマン', 'イオン', 300.00, 'g', 150.00, 0.5000, 'vegetable'),
('もやし', '業務スーパー', 300.00, 'g', 39.00, 0.1300, 'vegetable'),
('白菜', 'JA直売所', 2000.00, 'g', 250.00, 0.1250, 'vegetable'),
('長ネギ', 'スーパーマルエツ', 400.00, 'g', 198.00, 0.4950, 'vegetable'),

-- 調味料
('塩', '業務スーパー', 1000.00, 'g', 100.00, 0.1000, 'seasoning'),
('砂糖', 'スーパーマルエツ', 1000.00, 'g', 180.00, 0.1800, 'seasoning'),
('醤油', 'キッコーマン', 500.00, 'ml', 280.00, 0.5600, 'seasoning'),
('味噌', 'スーパーマルエツ', 500.00, 'g', 350.00, 0.7000, 'seasoning'),
('酒', 'イオン', 500.00, 'ml', 220.00, 0.4400, 'seasoning'),
('みりん', 'スーパーマルエツ', 300.00, 'ml', 280.00, 0.9333, 'seasoning'),
('胡椒', 'スーパーマルエツ', 50.00, 'g', 180.00, 3.6000, 'seasoning'),
('生姜', 'イオン', 100.00, 'g', 150.00, 1.5000, 'seasoning'),
('にんにく', 'スーパーマルエツ', 200.00, 'g', 280.00, 1.4000, 'seasoning'),

-- ソース・調味液
('サラダ油', '業務スーパー', 1000.00, 'ml', 200.00, 0.2000, 'sauce'),
('ごま油', 'スーパーマルエツ', 200.00, 'ml', 350.00, 1.7500, 'sauce'),
('オリーブオイル', 'コストコ', 500.00, 'ml', 680.00, 1.3600, 'sauce'),
('マヨネーズ', 'キューピー', 500.00, 'g', 280.00, 0.5600, 'sauce'),
('ケチャップ', 'カゴメ', 500.00, 'g', 250.00, 0.5000, 'sauce'),
('ソース', 'ブルドック', 500.00, 'ml', 200.00, 0.4000, 'sauce'),

-- 冷凍食品
('冷凍エビ', 'コストコ', 500.00, 'g', 980.00, 1.9600, 'frozen'),
('冷凍ブロッコリー', '業務スーパー', 500.00, 'g', 180.00, 0.3600, 'frozen'),
('冷凍コーン', 'イオン', 300.00, 'g', 150.00, 0.5000, 'frozen'),

-- 飲み物
('水', 'スーパーマルエツ', 2000.00, 'ml', 100.00, 0.0500, 'drink'),
('コンソメ顆粒', '味の素', 100.00, 'g', 380.00, 3.8000, 'seasoning');

-- ================================
-- 料理サンプルデータ
-- ================================

INSERT INTO `dishes` (`name`, `genre`, `description`) VALUES
('豚の生姜焼き', 'main', 'ご飯が進む定番の豚の生姜焼き'),
('鶏の唐揚げ', 'main', 'サクサクジューシーな鶏の唐揚げ'),
('野菜炒め', 'side', '彩り豊かな野菜炒め'),
('味噌汁', 'soup', '定番の味噌汁'),
('チャーハン', 'main', 'パラパラの美味しいチャーハン'),
('ハンバーグ', 'main', 'ふっくらジューシーなハンバーグ'),
('サラダ', 'side', 'フレッシュな野菜サラダ'),
('ポテトサラダ', 'side', 'クリーミーなポテトサラダ');

-- ================================
-- 料理-食材関連データ
-- ================================

-- 豚の生姜焼き
INSERT INTO `dish_ingredients` (`dish_id`, `ingredient_id`, `used_quantity`, `used_cost`) VALUES
(1, 1, 200.00, 180.00), -- 豚バラ肉 200g
(1, 6, 100.00, 10.00),  -- 玉ねぎ 100g
(1, 18, 10.00, 15.00),  -- 生姜 10g
(1, 16, 30.00, 16.80),  -- 醤油 30ml
(1, 18, 15.00, 14.00),  -- みりん 15ml
(1, 21, 10.00, 2.00);   -- サラダ油 10ml

-- 鶏の唐揚げ
INSERT INTO `dish_ingredients` (`dish_id`, `ingredient_id`, `used_quantity`, `used_cost`) VALUES
(2, 2, 300.00, 147.00), -- 鶏もも肉 300g
(2, 16, 20.00, 11.20),  -- 醤油 20ml
(2, 17, 15.00, 6.60),   -- 酒 15ml
(2, 19, 5.00, 7.00),    -- にんにく 5g
(2, 18, 5.00, 7.50),    -- 生姜 5g
(2, 21, 100.00, 20.00); -- サラダ油（揚げ油）100ml

-- 野菜炒め
INSERT INTO `dish_ingredients` (`dish_id`, `ingredient_id`, `used_quantity`, `used_cost`) VALUES
(3, 9, 150.00, 24.75),  -- キャベツ 150g
(3, 7, 80.00, 12.00),   -- 人参 80g
(3, 10, 100.00, 50.00), -- ピーマン 100g
(3, 11, 100.00, 13.00), -- もやし 100g
(3, 21, 10.00, 2.00),   -- サラダ油 10ml
(3, 14, 2.00, 0.20),    -- 塩 2g
(3, 17, 1.00, 3.60);    -- 胡椒 1g

-- 味噌汁
INSERT INTO `dish_ingredients` (`dish_id`, `ingredient_id`, `used_quantity`, `used_cost`) VALUES
(4, 17, 30.00, 21.00),  -- 味噌 30g
(4, 6, 50.00, 5.00),    -- 玉ねぎ 50g
(4, 13, 50.00, 6.25),   -- 白菜 50g
(4, 30, 300.00, 15.00); -- 水 300ml

-- チャーハン
INSERT INTO `dish_ingredients` (`dish_id`, `ingredient_id`, `used_quantity`, `used_cost`) VALUES
(5, 5, 100.00, 64.00),  -- 豚ひき肉 100g
(5, 6, 50.00, 5.00),    -- 玉ねぎ 50g
(5, 14, 50.00, 24.75),  -- 長ネギ 50g
(5, 21, 15.00, 3.00),   -- サラダ油 15ml
(5, 16, 20.00, 11.20),  -- 醤油 20ml
(5, 15, 2.00, 0.20);    -- 塩 2g

-- ハンバーグ
INSERT INTO `dish_ingredients` (`dish_id`, `ingredient_id`, `used_quantity`, `used_cost`) VALUES
(6, 5, 200.00, 128.00), -- 豚ひき肉 200g
(6, 6, 100.00, 10.00),  -- 玉ねぎ 100g
(6, 21, 10.00, 2.00),   -- サラダ油 10ml
(6, 15, 2.00, 0.20),    -- 塩 2g
(6, 17, 1.00, 3.60);    -- 胡椒 1g

-- サラダ
INSERT INTO `dish_ingredients` (`dish_id`, `ingredient_id`, `used_quantity`, `used_cost`) VALUES
(7, 9, 100.00, 16.50),  -- キャベツ 100g
(7, 7, 50.00, 7.50),    -- 人参 50g
(7, 24, 20.00, 11.20);  -- マヨネーズ 20g

-- ポテトサラダ
INSERT INTO `dish_ingredients` (`dish_id`, `ingredient_id`, `used_quantity`, `used_cost`) VALUES
(8, 8, 300.00, 42.00),  -- じゃがいも 300g
(8, 7, 50.00, 7.50),    -- 人参 50g
(8, 24, 30.00, 16.80),  -- マヨネーズ 30g
(8, 15, 2.00, 0.20);    -- 塩 2g

-- ================================
-- 料理の総コストを更新
-- ================================

UPDATE `dishes` SET `total_cost` = (
    SELECT SUM(`used_cost`) FROM `dish_ingredients` WHERE `dish_id` = `dishes`.`id`
) WHERE `id` IN (1, 2, 3, 4, 5, 6, 7, 8);

-- ================================
-- 完成品サンプルデータ
-- ================================

INSERT INTO `completed_foods` (`name`, `price`, `description`) VALUES
('定食A（生姜焼き定食）', 850.00, '豚の生姜焼き、味噌汁、サラダのセット'),
('定食B（唐揚げ定食）', 900.00, '鶏の唐揚げ、味噌汁、ポテトサラダのセット'),
('チャーハンセット', 750.00, 'チャーハンと味噌汁のセット'),
('ハンバーグプレート', 980.00, 'ハンバーグ、野菜炒め、サラダのプレート');

-- ================================
-- 完成品-料理関連データ
-- ================================

-- 定食A（生姜焼き定食）
INSERT INTO `food_dishes` (`food_id`, `dish_id`, `usage_quantity`, `usage_unit`, `usage_cost`, `description`) VALUES
(1, 1, 1.0000, 'serving', 0, '豚の生姜焼き 1人前'),
(1, 4, 1.0000, 'serving', 0, '味噌汁 1杯'),
(1, 7, 1.0000, 'serving', 0, 'サラダ 1皿');

-- 定食B（唐揚げ定食）
INSERT INTO `food_dishes` (`food_id`, `dish_id`, `usage_quantity`, `usage_unit`, `usage_cost`, `description`) VALUES
(2, 2, 1.0000, 'serving', 0, '鶏の唐揚げ 1人前'),
(2, 4, 1.0000, 'serving', 0, '味噌汁 1杯'),
(2, 8, 1.0000, 'serving', 0, 'ポテトサラダ 1皿');

-- チャーハンセット
INSERT INTO `food_dishes` (`food_id`, `dish_id`, `usage_quantity`, `usage_unit`, `usage_cost`, `description`) VALUES
(3, 5, 1.0000, 'serving', 0, 'チャーハン 1人前'),
(3, 4, 1.0000, 'serving', 0, '味噌汁 1杯');

-- ハンバーグプレート
INSERT INTO `food_dishes` (`food_id`, `dish_id`, `usage_quantity`, `usage_unit`, `usage_cost`, `description`) VALUES
(4, 6, 1.0000, 'serving', 0, 'ハンバーグ 1人前'),
(4, 3, 1.0000, 'serving', 0, '野菜炒め 1皿'),
(4, 7, 0.5000, 'serving', 0, 'サラダ 半皿');

-- ================================
-- 完成品の使用コストと総コストを更新
-- ================================

-- 使用コストを料理の総コストに基づいて更新
UPDATE `food_dishes` fd
JOIN `dishes` d ON fd.dish_id = d.id
SET fd.usage_cost = d.total_cost * fd.usage_quantity;

-- 完成品の総コストを更新
UPDATE `completed_foods` cf
SET total_cost = (
    SELECT COALESCE(SUM(fd.usage_cost), 0)
    FROM `food_dishes` fd 
    WHERE fd.food_id = cf.id
);

-- ================================
-- メモサンプルデータ
-- ================================

INSERT INTO `memos` (`content`) VALUES
('今月の目標：食材ロス率を5%以下に抑える'),
('新メニュー候補：\n- 鶏肉のトマト煮\n- 野菜カレー\n- 魚のムニエル'),
('仕入れ先検討：\n業務スーパーの野菜が安くて質が良い。来月から一部切り替えを検討。'),
('原価率について：\n現在の平均原価率は約32%。目標は30%以下。調味料の使い方を見直す必要がある。'),
('季節メニュー企画：\n春：筍料理、夏：冷やし中華、秋：きのこ料理、冬：鍋料理');

-- ================================
-- ユーザーサンプルデータ（将来用）
-- ================================

INSERT INTO `users` (`username`, `email`, `password_hash`, `role`) VALUES
('admin', 'admin@cooking-system.local', '$2b$10$dummy.hash.for.development.only', 'admin'),
('manager', 'manager@cooking-system.local', '$2b$10$dummy.hash.for.development.only', 'user'),
('chef', 'chef@cooking-system.local', '$2b$10$dummy.hash.for.development.only', 'user');

SET FOREIGN_KEY_CHECKS = 1;

-- ================================
-- データ検証とインデックス統計更新
-- ================================

-- 統計情報を更新
ANALYZE TABLE `ingredients`, `dishes`, `dish_ingredients`, `completed_foods`, `food_dishes`, `memos`, `users`;

-- データ整合性チェック
SELECT 
    'Data Integrity Check' as check_type,
    COUNT(*) as total_ingredients
FROM ingredients
UNION ALL
SELECT 
    'Total Dishes',
    COUNT(*)
FROM dishes
UNION ALL
SELECT 
    'Total Completed Foods',
    COUNT(*)
FROM completed_foods
UNION ALL
SELECT 
    'Avg Profit Rate (%)',
    ROUND(AVG(CASE WHEN price > 0 THEN ((price - total_cost) / price) * 100 ELSE 0 END), 2)
FROM completed_foods
WHERE price IS NOT NULL;
