import { BaseModel } from './BaseModel';
import { Dish } from './Dish';

export interface FoodDishData {
    dish_id: number;
    usage_quantity: number;
    usage_unit: 'ratio' | 'serving';
    description?: string;
}

export interface CompletedFoodData {
    name: string;
    price?: number;
    description?: string;
    dishes: FoodDishData[];
}

export class CompletedFood extends BaseModel {
    protected static tableName = 'completed_foods';

    public name!: string;
    public price?: number;
    public total_cost!: number;
    public description?: string;

    constructor(data?: Partial<CompletedFoodData>) {
        super();
        if (data) {
            this.name = data.name!;
            this.price = data.price;
            this.description = data.description;
            this.total_cost = 0; // 初期値
        }
    }

    // 利益計算
    get profit(): number {
        return this.price ? this.price - this.total_cost : 0;
    }

    // 利益率計算
    get profit_rate(): number {
        return this.price ? (this.profit / this.price) * 100 : 0;
    }

    // 完成品作成（料理と一緒に保存）
    async createWithDishes(dishesData: FoodDishData[]): Promise<this> {
        return BaseModel.db.transaction(async (query) => {
            // 完成品を保存
            await this.save();

            // 料理データから総コストを計算
            let totalCost = 0;
            const foodDishes: any[] = [];

            for (const dishData of dishesData) {
                const dish = await Dish.findById(dishData.dish_id);
                if (!dish) {
                    throw new Error(`Dish with ID ${dishData.dish_id} not found`);
                }

                // 使用コスト計算（ratio は割合、serving は人前）
                let usageCost: number;
                if (dishData.usage_unit === 'ratio') {
                    usageCost = dish.total_cost * dishData.usage_quantity;
                } else {
                    usageCost = dish.total_cost * dishData.usage_quantity;
                }

                totalCost += usageCost;

                foodDishes.push({
                    food_id: this.id,
                    dish_id: dishData.dish_id,
                    usage_quantity: dishData.usage_quantity,
                    usage_unit: dishData.usage_unit,
                    usage_cost: usageCost,
                    description: dishData.description,
                });
            }

            // 完成品の総コスト更新
            this.total_cost = totalCost;
            await query('UPDATE completed_foods SET total_cost = ? WHERE id = ?', [totalCost, this.id]);

            // 完成品-料理関連データを保存
            for (const foodDish of foodDishes) {
                await query(
                    'INSERT INTO food_dishes (food_id, dish_id, usage_quantity, usage_unit, usage_cost, description) VALUES (?, ?, ?, ?, ?, ?)',
                    [foodDish.food_id, foodDish.dish_id, foodDish.usage_quantity, foodDish.usage_unit, foodDish.usage_cost, foodDish.description]
                );
            }

            return this;
        });
    }

    // 料理付きで取得
    static async findByIdWithDishes(id: number): Promise<CompletedFood | null> {
        const food = await this.findById(id);
        if (!food) return null;

        const dishesSql = `
            SELECT 
                fd.*,
                d.name as dish_name,
                d.genre as dish_genre,
                d.total_cost as dish_total_cost
            FROM food_dishes fd
            JOIN dishes d ON fd.dish_id = d.id
            WHERE fd.food_id = ?
        `;

        const dishes = await this.db.query(dishesSql, [id]);
        (food as any).dishes = dishes;

        return food;
    }

    // 検索メソッド
    static async search(criteria: {
        name?: string;
        minPrice?: number;
        maxPrice?: number;
        minCost?: number;
        maxCost?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
        limit?: number;
        offset?: number;
    }): Promise<CompletedFood[]> {
        let sql = 'SELECT * FROM completed_foods WHERE 1=1';
        const params: any[] = [];

        if (criteria.name) {
            sql += ' AND name LIKE ?';
            params.push(`%${criteria.name}%`);
        }

        if (criteria.minPrice) {
            sql += ' AND price >= ?';
            params.push(criteria.minPrice);
        }

        if (criteria.maxPrice) {
            sql += ' AND price <= ?';
            params.push(criteria.maxPrice);
        }

        if (criteria.minCost) {
            sql += ' AND total_cost >= ?';
            params.push(criteria.minCost);
        }

        if (criteria.maxCost) {
            sql += ' AND total_cost <= ?';
            params.push(criteria.maxCost);
        }

        const sortBy = criteria.sortBy || 'created_at';
        const sortOrder = criteria.sortOrder || 'DESC';
        sql += ` ORDER BY ${sortBy} ${sortOrder}`;

        if (criteria.limit) {
            sql += ' LIMIT ?';
            params.push(criteria.limit);

            if (criteria.offset) {
                sql += ' OFFSET ?';
                params.push(criteria.offset);
            }
        }

        const rows = await this.db.query(sql, params);
        return rows.map((row: any) => Object.assign(new CompletedFood(), row));
    }

    // 利益率順で取得
    static async findByProfitRate(limit: number = 10): Promise<any[]> {
        const sql = `
            SELECT 
                *,
                (price - total_cost) as profit,
                CASE WHEN price > 0 THEN ((price - total_cost) / price) * 100 ELSE 0 END as profit_rate
            FROM completed_foods 
            WHERE price IS NOT NULL AND price > 0
            ORDER BY profit_rate DESC
            LIMIT ?
        `;
        return this.db.query(sql, [limit]);
    }

    // 完成品削除（関連データも削除）
    async delete(): Promise<void> {
        if (!this.id) {
            throw new Error('Cannot delete completed food without ID');
        }

        await BaseModel.db.transaction(async (query) => {
            // 完成品-料理関連データ削除
            await query('DELETE FROM food_dishes WHERE food_id = ?', [this.id]);
            
            // 完成品削除
            await query('DELETE FROM completed_foods WHERE id = ?', [this.id]);
        });
    }
}