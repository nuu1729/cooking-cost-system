export interface CompletedFoodDish {
    dishId: number;
    quantity: number;
    dish?: Dish;
}

export interface CompletedFood {
    id: number;
    name: string;
    category: string;
    dishes: CompletedFoodDish[];
    totalCost: number;
    sellingPrice: number;
    profit: number;
    profitMargin: number;
    notes?: string;
    completedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateCompletedFoodRequest {
    name: string;
    category: string;
    dishes: CompletedFoodDish[];
    sellingPrice: number;
    notes?: string;
    completedAt?: Date;
}

export interface UpdateCompletedFoodRequest {
    name?: string;
    category?: string;
    dishes?: CompletedFoodDish[];
    sellingPrice?: number;
    notes?: string;
    completedAt?: Date;
}