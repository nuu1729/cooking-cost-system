import apiClient from '../client';
import { ApiResponse } from '../../types';

export const memoApi = {
    // メモ一覧取得
    getAll: async (): Promise<ApiResponse<any[]>> => {
        const response = await apiClient.get('/memo');
        return response.data;
    },
    
    // メモ取得
    getById: async (id: number): Promise<ApiResponse<any>> => {
        const response = await apiClient.get(`/memo/${id}`);
        return response.data;
    },
    
    // メモ作成
    create: async (content: string): Promise<ApiResponse<any>> => {
        const response = await apiClient.post('/memo', { content });
        return response.data;
    },
    
    // メモ更新
    update: async (id: number, content: string): Promise<ApiResponse<any>> => {
        const response = await apiClient.put(`/memo/${id}`, { content });
        return response.data;
    },
    
    // メモ削除
    delete: async (id: number): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`/memo/${id}`);
        return response.data;
    },
};

export default memoApi;
