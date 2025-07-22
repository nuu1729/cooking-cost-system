export interface DishIngredient {
    ingredientId: number;
    quantity: number;
    ingredient?: Ingredient;
}

export interface Dish {
    id: number;
    name: string;
    category: string;
    servings: number;
    ingredients: DishIngredient[];
    totalCost: number;
    costPerServing: number;
    instructions?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateDishRequest {
    name: string;
    category: string;
    servings: number;
    ingredients: DishIngredient[];
    instructions?: string;
    notes?: string;
}

export interface UpdateDishRequest {
    name?: string;
    category?: string;
    servings?: number;
    ingredients?: DishIngredient[];
    instructions?: string;
    notes?: string;
}