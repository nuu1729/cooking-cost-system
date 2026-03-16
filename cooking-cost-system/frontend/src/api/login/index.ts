import apiClient from '../client';
import { ApiResponse, LoginRequest, LoginResponse } from '../../types';

export const authApi = {
    // ログイン
    login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
        const response = await apiClient.post('auth/login', credentials);
        return response.data;
    },
    
    // ログアウト
    logout: async (): Promise<ApiResponse<void>> => {
        const response = await apiClient.post('auth/logout');
        return response.data;
    },
};

export default authApi;
