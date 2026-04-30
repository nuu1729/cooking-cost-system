import apiClient from '../client';
import { ApiResponse, CreatePrepRequest } from '../../types';

export const prepApi = {
    // 仕込み一覧取得
    getAll: async (params?: { name?: string }): Promise<ApiResponse<any[]>> => {
        const response = await apiClient.get('/preps', { params });
        return response.data;
    },

    // 仕込み詳細取得
    getById: async (id: number): Promise<ApiResponse<any>> => {
        const response = await apiClient.get(`/preps/${id}`);
        return response.data;
    },

    // 仕込み名重複チェック
    checkName: async (name: string): Promise<ApiResponse<{ exists: boolean }>> => {
        const response = await apiClient.get('/preps/check-name', {
            params: { name }
        });
        return response.data;
    },

    // 仕込み作成
    create: async (data: CreatePrepRequest): Promise<ApiResponse<any>> => {
        // バックエンドの期待するフィールド名に変換:
        //   prep_name  → name
        //   yield_amount → quantity
        //   yield_unit   → unit
        const payload = {
            name: data.prep_name,
            quantity: data.yield_amount,
            unit: data.yield_unit,
            total_cost: data.total_cost,
            items: data.items,
        };
        const response = await apiClient.post('/preps', payload);
        return response.data;
    },

    // 仕込み削除
    delete: async (id: number): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`/preps/${id}`);
        return response.data;
    },

    // 商品検索（サジェスト用）
    searchIngredients: async (query: string): Promise<ApiResponse<any[]>> => {
        const response = await apiClient.get('/ingredients/search', {
            params: { q: query }
        });
        return response.data;
    },
};

export default prepApi;
