export type GenreType = 'meat' | 'vegetable' | 'seasoning' | 'sauce' | 'frozen' | 'drink';

export interface Ingredient {
    id?: number;
    name: string;
    store: string;
    quantity: number;
    unit: string;
    price: number;
    unit_price: number;
    genre: GenreType;
    created_at?: Date | string;
    updated_at?: Date | string;
}

export interface CreateIngredientRequest {
    name: string;
    store: string;
    quantity: number;
    unit: string;
    price: number;
    genre: GenreType;
}

export interface UpdateIngredientRequest extends Partial<CreateIngredientRequest> {
    id: number;
}

export interface IngredientSearchParams {
    name?: string;
    store?: string;
    genre?: GenreType;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'name' | 'price' | 'unit_price' | 'created_at';
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
}