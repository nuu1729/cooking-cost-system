import apiClient from '../client';
import { ApiResponse } from '../../types';

export const reportApi = {
    // ダッシュボード統計
    getDashboard: async (): Promise<ApiResponse<any>> => {
        const response = await apiClient.get('/reports/dashboard');
        return response.data;
    },
    
    // ジャンル統計
    getGenreStats: async (): Promise<ApiResponse<any>> => {
        const response = await apiClient.get('/reports/genre-stats');
        return response.data;
    },
    
    // コスト推移
    getCostTrends: async (days?: number): Promise<ApiResponse<any>> => {
        const response = await apiClient.get('/reports/cost-trends', {
        params: { days }
        });
        return response.data;
    },
    
    // 人気アイテム
    getPopularItems: async (): Promise<ApiResponse<any>> => {
        const response = await apiClient.get('/reports/popular-items');
        return response.data;
    },
    
    // レポートエクスポート
    exportData: async (type: string, format: string = 'json'): Promise<any> => {
        const response = await apiClient.get('/reports/export', {
        params: { type, format }
        });
        return response.data;
    },
};

export default reportApi;
