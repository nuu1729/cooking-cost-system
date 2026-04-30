import apiClient from '../client';
import { ApiResponse, LoginRequest, LoginResponse } from '../../types';

export interface UserProfile {
    id: number;
    username: string;
    email: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const authApi = {
    login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
        const response = await apiClient.post('auth/login', credentials);
        return response.data;
    },

    me: async (): Promise<ApiResponse<UserProfile>> => {
        const response = await apiClient.get('auth/me');
        return response.data;
    },

    updateProfile: async (data: { username?: string; email?: string }): Promise<ApiResponse<UserProfile>> => {
        const response = await apiClient.put('auth/profile', data);
        return response.data;
    },

    uploadIcon: async (file: File): Promise<ApiResponse<{ icon_url: string }>> => {
        const form = new FormData();
        form.append('file', file);
        const response = await apiClient.post('auth/upload-icon', form, {
            headers: { 'Content-Type': undefined },
        });
        return response.data;
    },

    uploadHomeBg: async (file: File): Promise<ApiResponse<{ home_bg_url: string }>> => {
        const form = new FormData();
        form.append('file', file);
        const response = await apiClient.post('auth/upload-home-bg', form, {
            headers: { 'Content-Type': undefined },
        });
        return response.data;
    },

    deleteIcon: async (): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete('auth/upload-icon');
        return response.data;
    },

    deleteHomeBg: async (): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete('auth/upload-home-bg');
        return response.data;
    },

    logout: async (): Promise<ApiResponse<void>> => {
        const response = await apiClient.post('auth/logout');
        return response.data;
    },
};

export default authApi;
