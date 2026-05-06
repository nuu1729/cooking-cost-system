import apiClient from '../client';
import { ApiResponse } from '../../types';

export interface Genre {
    id: number;
    name: string;
    ingredient_count: number;
    created_at: string;
}

export const genreApi = {
    getAll: async (): Promise<ApiResponse<Genre[]>> => {
        const response = await apiClient.get('/genres');
        return response.data;
    },

    create: async (data: { name: string }): Promise<ApiResponse<Genre>> => {
        const response = await apiClient.post('/genres', data);
        return response.data;
    },

    update: async (id: number, data: { name: string }): Promise<ApiResponse<Genre>> => {
        const response = await apiClient.put(`/genres/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`/genres/${id}`);
        return response.data;
    },
};

export default genreApi;
