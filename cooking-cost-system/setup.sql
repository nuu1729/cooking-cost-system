-- ============================================================
-- 料理原価計算システム テストデータ投入スクリプト
-- 文字コード: utf8mb4 / 対象DB: cooking_cost_system
-- 既存データは手動削除済みの前提で INSERT のみ実施
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. テーブル作成（存在しない場合のみ）
-- ============================================================

CREATE TABLE IF NOT EXISTS `users` (
    `id`            INT          NOT NULL AUTO_INCREMENT,
    `username`      VARCHAR(50)  NOT NULL,
    `email`         VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    UNIQUE KEY `uk_email`    (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `items` (
    `id`          INT            NOT NULL AUTO_INCREMENT,
    `user_id`     INT            NULL,
    `name`        VARCHAR(255)   NOT NULL,
    `item_type`   TINYINT        NOT NULL COMMENT '1:食材 2:仕込み品 3:お品',
    `store`       VARCHAR(100)   NOT NULL,
    `price`       DECIMAL(10,2)  NOT NULL,
    `quantity`    DECIMAL(10,2)  NOT NULL,
    `unit`        VARCHAR(20)    NOT NULL,
    `unit_price`  DECIMAL(10,4)  NOT NULL,
    `genre`       VARCHAR(50)    DEFAULT NULL,
    `description` TEXT           DEFAULT NULL,
    `created_at`  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_user_id`   (`user_id`),
    INDEX `idx_item_type` (`item_type`),
    INDEX `idx_name`      (`name`),
    INDEX `idx_type_name` (`item_type`, `name`),
    CONSTRAINT `fk_items_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `chk_item_type` CHECK (`item_type` IN (1, 2, 3)),
    CONSTRAINT `chk_price`     CHECK (`price`    >= 0),
    CONSTRAINT `chk_quantity`  CHECK (`quantity`  > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `item_relations` (
    `id`             INT           NOT NULL AUTO_INCREMENT,
    `parent_item_id` INT           NOT NULL,
    `child_item_id`  INT           NOT NULL,
    `amount`         DECIMAL(10,2) NOT NULL,
    `cost`           DECIMAL(10,2) NOT NULL,
    `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_parent_child` (`parent_item_id`, `child_item_id`),
    INDEX `idx_parent` (`parent_item_id`),
    INDEX `idx_child`  (`child_item_id`),
    CONSTRAINT `fk_ir_parent` FOREIGN KEY (`parent_item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ir_child`  FOREIGN KEY (`child_item_id`)  REFERENCES `items` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `memos` (
    `id`         INT      NOT NULL AUTO_INCREMENT,
    `user_id`    INT      NULL,
    `content`    TEXT     NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_memos_user_id` (`user_id`),
    CONSTRAINT `fk_memos_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. ユーザー
--    username: nuu1729 / password: test1234
-- ============================================================

INSERT INTO `users` (`username`, `email`, `password_hash`, `is_active`) VALUES
('nuu1729', 'nuu1729@example.com',
 '$2b$12$6L9noqVmhQ/LWS/p2rpfWOO8iqxwpx7rD86jiZ0YIfhw4sCBXz1ty', 1);

-- ============================================================
-- 3. 食材（item_type = 1）
--    unit_price = price ÷ quantity（小数4桁）
-- ============================================================

INSERT INTO `items`
    (`user_id`, `name`, `item_type`, `store`, `price`, `quantity`, `unit`, `unit_price`, `genre`, `description`)
VALUES
-- 肉類 -------------------------------------------------------
(1, '鶏もも肉',   1, 'DIO',      280.00,  300.00, 'g',  0.9333, 'meat',      '国産鶏もも肉'),
(1, '鶏むね肉',   1, 'コスモス',  198.00,  400.00, 'g',  0.4950, 'meat',      '国産鶏むね肉'),
(1, '豚バラ肉',   1, 'ニシナ',    350.00,  250.00, 'g',  1.4000, 'meat',      '国産豚バラ薄切り'),
(1, '牛バラ肉',   1, 'DIO',      520.00,  200.00, 'g',  2.6000, 'meat',      '牛バラ切り落とし'),
(1, '卵',         1, 'コスモス',  230.00,   10.00, '個', 23.0000,'other',     'Mサイズ 10個入り'),
-- 野菜類 -----------------------------------------------------
(1, '玉ねぎ',     1, 'コスモス',  158.00,    3.00, '個', 52.6667,'vegetable', '北海道産玉ねぎ 3個'),
(1, '人参',       1, 'ニシナ',    130.00,  200.00, 'g',  0.6500, 'vegetable', '国産人参'),
(1, 'じゃがいも', 1, 'DIO',      198.00,    5.00, '個', 39.6000,'vegetable', 'メークイン 5個'),
(1, 'キャベツ',   1, 'コスモス',  190.00,    1.00, '個',190.0000,'vegetable', '国産キャベツ 1玉'),
(1, 'もやし',     1, 'DIO',       29.00,  200.00, 'g',  0.1450, 'vegetable', '国産大豆もやし'),
(1, '長ねぎ',     1, 'コスモス',  148.00,  200.00, 'g',  0.7400, 'vegetable', '国産長ねぎ'),
(1, 'にんにく',   1, 'コスモス',  128.00,   30.00, 'g',  4.2667, 'vegetable', '国産にんにく 1片30g換算'),
(1, '生姜',       1, 'DIO',      158.00,  100.00, 'g',  1.5800, 'vegetable', '国産生姜'),
-- 調味料 -----------------------------------------------------
(1, '醤油',       1, 'ニシナ',    188.00, 1000.00, 'ml', 0.1880, 'seasoning', 'キッコーマン濃口醤油'),
(1, '塩',         1, 'コープ',    108.00, 1000.00, 'g',  0.1080, 'seasoning', '食塩'),
(1, '胡椒',       1, 'コープ',    158.00,   20.00, 'g',  7.9000, 'seasoning', 'ブラックペッパー'),
(1, '砂糖',       1, 'DIO',      198.00, 1000.00, 'g',  0.1980, 'seasoning', '上白糖'),
(1, 'みりん',     1, 'ニシナ',    198.00,  500.00, 'ml', 0.3960, 'seasoning', '本みりん'),
(1, '料理酒',     1, 'コスモス',  158.00,  500.00, 'ml', 0.3160, 'seasoning', '料理用清酒'),
(1, '味噌',       1, 'コープ',    298.00,  750.00, 'g',  0.3973, 'seasoning', '信州みそ 合わせ'),
(1, 'サラダ油',   1, 'DIO',      228.00,  500.00, 'ml', 0.4560, 'seasoning', '国産サラダ油'),
(1, 'ごま油',     1, 'ニシナ',    298.00,  200.00, 'ml', 1.4900, 'seasoning', '純正ごま油'),
(1, '片栗粉',     1, 'コープ',    148.00,  400.00, 'g',  0.3700, 'other',     '国産片栗粉'),
-- その他 -----------------------------------------------------
(1, '豆腐',       1, 'コスモス',   88.00,  300.00, 'g',  0.2933, 'other',     '木綿豆腐 1丁300g'),
(1, '米',         1, 'ニシナ',   2480.00, 5000.00, 'g',  0.4960, 'other',     'コシヒカリ 5kg');

-- ============================================================
-- 4. 仕込み品（item_type = 2）
--    price = 構成食材コスト合計, unit_price = price ÷ quantity
-- ============================================================

-- 4-1. 唐揚げ（下味済み）1人前
--   鶏もも肉 150g × 0.9333 = 140.00
--   醤油    15ml × 0.1880 =   2.82
--   料理酒  10ml × 0.3160 =   3.16
--   にんにく 3g  × 4.2667 =  12.80
--   生姜     5g  × 1.5800 =   7.90
--   片栗粉  10g  × 0.3700 =   3.70
--   塩       1g  × 0.1080 =   0.11
--   計 = 170.49
INSERT INTO `items` (`user_id`,`name`,`item_type`,`store`,`price`,`quantity`,`unit`,`unit_price`,`genre`,`description`) VALUES
(1, '唐揚げ（下味済み）', 2, '自家製', 170.49, 1.00, '人前', 170.4900, 'meat', '鶏もも肉の唐揚げ用 下味付き');

-- 4-2. 味噌汁 1人前
--   豆腐   75g × 0.2933 = 22.00
--   味噌   20g × 0.3973 =  7.95
--   長ねぎ 10g × 0.7400 =  7.40
--   計 = 37.35
INSERT INTO `items` (`user_id`,`name`,`item_type`,`store`,`price`,`quantity`,`unit`,`unit_price`,`genre`,`description`) VALUES
(1, '味噌汁', 2, '自家製', 37.35, 1.00, '人前', 37.3500, 'other', '豆腐と長ねぎの味噌汁 1人前');

-- 4-3. 白ごはん 1人前
--   米 150g × 0.4960 = 74.40
INSERT INTO `items` (`user_id`,`name`,`item_type`,`store`,`price`,`quantity`,`unit`,`unit_price`,`genre`,`description`) VALUES
(1, '白ごはん', 2, '自家製', 74.40, 1.00, '人前', 74.4000, 'other', '炊きたて白米 1人前（150g）');

-- 4-4. 生姜焼き 1人前
--   豚バラ肉 120g × 1.4000 = 168.00
--   醤油      10ml × 0.1880 =   1.88
--   みりん    10ml × 0.3960 =   3.96
--   生姜       8g  × 1.5800 =  12.64
--   砂糖       5g  × 0.1980 =   0.99
--   サラダ油   5ml × 0.4560 =   2.28
--   玉ねぎ   0.5個 × 52.667 =  26.33
--   計 = 216.08
INSERT INTO `items` (`user_id`,`name`,`item_type`,`store`,`price`,`quantity`,`unit`,`unit_price`,`genre`,`description`) VALUES
(1, '豚の生姜焼き', 2, '自家製', 216.08, 1.00, '人前', 216.0800, 'meat', '豚バラ肉の生姜焼き 1人前');

-- 4-5. 野菜炒め 1人前
--   もやし   100g × 0.1450 = 14.50
--   キャベツ 0.2個× 190.00 = 38.00
--   サラダ油  5ml × 0.4560 =  2.28
--   醤油      8ml × 0.1880 =  1.50
--   ごま油    3ml × 1.4900 =  4.47
--   塩         1g × 0.1080 =  0.11
--   計 = 60.86
INSERT INTO `items` (`user_id`,`name`,`item_type`,`store`,`price`,`quantity`,`unit`,`unit_price`,`genre`,`description`) VALUES
(1, '野菜炒め', 2, '自家製', 60.86, 1.00, '人前', 60.8600, 'vegetable', 'もやし・キャベツの野菜炒め 1人前');

-- 4-6. 肉じゃが 1人前
--   牛バラ肉  80g × 2.6000 = 208.00
--   じゃがいも 1個 × 39.600 =  39.60
--   玉ねぎ  0.5個 × 52.667 =  26.33
--   人参      30g × 0.6500 =  19.50
--   醤油      20ml× 0.1880 =   3.76
--   みりん    20ml× 0.3960 =   7.92
--   砂糖      10g × 0.1980 =   1.98
--   料理酒    20ml× 0.3160 =   6.32
--   計 = 313.41
INSERT INTO `items` (`user_id`,`name`,`item_type`,`store`,`price`,`quantity`,`unit`,`unit_price`,`genre`,`description`) VALUES
(1, '肉じゃが', 2, '自家製', 313.41, 1.00, '人前', 313.4100, 'meat', '牛肉の肉じゃが 1人前');

-- ============================================================
-- 5. 仕込み品の構成食材（item_relations）
--    parent = 仕込み品ID、child = 食材ID
-- ============================================================

-- 食材IDの対応（INSERTした順）
-- id=1  鶏もも肉   id=2  鶏むね肉   id=3  豚バラ肉
-- id=4  牛バラ肉   id=5  卵         id=6  玉ねぎ
-- id=7  人参       id=8  じゃがいも id=9  キャベツ
-- id=10 もやし     id=11 長ねぎ     id=12 にんにく
-- id=13 生姜       id=14 醤油       id=15 塩
-- id=16 胡椒       id=17 砂糖       id=18 みりん
-- id=19 料理酒     id=20 味噌       id=21 サラダ油
-- id=22 ごま油     id=23 片栗粉     id=24 豆腐
-- id=25 米

-- 仕込み品IDの対応
-- id=26 唐揚げ（下味済み）
-- id=27 味噌汁
-- id=28 白ごはん
-- id=29 豚の生姜焼き
-- id=30 野菜炒め
-- id=31 肉じゃが

-- 唐揚げ（下味済み）の構成食材
INSERT INTO `item_relations` (`parent_item_id`,`child_item_id`,`amount`,`cost`) VALUES
(26,  1, 150.00, 140.00),  -- 鶏もも肉 150g
(26, 14,  15.00,   2.82),  -- 醤油 15ml
(26, 19,  10.00,   3.16),  -- 料理酒 10ml
(26, 12,   3.00,  12.80),  -- にんにく 3g
(26, 13,   5.00,   7.90),  -- 生姜 5g
(26, 23,  10.00,   3.70),  -- 片栗粉 10g
(26, 15,   1.00,   0.11);  -- 塩 1g

-- 味噌汁の構成食材
INSERT INTO `item_relations` (`parent_item_id`,`child_item_id`,`amount`,`cost`) VALUES
(27, 24,  75.00,  22.00),  -- 豆腐 75g
(27, 20,  20.00,   7.95),  -- 味噌 20g
(27, 11,  10.00,   7.40);  -- 長ねぎ 10g

-- 白ごはんの構成食材
INSERT INTO `item_relations` (`parent_item_id`,`child_item_id`,`amount`,`cost`) VALUES
(28, 25, 150.00,  74.40);  -- 米 150g

-- 豚の生姜焼きの構成食材
INSERT INTO `item_relations` (`parent_item_id`,`child_item_id`,`amount`,`cost`) VALUES
(29,  3, 120.00, 168.00),  -- 豚バラ肉 120g
(29, 14,  10.00,   1.88),  -- 醤油 10ml
(29, 18,  10.00,   3.96),  -- みりん 10ml
(29, 13,   8.00,  12.64),  -- 生姜 8g
(29, 17,   5.00,   0.99),  -- 砂糖 5g
(29, 21,   5.00,   2.28),  -- サラダ油 5ml
(29,  6,   0.50,  26.33);  -- 玉ねぎ 0.5個

-- 野菜炒めの構成食材
INSERT INTO `item_relations` (`parent_item_id`,`child_item_id`,`amount`,`cost`) VALUES
(30, 10, 100.00,  14.50),  -- もやし 100g
(30,  9,   0.20,  38.00),  -- キャベツ 0.2個
(30, 21,   5.00,   2.28),  -- サラダ油 5ml
(30, 14,   8.00,   1.50),  -- 醤油 8ml
(30, 22,   3.00,   4.47),  -- ごま油 3ml
(30, 15,   1.00,   0.11);  -- 塩 1g

-- 肉じゃがの構成食材
INSERT INTO `item_relations` (`parent_item_id`,`child_item_id`,`amount`,`cost`) VALUES
(31,  4,  80.00, 208.00),  -- 牛バラ肉 80g
(31,  8,   1.00,  39.60),  -- じゃがいも 1個
(31,  6,   0.50,  26.33),  -- 玉ねぎ 0.5個
(31,  7,  30.00,  19.50),  -- 人参 30g
(31, 14,  20.00,   3.76),  -- 醤油 20ml
(31, 18,  20.00,   7.92),  -- みりん 20ml
(31, 17,  10.00,   1.98),  -- 砂糖 10g
(31, 19,  20.00,   6.32);  -- 料理酒 20ml

-- ============================================================
-- 6. お品（item_type = 3）
--    price = 仕込み品コスト合計, unit_price = price ÷ quantity
-- ============================================================

-- 唐揚げ定食: 170.49 + 74.40 + 37.35 = 282.24
INSERT INTO `items` (`user_id`,`name`,`item_type`,`store`,`price`,`quantity`,`unit`,`unit_price`,`genre`,`description`) VALUES
(1, '唐揚げ定食', 3, '自家製', 282.24, 1.00, '人前', 282.2400, 'meat', '唐揚げ・白ごはん・味噌汁のセット');

-- 生姜焼き定食: 216.08 + 74.40 + 37.35 = 327.83
INSERT INTO `items` (`user_id`,`name`,`item_type`,`store`,`price`,`quantity`,`unit`,`unit_price`,`genre`,`description`) VALUES
(1, '生姜焼き定食', 3, '自家製', 327.83, 1.00, '人前', 327.8300, 'meat', '豚の生姜焼き・白ごはん・味噌汁のセット');

-- 野菜炒め定食: 60.86 + 74.40 + 37.35 = 172.61
INSERT INTO `items` (`user_id`,`name`,`item_type`,`store`,`price`,`quantity`,`unit`,`unit_price`,`genre`,`description`) VALUES
(1, '野菜炒め定食', 3, '自家製', 172.61, 1.00, '人前', 172.6100, 'vegetable', '野菜炒め・白ごはん・味噌汁のセット');

-- 肉じゃが定食: 313.41 + 74.40 + 37.35 = 425.16
INSERT INTO `items` (`user_id`,`name`,`item_type`,`store`,`price`,`quantity`,`unit`,`unit_price`,`genre`,`description`) VALUES
(1, '肉じゃが定食', 3, '自家製', 425.16, 1.00, '人前', 425.1600, 'meat', '肉じゃが・白ごはん・味噌汁のセット');

-- ============================================================
-- 7. お品の構成仕込み品（item_relations）
--    parent = お品ID, child = 仕込み品ID
-- ============================================================

-- お品IDの対応
-- id=32 唐揚げ定食
-- id=33 生姜焼き定食
-- id=34 野菜炒め定食
-- id=35 肉じゃが定食

-- 唐揚げ定食の構成
INSERT INTO `item_relations` (`parent_item_id`,`child_item_id`,`amount`,`cost`) VALUES
(32, 26, 1.00, 170.49),  -- 唐揚げ（下味済み）1人前
(32, 28, 1.00,  74.40),  -- 白ごはん 1人前
(32, 27, 1.00,  37.35);  -- 味噌汁 1人前

-- 生姜焼き定食の構成
INSERT INTO `item_relations` (`parent_item_id`,`child_item_id`,`amount`,`cost`) VALUES
(33, 29, 1.00, 216.08),  -- 豚の生姜焼き 1人前
(33, 28, 1.00,  74.40),  -- 白ごはん 1人前
(33, 27, 1.00,  37.35);  -- 味噌汁 1人前

-- 野菜炒め定食の構成
INSERT INTO `item_relations` (`parent_item_id`,`child_item_id`,`amount`,`cost`) VALUES
(34, 30, 1.00,  60.86),  -- 野菜炒め 1人前
(34, 28, 1.00,  74.40),  -- 白ごはん 1人前
(34, 27, 1.00,  37.35);  -- 味噌汁 1人前

-- 肉じゃが定食の構成
INSERT INTO `item_relations` (`parent_item_id`,`child_item_id`,`amount`,`cost`) VALUES
(35, 31, 1.00, 313.41),  -- 肉じゃが 1人前
(35, 28, 1.00,  74.40),  -- 白ごはん 1人前
(35, 27, 1.00,  37.35);  -- 味噌汁 1人前

-- ============================================================
-- 8. メモ
-- ============================================================

INSERT INTO `memos` (`user_id`, `content`) VALUES
(1, '仕入れ値が変動したら食材の price・unit_price を更新すること。仕込み品とお品の原価は自動では再計算されないため、値上がりがあった際は注意。'),
(1, '唐揚げ用の鶏もも肉はDIOの特売日（毎週水曜）に購入すると安い。'),
(1, '白ごはんの米は5kgを消費したタイミングで仕入れる。ニシナで都度購入。');

-- ============================================================
-- 9. 完了確認
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;

SELECT '=== 投入完了 ===' AS status;

SELECT '食材（item_type=1）'  AS 種別, COUNT(*) AS 件数 FROM items WHERE item_type = 1
UNION ALL
SELECT '仕込み品（item_type=2）', COUNT(*) FROM items WHERE item_type = 2
UNION ALL
SELECT 'お品（item_type=3）',     COUNT(*) FROM items WHERE item_type = 3
UNION ALL
SELECT 'item_relations',           COUNT(*) FROM item_relations
UNION ALL
SELECT 'users',                    COUNT(*) FROM users
UNION ALL
SELECT 'memos',                    COUNT(*) FROM memos;
