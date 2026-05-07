-- ============================================================
-- 料理原価計算システム - スキーマ定義（DDL）
-- 本番・開発共通のテーブル定義のみ記載
-- テストデータは seed-test.sql を参照
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `users` (
    `id`            INT          NOT NULL AUTO_INCREMENT,
    `username`      VARCHAR(50)  NOT NULL,
    `email`         VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
    `icon_url`      VARCHAR(500) NULL,
    `home_bg_url`   VARCHAR(500) NULL,
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    UNIQUE KEY `uk_email`    (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stores` (
    `id`         INT          NOT NULL AUTO_INCREMENT,
    `user_id`    INT          NOT NULL,
    `name`       VARCHAR(100) NOT NULL,
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_stores_user_id` (`user_id`),
    CONSTRAINT `fk_stores_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `genres` (
    `id`         INT         NOT NULL AUTO_INCREMENT,
    `name`       VARCHAR(50) NOT NULL,
    `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_genre_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `items` (
    `id`            INT            NOT NULL AUTO_INCREMENT,
    `user_id`       INT            NULL,
    `name`          VARCHAR(255)   NOT NULL,
    `item_type`     TINYINT        NOT NULL COMMENT '1:食材 2:仕込み品 3:お品',
    `store`         VARCHAR(100)   NOT NULL,
    `price`         DECIMAL(10,2)  NOT NULL,
    `quantity`      DECIMAL(10,2)  NOT NULL,
    `unit`          VARCHAR(20)    NOT NULL,
    `unit_price`    DECIMAL(10,4)  NOT NULL,
    `selling_price` DECIMAL(10,2)  NULL,
    `store_id`      INT            NULL,
    `genre`         VARCHAR(50)    DEFAULT NULL,
    `genre_id`      INT            NULL,
    `description`   TEXT           DEFAULT NULL,
    `created_at`    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_user_id`   (`user_id`),
    INDEX `idx_item_type` (`item_type`),
    INDEX `idx_name`      (`name`),
    INDEX `idx_type_name` (`item_type`, `name`),
    INDEX `idx_store_id`  (`store_id`),
    INDEX `idx_genre_id`  (`genre_id`),
    CONSTRAINT `fk_items_user_id`  FOREIGN KEY (`user_id`)  REFERENCES `users`  (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_items_store_id` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_items_genre_id` FOREIGN KEY (`genre_id`) REFERENCES `genres` (`id`) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS `revoked_tokens` (
    `id`         INT         NOT NULL AUTO_INCREMENT,
    `jti`        VARCHAR(36) NOT NULL,
    `revoked_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `expires_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_jti` (`jti`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
