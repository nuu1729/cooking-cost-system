import apiClient from '../client';
import { ApiResponse, User } from '../../types';

export const userApi = {
    // 認証状態チェック
    getAuthStatus: async (): Promise<ApiResponse<{ authEnabled: boolean }>> => {
        const response = await apiClient.get('auth/status');
        return response.data;
    },

    // 現在のユーザー情報取得
    getCurrentUser: async (): Promise<ApiResponse<User>> => {
        const response = await apiClient.get('auth/me');
        return response.data;
    },

    // トークンリフレッシュ
    refreshToken: async (): Promise<ApiResponse<{ token: string }>> => {
        const response = await apiClient.post('auth/refresh');
        return response.data;
    },

    // パスワード更新
    updatePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
        const response = await apiClient.put('auth/password', {
            currentPassword,
            newPassword,
        });
        return response.data;
    },
};

export default userApi;
