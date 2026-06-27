import apiClient from '../client';
import { ApiResponse, RegisterRequest, User } from '../../types';

export const signinApi = {
    // ユーザー登録
    register: async (userData: RegisterRequest): Promise<ApiResponse<User>> => {
        const response = await apiClient.post('auth/register', userData);
        return response.data;
    },
};

export default signinApi;
