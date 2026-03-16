import apiClient from '../client';
import { ApiResponse, Ingredient, CreateIngredientRequest, UpdateIngredientRequest } from '../../types';

export const ingredientApi = {
    // 食材一覧取得
    getAll: async (params?: {
        name?: string;
        store?: string;
        genre?: string;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
        limit?: number;
        offset?: number;
    }): Promise<ApiResponse<Ingredient[]>> => {
        const response = await apiClient.get('/ingredients', { params });
        return response.data;
    },
    
    // 食材詳細取得
    getById: async (id: number): Promise<ApiResponse<Ingredient>> => {
        const response = await apiClient.get(`/ingredients/${id}`);
        return response.data;
    },
    
    // 食材作成
    create: async (data: CreateIngredientRequest): Promise<ApiResponse<Ingredient>> => {
        const response = await apiClient.post('/ingredients', data);
        return response.data;
    },
    
    // 食材更新
    update: async (id: number, data: UpdateIngredientRequest): Promise<ApiResponse<Ingredient>> => {
        const response = await apiClient.put(`/ingredients/${id}`, data);
        return response.data;
    },
    
    // 食材削除
    delete: async (id: number): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`/ingredients/${id}`);
        return response.data;
    },
    
    // ジャンル別統計
    getGenreStats: async (): Promise<ApiResponse<any[]>> => {
        const response = await apiClient.get('/ingredients/stats/genre');
        return response.data;
    },
    
    // 人気食材
    getPopular: async (limit?: number): Promise<ApiResponse<any[]>> => {
        const response = await apiClient.get('/ingredients/popular', { 
            params: { limit } 
        });
        return response.data;
    },

    // 商品検索（サジェスト用）
    searchIngredients: async (query: string): Promise<ApiResponse<Ingredient[]>> => {
        const response = await apiClient.get('/ingredients/search', {
            params: { q: query }
        });
        return response.data;
    },
};

export default ingredientApi;
