import apiClient from '../client';
import { ApiResponse } from '../../types';

export const uploadApi = {
    // 単一ファイルアップロード
    uploadSingle: async (file: File): Promise<ApiResponse<any>> => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await apiClient.post('/upload/single', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    
    // 複数ファイルアップロード
    uploadMultiple: async (files: File[]): Promise<ApiResponse<any[]>> => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        
        const response = await apiClient.post('/upload/multiple', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    
    // ファイル一覧取得
    getFileList: async (): Promise<ApiResponse<any[]>> => {
        const response = await apiClient.get('/upload/list');
        return response.data;
    },
    
    // ファイル削除
    deleteFile: async (filename: string): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`/upload/${filename}`);
        return response.data;
    },
};

export default uploadApi;
