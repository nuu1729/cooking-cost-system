import { getDatabase } from '../database';
import { logger } from '../utils/logger';

export abstract class BaseModel {
    public id?: number;
    public created_at?: Date;
    public updated_at?: Date;

    protected static tableName: string;

    // データベースインスタンス取得
    public static get db() {
        return getDatabase();
    }

    // 全件取得
    static async findAll<T extends BaseModel>(
        this: new () => T,
        options?: {
            where?: Record<string, any>;
            orderBy?: string;
            limit?: number;
            offset?: number;
        }
    ): Promise<T[]> {
        const model = new this();
        const tableName = (this as any).tableName;

        let sql = `SELECT * FROM \`${tableName}\``;
        const params: any[] = [];

        if (options?.where) {
            const whereConditions = Object.keys(options.where).map(key => {
                params.push(options.where![key]);
                return `\`${key}\` = ?`;
            });
            sql += ` WHERE ${whereConditions.join(' AND ')}`;
        }

        if (options?.orderBy) {
            sql += ` ORDER BY ${options.orderBy}`;
        }

        if (options?.limit) {
            sql += ` LIMIT ${options.limit}`;
            if (options?.offset) {
                sql += ` OFFSET ${options.offset}`;
            }
        }

        const rows = await BaseModel.db.query(sql, params);
        return rows.map((row: any) => Object.assign(new this(), row));
    }

    // ID で取得
    static async findById<T extends BaseModel>(
        this: new () => T,
        id: number
    ): Promise<T | null> {
        const tableName = (this as any).tableName;
        const sql = `SELECT * FROM \`${tableName}\` WHERE id = ?`;
        const row = await BaseModel.db.queryOne(sql, [id]);

        return row ? Object.assign(new this(), row) : null;
    }

    // 条件で1件取得
    static async findOne<T extends BaseModel>(
        this: new () => T,
        where: Record<string, any>
    ): Promise<T | null> {
        const tableName = (this as any).tableName;
        const whereConditions = Object.keys(where).map(key => `\`${key}\` = ?`);
        const sql = `SELECT * FROM \`${tableName}\` WHERE ${whereConditions.join(' AND ')}`;

        const row = await BaseModel.db.queryOne(sql, Object.values(where));
        return row ? Object.assign(new this(), row) : null;
    }

    // 保存（INSERT/UPDATE）
    async save(): Promise<this> {
        const tableName = (this.constructor as any).tableName;

        if (this.id) {
            // UPDATE
            const fields = this.getUpdateableFields();
            const setClause = Object.keys(fields).map(key => `\`${key}\` = ?`).join(', ');
            const sql = `UPDATE \`${tableName}\` SET ${setClause} WHERE id = ?`;
            const params = [...Object.values(fields), this.id];

            await BaseModel.db.query(sql, params);
            this.updated_at = new Date();
        } else {
            // INSERT
            const fields = this.getInsertableFields();
            const columns = Object.keys(fields).map(key => `\`${key}\``).join(', ');
            const values = Object.keys(fields).map(() => '?').join(', ');
            const sql = `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values})`;

            const result = await BaseModel.db.query(sql, Object.values(fields)) as any;
            this.id = result.insertId;
            this.created_at = new Date();
            this.updated_at = new Date();
        }

        return this;
    }

    // 削除
    async delete(): Promise<void> {
        if (!this.id) {
            throw new Error('Cannot delete model without ID');
        }

        const tableName = (this.constructor as any).tableName;
        const sql = `DELETE FROM \`${tableName}\` WHERE id = ?`;
        await BaseModel.db.query(sql, [this.id]);
    }

    // 静的削除
    static async deleteById(id: number): Promise<void> {
        const tableName = (this as any).tableName;
        const sql = `DELETE FROM \`${tableName}\` WHERE id = ?`;
        await BaseModel.db.query(sql, [id]);
    }

    // 挿入可能なフィールドを取得
    protected getInsertableFields(): Record<string, any> {
        const fields: Record<string, any> = {};

        Object.keys(this).forEach(key => {
            if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
                fields[key] = (this as any)[key];
            }
        });

        return fields;
    }

    // 更新可能なフィールドを取得
    protected getUpdateableFields(): Record<string, any> {
        const fields: Record<string, any> = {};

        Object.keys(this).forEach(key => {
            if (key !== 'id' && key !== 'created_at') {
                if (key === 'updated_at') {
                    fields[key] = new Date();
                } else {
                    fields[key] = (this as any)[key];
                }
            }
        });

        return fields;
    }

    // JSON シリアライゼーション
    toJSON(): Record<string, any> {
        const obj: Record<string, any> = {};

        Object.keys(this).forEach(key => {
            const value = (this as any)[key];
            if (value instanceof Date) {
                obj[key] = value.toISOString();
            } else {
                obj[key] = value;
            }
        });

        return obj;
    }
}