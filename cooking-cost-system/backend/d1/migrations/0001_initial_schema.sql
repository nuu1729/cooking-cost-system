-- ============================================================
-- 料理原価計算システム - Cloudflare D1 スキーマ定義（初回マイグレーション）
-- setup.sql (MySQL) からの変換。テーブル作成順は外部キー依存順を維持
-- （D1 は外部キー制約を無効化できないため）。
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL,
    email         TEXT    NOT NULL,
    password_hash TEXT    NOT NULL,
    is_active     INTEGER NOT NULL DEFAULT 1,
    icon_url      TEXT    NULL,
    home_bg_url   TEXT    NULL,
    created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (username),
    UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS stores (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    name       TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stores_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores (user_id);

CREATE TABLE IF NOT EXISTS genres (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    name       TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_genres_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE (user_id, name)
);
CREATE INDEX IF NOT EXISTS idx_genres_user_id ON genres (user_id);

-- item_type: 1:食材 2:仕込み品 3:お品
CREATE TABLE IF NOT EXISTS items (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NULL,
    name          TEXT    NOT NULL,
    item_type     INTEGER NOT NULL,
    store         TEXT    NOT NULL,
    price         NUMERIC NOT NULL,
    quantity      NUMERIC NOT NULL,
    unit          TEXT    NOT NULL,
    unit_price    NUMERIC NOT NULL,
    selling_price NUMERIC NULL,
    store_id      INTEGER NULL,
    genre         TEXT    DEFAULT NULL,
    genre_id      INTEGER NULL,
    description   TEXT    DEFAULT NULL,
    created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_items_user_id  FOREIGN KEY (user_id)  REFERENCES users  (id) ON DELETE CASCADE,
    CONSTRAINT fk_items_store_id FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE SET NULL,
    CONSTRAINT fk_items_genre_id FOREIGN KEY (genre_id) REFERENCES genres (id) ON DELETE SET NULL,
    CONSTRAINT chk_item_type CHECK (item_type IN (1, 2, 3)),
    CONSTRAINT chk_price     CHECK (price    >= 0),
    CONSTRAINT chk_quantity  CHECK (quantity  > 0)
);
CREATE INDEX IF NOT EXISTS idx_user_id   ON items (user_id);
CREATE INDEX IF NOT EXISTS idx_item_type ON items (item_type);
CREATE INDEX IF NOT EXISTS idx_name      ON items (name);
CREATE INDEX IF NOT EXISTS idx_type_name ON items (item_type, name);
CREATE INDEX IF NOT EXISTS idx_store_id  ON items (store_id);
CREATE INDEX IF NOT EXISTS idx_genre_id  ON items (genre_id);

CREATE TABLE IF NOT EXISTS item_relations (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_item_id INTEGER NOT NULL,
    child_item_id  INTEGER NOT NULL,
    amount         NUMERIC NOT NULL,
    cost           NUMERIC NOT NULL,
    created_at     TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ir_parent FOREIGN KEY (parent_item_id) REFERENCES items (id) ON DELETE CASCADE,
    CONSTRAINT fk_ir_child  FOREIGN KEY (child_item_id)  REFERENCES items (id) ON DELETE RESTRICT,
    UNIQUE (parent_item_id, child_item_id)
);
CREATE INDEX IF NOT EXISTS idx_parent ON item_relations (parent_item_id);
CREATE INDEX IF NOT EXISTS idx_child  ON item_relations (child_item_id);

CREATE TABLE IF NOT EXISTS memos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NULL,
    content    TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_memos_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_memos_user_id ON memos (user_id);

CREATE TABLE IF NOT EXISTS revoked_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    jti        TEXT NOT NULL,
    revoked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT NOT NULL,
    UNIQUE (jti)
);
