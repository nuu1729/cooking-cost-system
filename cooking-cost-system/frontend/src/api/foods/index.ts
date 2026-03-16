import apiClient from '../client';
import { ApiResponse, CompletedFood, CreateCompletedFoodRequest } from '../../types';

export const completedFoodApi = {
    // 完成品一覧取得
    getAll: async (params?: {
        name?: string;
        minPrice?: number;
        maxPrice?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
        limit?: number;
        offset?: number;
    }): Promise<ApiResponse<CompletedFood[]>> => {
        const response = await apiClient.get('/foods', { params });
        return response.data;
    },
    
    // 完成品詳細取得
    getById: async (id: number): Promise<ApiResponse<CompletedFood>> => {
        const response = await apiClient.get(`/foods/${id}`);
        return response.data;
    },
    
    // 完成品作成
    create: async (data: CreateCompletedFoodRequest): Promise<ApiResponse<CompletedFood>> => {
        const response = await apiClient.post('/foods', data);
        return response.data;
    },
    
    // 完成品更新
    update: async (id: number, data: Partial<CreateCompletedFoodRequest>): Promise<ApiResponse<CompletedFood>> => {
        const response = await apiClient.put(`/foods/${id}`, data);
        return response.data;
    },
    
    // 完成品削除
    delete: async (id: number): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`/foods/${id}`);
        return response.data;
    },
    
    // 利益率順取得
    getProfitableItems: async (limit?: number): Promise<ApiResponse<any[]>> => {
        const response = await apiClient.get('/foods/stats/profit', { 
            params: { limit } 
        });
        return response.data;
    },
};

export default completedFoodApi;
