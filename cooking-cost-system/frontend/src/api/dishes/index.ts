import apiClient from '../client';
import { ApiResponse, Dish, CreateDishRequest } from '../../types';

export const dishApi = {
    // 料理一覧取得
    getAll: async (params?: {
        name?: string;
        genre?: string;
        minCost?: number;
        maxCost?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
        limit?: number;
        offset?: number;
    }): Promise<ApiResponse<Dish[]>> => {
        const response = await apiClient.get('/dishes', { params });
        return response.data;
    },
    
    // 料理詳細取得（食材付き）
    getById: async (id: number): Promise<ApiResponse<Dish>> => {
        const response = await apiClient.get(`/dishes/${id}`);
        return response.data;
    },
    
    // 料理作成
    create: async (data: CreateDishRequest): Promise<ApiResponse<Dish>> => {
        const response = await apiClient.post('/dishes', data);
        return response.data;
    },
    
    // 料理更新
    update: async (id: number, data: Partial<CreateDishRequest>): Promise<ApiResponse<Dish>> => {
        const response = await apiClient.put(`/dishes/${id}`, data);
        return response.data;
    },
    
    // 料理削除
    delete: async (id: number): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`/dishes/${id}`);
        return response.data;
    },
    
    // ジャンル別統計
    getGenreStats: async (): Promise<ApiResponse<any[]>> => {
        const response = await apiClient.get('/dishes/stats/genre');
        return response.data;
    },
};

export default dishApi;
