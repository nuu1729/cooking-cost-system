#!/usr/bin/env ts-node

import { promises as fs } from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';

// ================================
// マイグレーション管理クラス
// ================================

interface Migration {
    id: string;
    name: string;
    filename: string;
    executed_at?: Date;
}

class DatabaseMigrator {
    private connection: mysql.Connection | null = null;
    private migrationDir: string;

    constructor(migrationDir: string = './database/migrations') {
        this.migrationDir = migrationDir;
    }

    /**
     * データベース接続を確立
     */
    async connect(): Promise<void> {
        try {
            this.connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '3306'),
                user: process.env.DB_USER || 'cooking_user',
                password: process.env.DB_PASSWORD || 'cooking_password',
                database: process.env.DB_NAME || 'cooking_cost_system',
                multipleStatements: true,
            });

            logger.info('Database connection established for migration');
        } catch (error) {
            logger.error('Failed to connect to database:', error);
            throw error;
        }
    }

    /**
     * マイグレーションテーブルを作成
     */
    async createMigrationTable(): Promise<void> {
        if (!this.connection) throw new Error('Database not connected');

        const sql = `
            CREATE TABLE IF NOT EXISTS migrations (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;

        await this.connection.execute(sql);
        logger.info('Migration table created or verified');
    }

    /**
     * 実行済みマイグレーションを取得
     */
    async getExecutedMigrations(): Promise<Migration[]> {
        if (!this.connection) throw new Error('Database not connected');

        const [rows] = await this.connection.execute(
            'SELECT id, name, executed_at FROM migrations ORDER BY executed_at'
        );

        return rows as Migration[];
    }

    /**
     * 利用可能なマイグレーションファイルを取得
     */
    async getAvailableMigrations(): Promise<Migration[]> {
        try {
            const files = await fs.readdir(this.migrationDir);
            const migrationFiles = files
                .filter(file => file.endsWith('.sql'))
                .sort();

            return migrationFiles.map(filename => {
                const id = filename.replace('.sql', '');
                const nameParts = id.split('_');
                const name = nameParts.slice(1).join(' ').replace(/-/g, ' ');

                return {
                    id,
                    name,
                    filename,
                };
            });
        } catch (error) {
            logger.error('Failed to read migration directory:', error);
            return [];
        }
    }

    /**
     * 単一マイグレーションを実行
     */
    async executeMigration(migration: Migration): Promise<void> {
        if (!this.connection) throw new Error('Database not connected');

        const filePath = path.join(this.migrationDir, migration.filename);
        
        try {
            const sql = await fs.readFile(filePath, 'utf-8');
            
            logger.info(`Executing migration: ${migration.id}`);
            
            // トランザクション内で実行
            await this.connection.beginTransaction();
            
            try {
                // マイグレーションSQL実行
                await this.connection.query(sql);
                
                // マイグレーション記録を追加
                await this.connection.execute(
                    'INSERT INTO migrations (id, name) VALUES (?, ?)',
                    [migration.id, migration.name]
                );
                
                await this.connection.commit();
                logger.info(`Migration completed: ${migration.id}`);
                
            } catch (error) {
                await this.connection.rollback();
                throw error;
            }
            
        } catch (error) {
            logger.error(`Failed to execute migration ${migration.id}:`, error);
            throw error;
        }
    }

    /**
     * 複数マイグレーションを実行
     */
    async runMigrations(): Promise<void> {
        await this.createMigrationTable();
        
        const executed = await this.getExecutedMigrations();
        const available = await this.getAvailableMigrations();
        
        const executedIds = new Set(executed.map(m => m.id));
        const pendingMigrations = available.filter(m => !executedIds.has(m.id));
        
        if (pendingMigrations.length === 0) {
            logger.info('No pending migrations found');
            return;
        }
        
        logger.info(`Found ${pendingMigrations.length} pending migration(s)`);
        
        for (const migration of pendingMigrations) {
            await this.executeMigration(migration);
        }
        
        logger.info('All migrations completed successfully');
    }

    /**
     * マイグレーション状態を表示
     */
    async showStatus(): Promise<void> {
        await this.createMigrationTable();
        
        const executed = await this.getExecutedMigrations();
        const available = await this.getAvailableMigrations();
        
        console.log('\n=== Migration Status ===\n');
        
        const executedIds = new Set(executed.map(m => m.id));
        
        for (const migration of available) {
            const status = executedIds.has(migration.id) ? '✅ EXECUTED' : '⏳ PENDING';
            const executedMigration = executed.find(m => m.id === migration.id);
            const date = executedMigration?.executed_at ? 
                new Date(executedMigration.executed_at).toISOString() : 
                'Not executed';
            
            console.log(`${status} ${migration.id} - ${migration.name} (${date})`);
        }
        
        console.log(`\nTotal: ${available.length} migrations, ${executed.length} executed, ${available.length - executed.length} pending\n`);
    }

    /**
     * 新しいマイグレーションファイルを作成
     */
    async createMigration(name: string): Promise<void> {
        const timestamp = new Date().toISOString()
            .replace(/[-:]/g, '')
            .replace('T', '_')
            .split('.')[0];
        
        const filename = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}.sql`;
        const filepath = path.join(this.migrationDir, filename);
        
        const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}
-- 
-- Description:
-- TODO: Add description of what this migration does

-- ================================
-- Migration Up
-- ================================

-- TODO: Add your migration SQL here
-- Example:
-- ALTER TABLE ingredients ADD COLUMN new_column VARCHAR(255);

-- ================================
-- Migration Complete
-- ================================
`;

        try {
            await fs.mkdir(this.migrationDir, { recursive: true });
            await fs.writeFile(filepath, template);
            
            logger.info(`Migration file created: ${filename}`);
            console.log(`\nNew migration created: ${filepath}`);
            console.log('Please edit the file to add your migration SQL.\n');
            
        } catch (error) {
            logger.error('Failed to create migration file:', error);
            throw error;
        }
    }

    /**
     * データベース接続を閉じる
     */
    async close(): Promise<void> {
        if (this.connection) {
            await this.connection.end();
            this.connection = null;
            logger.info('Database connection closed');
        }
    }
}

// ================================
// コマンドライン処理
// ================================

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (!command) {
        console.log(`
Usage: ts-node src/scripts/migrate.ts <command> [options]

Commands:
  run                    Run all pending migrations
  status                 Show migration status
  create <name>          Create a new migration file
  help                   Show this help message

Examples:
  ts-node src/scripts/migrate.ts run
  ts-node src/scripts/migrate.ts status
  ts-node src/scripts/migrate.ts create "add user roles"
        `);
        return;
    }

    const migrator = new DatabaseMigrator();
    
    try {
        await migrator.connect();
        
        switch (command) {
            case 'run':
                await migrator.runMigrations();
                break;
                
            case 'status':
                await migrator.showStatus();
                break;
                
            case 'create':
                const migrationName = args[1];
                if (!migrationName) {
                    console.error('Error: Migration name is required');
                    process.exit(1);
                }
                await migrator.createMigration(migrationName);
                break;
                
            case 'help':
                console.log('Help: See usage above');
                break;
                
            default:
                console.error(`Error: Unknown command '${command}'`);
                process.exit(1);
        }
        
    } catch (error) {
        logger.error('Migration script failed:', error);
        console.error('\n❌ Migration failed:', error instanceof Error ? error.message : error);
        process.exit(1);
        
    } finally {
        await migrator.close();
    }
}

// ================================
// サンプルマイグレーション生成
// ================================

/**
 * サンプルマイグレーションファイルを生成
 */
async function generateSampleMigrations(): Promise<void> {
    const migrationDir = './database/migrations';
    
    try {
        await fs.mkdir(migrationDir, { recursive: true });
        
        const migrations = [
            {
                name: '20250101_000001_add_ingredient_categories.sql',
                content: `-- Add ingredient categories table

CREATE TABLE IF NOT EXISTS ingredient_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#808080',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add category_id to ingredients table
ALTER TABLE ingredients ADD COLUMN category_id INT NULL;
ALTER TABLE ingredients ADD FOREIGN KEY (category_id) REFERENCES ingredient_categories(id);

-- Insert default categories
INSERT INTO ingredient_categories (name, description, color) VALUES
('肉類', '牛肉、豚肉、鶏肉など', '#FF6B6B'),
('野菜類', '根菜、葉菜、果菜など', '#4ECDC4'),
('調味料', '塩、砂糖、醤油など', '#45B7D1'),
('ソース類', 'ドレッシング、タレなど', '#FFA07A'),
('冷凍食品', '冷凍野菜、冷凍肉など', '#98D8C8'),
('飲料', '水、ジュースなど', '#F7DC6F');`
            },
            {
                name: '20250101_000002_add_recipe_instructions.sql',
                content: `-- Add recipe instructions to dishes

ALTER TABLE dishes ADD COLUMN instructions TEXT AFTER description;
ALTER TABLE dishes ADD COLUMN prep_time INT DEFAULT 0 COMMENT 'Preparation time in minutes';
ALTER TABLE dishes ADD COLUMN cook_time INT DEFAULT 0 COMMENT 'Cooking time in minutes';
ALTER TABLE dishes ADD COLUMN difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium';

-- Add recipe steps table
CREATE TABLE IF NOT EXISTS recipe_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dish_id INT NOT NULL,
    step_number INT NOT NULL,
    instruction TEXT NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_dish_step (dish_id, step_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
            },
            {
                name: '20250101_000003_add_nutrition_info.sql',
                content: `-- Add nutrition information

CREATE TABLE IF NOT EXISTS nutrition_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dish_id INT NOT NULL,
    calories DECIMAL(8,2) DEFAULT 0,
    protein DECIMAL(8,2) DEFAULT 0,
    carbohydrates DECIMAL(8,2) DEFAULT 0,
    fat DECIMAL(8,2) DEFAULT 0,
    fiber DECIMAL(8,2) DEFAULT 0,
    sugar DECIMAL(8,2) DEFAULT 0,
    sodium DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
            }
        ];
        
        for (const migration of migrations) {
            const filepath = path.join(migrationDir, migration.name);
            await fs.writeFile(filepath, migration.content);
            console.log(`Created sample migration: ${migration.name}`);
        }
        
        console.log(`\n✅ Sample migrations created in ${migrationDir}`);
        
    } catch (error) {
        console.error('Failed to create sample migrations:', error);
    }
}

// ================================
// 実行
// ================================

if (require.main === module) {
    // 環境変数の読み込み
    require('dotenv').config();
    
    // サンプルマイグレーション生成（初回のみ）
    if (process.argv.includes('--generate-samples')) {
        generateSampleMigrations().then(() => {
            console.log('Sample migrations generated. You can now run them with: npm run migrate run');
        });
    } else {
        main();
    }
}

export default DatabaseMigrator;

// ================================
// src/scripts/seed.ts - シードデータスクリプト
// ================================

export class DatabaseSeeder {
    private connection: mysql.Connection | null = null;

    async connect(): Promise<void> {
        this.connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'cooking_user',
            password: process.env.DB_PASSWORD || 'cooking_password',
            database: process.env.DB_NAME || 'cooking_cost_system',
            multipleStatements: true,
        });
    }

    async seedIngredients(): Promise<void> {
        if (!this.connection) throw new Error('Database not connected');

        const ingredients = [
            ['豚バラ肉', 'スーパーマルエツ', 500, 'g', 450, 0.9, 'meat'],
            ['鶏もも肉', 'コストコ', 2000, 'g', 980, 0.49, 'meat'],
            ['玉ねぎ', 'JA直売所', 3000, 'g', 300, 0.1, 'vegetable'],
            ['人参', 'JA直売所', 1000, 'g', 150, 0.15, 'vegetable'],
            ['醤油', 'キッコーマン', 500, 'ml', 280, 0.56, 'seasoning'],
        ];

        const sql = `
            INSERT IGNORE INTO ingredients (name, store, quantity, unit, price, unit_price, genre)
            VALUES ?
        `;

        await this.connection.query(sql, [ingredients]);
        logger.info(`Seeded ${ingredients.length} ingredients`);
    }

    async seedDishes(): Promise<void> {
        if (!this.connection) throw new Error('Database not connected');

        // 料理のシードデータ実装
        // 実際の実装では、食材IDを参照して料理と食材の関連も作成
    }

    async runAllSeeds(): Promise<void> {
        await this.connect();
        
        try {
            logger.info('Starting database seeding...');
            
            await this.seedIngredients();
            await this.seedDishes();
            
            logger.info('Database seeding completed successfully');
            
        } catch (error) {
            logger.error('Seeding failed:', error);
            throw error;
        } finally {
            if (this.connection) {
                await this.connection.end();
            }
        }
    }

    async close(): Promise<void> {
        if (this.connection) {
            await this.connection.end();
            this.connection = null;
        }
    }
}
