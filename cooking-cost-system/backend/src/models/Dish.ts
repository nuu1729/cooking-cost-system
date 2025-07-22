import { BaseModel } from './BaseModel';
import { Ingredient } from './Ingredient';

export interface DishIngredientData {
    ingredient_id: number;
    used_quantity: number;
}

export interface DishData {
    name: string;
    genre?: string;
    description?: string;
    ingredients: DishIngredientData[];
}

export class Dish extends BaseModel {
    protected static tableName = 'dishes';

    public name!: string;
    public total_cost!: number;
    public genre!: string;
    public description?: string;

    constructor(data?: Partial<DishData>) {
        super();
        if (data) {
            this.name = data.name!;
            this.genre = data.genre || 'main';
            this.description = data.description;
            this.total_cost = 0; // 初期値
        }
    }

    // 料理作成（食材と一緒に保存）
    async createWithIngredients(ingredientsData: DishIngredientData[]): Promise<this> {
        return BaseModel.db.transaction(async (query) => {
            // 料理を保存
            await this.save();

            // 食材データから総コストを計算
            let totalCost = 0;
            const dishIngredients: any[] = [];

            for (const ingredientData of ingredientsData) {
                const ingredient = await Ingredient.findById(ingredientData.ingredient_id);
                if (!ingredient) {
                    throw new Error(`Ingredient with ID ${ingredientData.ingredient_id} not found`);
                }

                const usedCost = ingredient.unit_price * ingredientData.used_quantity;
                totalCost += usedCost;

                dishIngredients.push({
                    dish_id: this.id,
                    ingredient_id: ingredientData.ingredient_id,
                    used_quantity: ingredientData.used_quantity,
                    used_cost: usedCost,
                });
            }

            // 料理の総コスト更新
            this.total_cost = totalCost;
            await query('UPDATE dishes SET total_cost = ? WHERE id = ?', [totalCost, this.id]);

            // 料理-食材関連データを保存
            for (const dishIngredient of dishIngredients) {
                await query(
                    'INSERT INTO dish_ingredients (dish_id, ingredient_id, used_quantity, used_cost) VALUES (?, ?, ?, ?)',
                    [dishIngredient.dish_id, dishIngredient.ingredient_id, dishIngredient.used_quantity, dishIngredient.used_cost]
                );
            }

            return this;
        });
    }

    // 食材付きで取得
    static async findByIdWithIngredients(id: number): Promise<Dish | null> {
        const dish = await this.findById(id);
        if (!dish) return null;

        const ingredientsSql = `
            SELECT 
                di.*,
                i.name as ingredient_name,
                i.unit as ingredient_unit,
                i.genre as ingredient_genre
            FROM dish_ingredients di
            JOIN ingredients i ON di.ingredient_id = i.id
            WHERE di.dish_id = ?
        `;

        const ingredients = await this.db.query(ingredientsSql, [id]);
        (dish as any).ingredients = ingredients;

        return dish;
    }

    // 検索メソッド
    static async search(criteria: {
        name?: string;
        genre?: string;
        minCost?: number;
        maxCost?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
        limit?: number;
        offset?: number;
    }): Promise<Dish[]> {
        let sql = 'SELECT * FROM dishes WHERE 1=1';
        const params: any[] = [];

        if (criteria.name) {
            sql += ' AND name LIKE ?';
            params.push(`%${criteria.name}%`);
        }

        if (criteria.genre) {
            sql += ' AND genre = ?';
            params.push(criteria.genre);
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
        return rows.map((row: any) => Object.assign(new Dish(), row));
    }

    // ジャンル別統計
    static async getGenreStatistics(): Promise<any[]> {
        const sql = `
            SELECT 
                genre,
                COUNT(*) as dish_count,
                AVG(total_cost) as avg_total_cost,
                MIN(total_cost) as min_total_cost,
                MAX(total_cost) as max_total_cost
            FROM dishes 
            GROUP BY genre
        `;
        return this.db.query(sql);
    }

    // 料理削除（関連データも削除）
    async delete(): Promise<void> {
        if (!this.id) {
            throw new Error('Cannot delete dish without ID');
        }

        await BaseModel.db.transaction(async (query) => {
            // 料理-食材関連データ削除
            await query('DELETE FROM dish_ingredients WHERE dish_id = ?', [this.id]);
            
            // 完成品-料理関連データ削除
            await query('DELETE FROM food_dishes WHERE dish_id = ?', [this.id]);
            
            // 料理削除
            await query('DELETE FROM dishes WHERE id = ?', [this.id]);
        });
    }
}