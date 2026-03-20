import { Ingredient } from '../../types';
import loginAccounts from '../data/login_accounts.json';
import initialIngredients from '../data/ingredients.json';
import initialPreps from '../data/preps.json';
import initialDishes from '../data/dishes.json';

// In-Memory DB (移行前の互換性用)
export let MOCK_ACCOUNTS = [...loginAccounts];
export let MOCK_INGREDIENTS: Ingredient[] = [...initialIngredients] as Ingredient[];
export let MOCK_PREPS: any[] = [...initialPreps];
export let MOCK_DISHES: any[] = [...initialDishes];

// ----------------------------------------------------
// 統合DBモデル（アイテムと構成要素の単一化）
// ----------------------------------------------------
import { UnifiedItem, UnifiedRecipeItem } from '../../types';

export let MOCK_ITEMS: UnifiedItem[] = [
    // 既存の食材を属性1（食材）としてマッピング
    ...(initialIngredients.map(i => ({
        id: i.id,
        name: i.name,
        item_type: 1 as const,
        store: i.store,
        price: i.price,
        quantity: i.quantity,
        unit: i.unit,
        unit_price: i.unit_price,
        genre: i.genre,
        created_at: i.created_at,
        updated_at: i.updated_at
    }))),
    // 既存の仕込みを属性2（仕込み品）としてマッピング
    ...(initialPreps.map(p => ({
        id: p.id,
        name: p.prep_name,
        item_type: 2 as const,
        store: '自家製',
        price: p.total_cost,
        quantity: p.yield_amount,
        unit: p.yield_unit,
        unit_price: Number((p.total_cost / p.yield_amount).toFixed(4)),
        genre: 'sauce',
        created_at: p.created_at,
        updated_at: p.updated_at
    })))
];

// 仕込みの构成情報をレシピとしてマッピング
export let MOCK_RECIPE_ITEMS: UnifiedRecipeItem[] = initialPreps.flatMap((p) => 
    p.items.map((item: any) => ({
        id: Math.floor(Math.random() * 1000000),
        parent_item_id: p.id,
        child_item_id: item.ingredient_id,
        amount: item.amount,
        cost: item.cost
    }))
);

