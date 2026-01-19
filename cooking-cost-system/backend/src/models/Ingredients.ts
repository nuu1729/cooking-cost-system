import { BaseModel } from './BaseModel';
import { GenreType } from '../types/ingredient';

export interface IngredientData {
    name: string;
    store: string;
    quantity: number;
    unit: string;
    price: number;
    genre: GenreType;
}

export class Ingredient extends BaseModel {
    protected static tableName = 'ingredients';

    public name!: string;
    public store!: string;
    public quantity!: number;
    public unit!: string;
    public price!: number;
    public unit_price!: number;
    public genre!: GenreType;

    constructor(data?: Partial<IngredientData>) {
        super();
        if (data) {
            Object.assign(this, data);
            this.calculateUnitPrice();
        }
    }

    // 単価計算
    private calculateUnitPrice(): void {
        if (this.quantity > 0 && this.price > 0) {
            this.unit_price = this.price / this.quantity;
        }
    }

    // 保存前の処理をオーバーライド
    async save(): Promise<this> {
        this.calculateUnitPrice();
        return super.save();
    }

    // 検索メソッド
    static async search(criteria: {
        name?: string;
        store?: string;
        genre?: GenreType;
        minPrice?: number;
        maxPrice?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
        limit?: number;
        offset?: number;
    }): Promise<Ingredient[]> {
        let sql = 'SELECT * FROM ingredients WHERE 1=1';
        const params: any[] = [];

        if (criteria.name) {
            sql += ' AND name LIKE ?';
            params.push(`%${criteria.name}%`);
        }

        if (criteria.store) {
            sql += ' AND store LIKE ?';
            params.push(`%${criteria.store}%`);
        }

        if (criteria.genre) {
            sql += ' AND genre = ?';
            params.push(criteria.genre);
        }

        if (criteria.minPrice) {
            sql += ' AND price >= ?';
            params.push(criteria.minPrice);
        }

        if (criteria.maxPrice) {
            sql += ' AND price <= ?';
            params.push(criteria.maxPrice);
        }

        // ソート
        const sortBy = criteria.sortBy || 'created_at';
        const sortOrder = criteria.sortOrder || 'DESC';
        sql += ` ORDER BY ${sortBy} ${sortOrder}`;

        if (criteria.limit !== undefined) {
            sql += ` LIMIT ${Number(criteria.limit)}`;

            if (criteria.offset !== undefined) {
                sql += ` OFFSET ${Number(criteria.offset)}`;
            }
        }

        const rows = await BaseModel.db.query(sql, params);
        return rows.map((row: any) => Object.assign(new Ingredient(), row));
    }

    // ジャンル別統計
    static async getGenreStatistics(): Promise<any[]> {
        const sql = `
            SELECT 
                genre,
                COUNT(*) as ingredient_count,
                AVG(unit_price) as avg_unit_price,
                MIN(unit_price) as min_unit_price,
                MAX(unit_price) as max_unit_price,
                SUM(price) as total_purchase_cost
            FROM ingredients 
            GROUP BY genre
        `;
        return BaseModel.db.query(sql);
    }

    // よく使われる食材
    static async getPopularIngredients(limit: number = 10): Promise<any[]> {
        const sql = `
            SELECT 
                i.id,
                i.name,
                i.store,
                i.genre,
                COUNT(di.dish_id) as usage_count,
                AVG(di.used_quantity) as avg_used_quantity,
                SUM(di.used_cost) as total_used_cost
            FROM ingredients i
            LEFT JOIN dish_ingredients di ON i.id = di.ingredient_id
            GROUP BY i.id
            ORDER BY usage_count DESC, total_used_cost DESC
            LIMIT ?
        `;
        return BaseModel.db.query(sql, [limit]);
    }
}