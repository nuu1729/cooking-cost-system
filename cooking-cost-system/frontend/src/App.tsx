// cooking-cost-system/frontend/src/services/api.ts
import axios, { AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';

import type {
    Ingredient,
    CreateIngredientRequest,
    UpdateIngredientRequest,
    IngredientSearchParams,
    Dish,
    CreateDishRequest,
    UpdateDishRequest,
    DishSearchParams,
    CompletedFood,
    CreateCompletedFoodRequest,
    UpdateCompletedFoodRequest,
    CompletedFoodSearchParams,
    Memo,
    CreateMemoRequest,
    UpdateMemoRequest,
    ReportData,
    ApiResponse,
    PaginatedResponse,
} from '../types';

// Axios インスタンス作成
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// リクエストインターセプター
api.interceptors.request.use(
    (config) => {
        // 認証トークンがあれば追加
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // リクエストID付与（デバッグ用）
        config.headers['X-Request-ID'] = Math.random().toString(36).substring(2);
        
        console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data,
        });
        
        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// レスポンスインターセプター
api.interceptors.response.use(
    (response: AxiosResponse) => {
        console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data,
        });
        return response;
    },
    (error: AxiosError) => {
        const { response, request, config } = error;
        
        console.error(`❌ ${config?.method?.toUpperCase()} ${config?.url}`, {
            status: response?.status,
            data: response?.data,
            message: error.message,
        });
        
        // エラーハンドリング
        if (response) {
            // サーバーエラーレスポンス
            const errorData = response.data as any;
            const message = errorData?.message || 'サーバーエラーが発生しました';
            
            switch (response.status) {
                case 400:
                    toast.error(`入力エラー: ${message}`);
                    break;
                case 401:
                    toast.error('認証が必要です');
                    // 認証トークンをクリア
                    localStorage.removeItem('authToken');
                    // ログインページにリダイレクト
                    window.location.href = '/login';
                    break;
                case 403:
                    toast.error('アクセス権限がありません');
                    break;
                case 404:
                    toast.error('リソースが見つかりません');
                    break;
                case 409:
                    toast.error(`データ競合: ${message}`);
                    break;
                case 429:
                    toast.error('リクエストが多すぎます。しばらく待ってから再試行してください');
                    break;
                case 500:
                    toast.error('サーバー内部エラーが発生しました');
                    break;
                case 503:
                    toast.error('サービスが一時的に利用できません');
                    break;
                default:
                    toast.error(`エラー: ${message}`);
            }
        } else if (request) {
            // ネットワークエラー
            toast.error('ネットワークエラーが発生しました。接続を確認してください');
        } else {
            // その他のエラー
            toast.error('予期しないエラーが発生しました');
        }
        
        return Promise.reject(error);
    }
);

// 汎用APIクライアント
class ApiClient {
    async get<T>(url: string, params?: any): Promise<T> {
        const response = await api.get(url, { params });
        return response.data;
    }
    
    async post<T>(url: string, data?: any): Promise<T> {
        const response = await api.post(url, data);
        return response.data;
    }
    
    async put<T>(url: string, data?: any): Promise<T> {
        const response = await api.put(url, data);
        return response.data;
    }
    
    async delete<T>(url: string): Promise<T> {
        const response = await api.delete(url);
        return response.data;
    }
}

const apiClient = new ApiClient();

// 食材API
export const ingredientApi = {
    // 一覧取得
    getAll: (params?: IngredientSearchParams): Promise<PaginatedResponse<Ingredient>> =>
        apiClient.get('/ingredients', params),
    
    // 詳細取得
    getById: (id: number): Promise<ApiResponse<Ingredient>> =>
        apiClient.get(`/ingredients/${id}`),
    
    // 作成
    create: (data: CreateIngredientRequest): Promise<ApiResponse<Ingredient>> =>
        apiClient.post('/ingredients', data),
    
    // 更新
    update: (id: number, data: UpdateIngredientRequest): Promise<ApiResponse<Ingredient>> =>
        apiClient.put(`/ingredients/${id}`, data),
    
    // 削除
    delete: (id: number): Promise<ApiResponse<void>> =>
        apiClient.delete(`/ingredients/${id}`),
    
    // 統計情報取得
    getStats: (): Promise<ApiResponse<any>> =>
        apiClient.get('/ingredients/stats/summary'),
};

// 料理API
export const dishApi = {
    // 一覧取得
    getAll: (params?: DishSearchParams): Promise<PaginatedResponse<Dish>> =>
        apiClient.get('/dishes', params),
    
    // 詳細取得
    getById: (id: number): Promise<ApiResponse<Dish>> =>
        apiClient.get(`/dishes/${id}`),
    
    // 作成
    create: (data: CreateDishRequest): Promise<ApiResponse<Dish>> =>
        apiClient.post('/dishes', data),
    
    // 更新
    update: (id: number, data: UpdateDishRequest): Promise<ApiResponse<Dish>> =>
        apiClient.put(`/dishes/${id}`, data),
    
    // 削除
    delete: (id: number): Promise<ApiResponse<void>> =>
        apiClient.delete(`/dishes/${id}`),
    
    // 統計情報取得
    getStats: (): Promise<ApiResponse<any>> =>
        apiClient.get('/dishes/stats/summary'),
};

// 完成品API
export const completedFoodApi = {
    // 一覧取得
    getAll: (params?: CompletedFoodSearchParams): Promise<PaginatedResponse<CompletedFood>> =>
        apiClient.get('/foods', params),
    
    // 詳細取得
    getById: (id: number): Promise<ApiResponse<CompletedFood>> =>
        apiClient.get(`/foods/${id}`),
    
    // 作成
    create: (data: CreateCompletedFoodRequest): Promise<ApiResponse<CompletedFood>> =>
        apiClient.post('/foods', data),
    
    // 更新
    update: (id: number, data: UpdateCompletedFoodRequest): Promise<ApiResponse<CompletedFood>> =>
        apiClient.put(`/foods/${id}`, data),
    
    // 削除
    delete: (id: number): Promise<ApiResponse<void>> =>
        apiClient.delete(`/foods/${id}`),
    
    // 統計情報取得
    getStats: (): Promise<ApiResponse<any>> =>
        apiClient.get('/foods/stats/summary'),
};

// メモAPI
export const memoApi = {
    // 取得
    get: (): Promise<ApiResponse<Memo>> =>
        apiClient.get('/memo'),
    
    // 更新
    update: (data: CreateMemoRequest): Promise<ApiResponse<Memo>> =>
        apiClient.put('/memo', data),
};

// レポートAPI
export const reportApi = {
    // 統合レポート取得
    getReport: (): Promise<ApiResponse<ReportData>> =>
        apiClient.get('/reports'),
    
    // ジャンル別統計
    getGenreStats: (): Promise<ApiResponse<any>> =>
        apiClient.get('/reports/genre-stats'),
    
    // 人気食材
    getPopularIngredients: (): Promise<ApiResponse<any>> =>
        apiClient.get('/reports/popular-ingredients'),
    
    // コストトレンド
    getCostTrends: (): Promise<ApiResponse<any>> =>
        apiClient.get('/reports/cost-trends'),
    
    // データエクスポート
    exportData: (format: 'csv' | 'xlsx' | 'json'): Promise<Blob> =>
        api.get(`/reports/export?format=${format}`, {
            responseType: 'blob',
        }).then(response => response.data),
};

// ファイルアップロードAPI
export const uploadApi = {
    // 画像アップロード
    uploadImage: (file: File): Promise<ApiResponse<any>> => {
        const formData = new FormData();
        formData.append('image', file);
        
        return api.post('/upload/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }).then(response => response.data);
    },
    
    // CSVインポート
    importCsv: (file: File, type: 'ingredients' | 'dishes'): Promise<ApiResponse<any>> => {
        const formData = new FormData();
        formData.append('csv', file);
        formData.append('type', type);
        
        return api.post('/upload/csv', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }).then(response => response.data);
    },
};

// システムAPI
export const systemApi = {
    // ヘルスチェック
    health: (): Promise<any> =>
        apiClient.get('/health'),
    
    // システム情報
    info: (): Promise<any> =>
        apiClient.get('/'),
};

// ユーティリティ関数
export const createApiUrl = (path: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    return `${baseUrl}${path}`;
};

export const handleApiError = (error: any, customMessage?: string) => {
    console.error('API Error:', error);
    
    if (customMessage) {
        toast.error(customMessage);
    } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
    } else {
        toast.error('予期しないエラーが発生しました');
    }
};

// デバッグ用
export const enableDebugMode = () => {
    if (process.env.NODE_ENV === 'development') {
        (window as any).apiClient = apiClient;
        (window as any).ingredientApi = ingredientApi;
        (window as any).dishApi = dishApi;
        (window as any).completedFoodApi = completedFoodApi;
        (window as any).memoApi = memoApi;
        (window as any).reportApi = reportApi;
        (window as any).uploadApi = uploadApi;
        (window as any).systemApi = systemApi;
        
        console.log('🔧 Debug mode enabled. API clients available on window object.');
    }
};

// 初期化
if (process.env.NODE_ENV === 'development') {
    enableDebugMode();
}

export default api;