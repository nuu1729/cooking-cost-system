import apiClient from '../client';
import { ApiResponse } from '../../types';

export interface Store {
    id: number;
    user_id: number;
    name: string;
    ingredient_count: number;
    created_at: string;
    updated_at: string;
}

export const storesApi = {
    getAll: async (): Promise<ApiResponse<Store[]>> => {
        const response = await apiClient.get('/stores');
        return response.data;
    },

    create: async (name: string): Promise<ApiResponse<Store>> => {
        const response = await apiClient.post('/stores', { name });
        return response.data;
    },

    update: async (id: number, name: string): Promise<ApiResponse<Store>> => {
        const response = await apiClient.put(`/stores/${id}`, { name });
        return response.data;
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`/stores/${id}`);
        return response.data;
    },
};

export default storesApi;
