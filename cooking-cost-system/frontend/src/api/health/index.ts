import apiClient from '../client';

export const healthApi = {
    check: async (): Promise<any> => {
        const response = await apiClient.get('/health', { 
            timeout: 5000,
            baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '') 
        });
        return response.data;
    },
};

export default healthApi;
