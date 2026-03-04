import axios, { AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { 
    Ingredient, 
    CreateIngredientRequest, 
    UpdateIngredientRequest,
    Dish,
    CreateDishRequest,
    CompletedFood,
    CreateCompletedFoodRequest,
    ApiResponse,
    LoginRequest,
    RegisterRequest,
    LoginResponse,
    User,
    CreatePrepRequest
} from '../types';

// APIベースURL設定
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Axiosインスタンス作成
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// リクエストインターセプター
apiClient.interceptors.request.use(
    (config) => {
        // 認証トークンがある場合は追加
        const token = localStorage.getItem('authToken');
        if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        }
        
        // リクエストログ（開発環境のみ）
        if (import.meta.env.DEV) {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
        }
        
        return config;
    },
    (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

// レスポンスインターセプター
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // レスポンスログ（開発環境のみ）
        if (import.meta.env.DEV) {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        }
        
        return response;
    },
    (error: AxiosError) => {
        // エラーハンドリング
        const errorMessage = getErrorMessage(error);
        
        console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: errorMessage,
        data: error.response?.data,
        });
        
        // 認証エラーの場合はログアウト処理
        if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return Promise.reject(error);
        }
        
        // ユーザーフレンドリーなエラーメッセージを表示
        if (!error.config?.url?.includes('/auth/')) {
        toast.error(errorMessage);
        }
        
        return Promise.reject(error);
    }
);

// エラーメッセージ取得
const getErrorMessage = (error: AxiosError): string => {
    if (error.response?.data) {
        const data = error.response.data as any;
        return data.message || data.error || 'API エラーが発生しました';
    }
    
    if (error.request) {
        return 'サーバーに接続できませんでした';
    }
    
    return error.message || '不明なエラーが発生しました';
};


// 食材API
export const ingredientApi = {
    // 食材一覧取得
    getAll: async (params?: {
        name?: string;
        store?: string;
        genre?: string;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
        limit?: number;
        offset?: number;
    }): Promise<ApiResponse<Ingredient[]>> => {
        const response = await apiClient.get('/ingredients', { params });
        return response.data;
    },
    
    // 食材詳細取得
    getById: async (id: number): Promise<ApiResponse<Ingredient>> => {
        const response = await apiClient.get(`/ingredients/${id}`);
        return response.data;
    },
    
    // 食材作成
    create: async (data: CreateIngredientRequest): Promise<ApiResponse<Ingredient>> => {
        const response = await apiClient.post('/ingredients', data);
        return response.data;
    },
    
    // 食材更新
    update: async (id: number, data: UpdateIngredientRequest): Promise<ApiResponse<Ingredient>> => {
        const response = await apiClient.put(`/ingredients/${id}`, data);
        return response.data;
    },
    
    // 食材削除
    delete: async (id: number): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`/ingredients/${id}`);
        return response.data;
    },
    
    // ジャンル別統計
    getGenreStats: async (): Promise<ApiResponse<any[]>> => {
        const response = await apiClient.get('/ingredients/stats/genre');
        return response.data;
    },
    
    // 人気食材
    getPopular: async (limit?: number): Promise<ApiResponse<any[]>> => {
        const response = await apiClient.get('/ingredients/popular', { 
        params: { limit } 
        });
        return response.data;
    },
};

// 料理API
export const dishApi = {
    // 料理一覧取得
    getAll: async (params?: {
        name?: string;
        genre?: string;
        minCost?: number;
        maxCost?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
        limit?: number;
        offset?: number;
    }): Promise<ApiResponse<Dish[]>> => {
        const response = await apiClient.get('/dishes', { params });
        return response.data;
    },
    
    // 料理詳細取得（食材付き）
    getById: async (id: number): Promise<ApiResponse<Dish>> => {
        const response = await apiClient.get(`/dishes/${id}`);
        return response.data;
    },
    
    // 料理作成
    create: async (data: CreateDishRequest): Promise<ApiResponse<Dish>> => {
        const response = await apiClient.post('/dishes', data);
        return response.data;
    },
    
    // 料理更新
    update: async (id: number, data: Partial<CreateDishRequest>): Promise<ApiResponse<Dish>> => {
        const response = await apiClient.put(`/dishes/${id}`, data);
        return response.data;
    },
    
    // 料理削除
    delete: async (id: number): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`/dishes/${id}`);
        return response.data;
    },
    
    // ジャンル別統計
    getGenreStats: async (): Promise<ApiResponse<any[]>> => {
        const response = await apiClient.get('/dishes/stats/genre');
        return response.data;
    },
};

// 完成品API
export const completedFoodApi = {
    // 完成品一覧取得
    getAll: async (params?: {
        name?: string;
        minPrice?: number;
        maxPrice?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
        limit?: number;
        offset?: number;
    }): Promise<ApiResponse<CompletedFood[]>> => {
        const response = await apiClient.get('/foods', { params });
        return response.data;
    },
    
    // 完成品詳細取得
    getById: async (id: number): Promise<ApiResponse<CompletedFood>> => {
        const response = await apiClient.get(`/foods/${id}`);
        return response.data;
    },
    
    // 完成品作成
    create: async (data: CreateCompletedFoodRequest): Promise<ApiResponse<CompletedFood>> => {
        const response = await apiClient.post('/foods', data);
        return response.data;
    },
    
    // 完成品更新
    update: async (id: number, data: Partial<CreateCompletedFoodRequest>): Promise<ApiResponse<CompletedFood>> => {
        const response = await apiClient.put(`/foods/${id}`, data);
        return response.data;
    },
    
    // 完成品削除
    delete: async (id: number): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`/foods/${id}`);
        return response.data;
    },
    
    // 利益率順取得
    getProfitableItems: async (limit?: number): Promise<ApiResponse<any[]>> => {
        const response = await apiClient.get('/foods/stats/profit', { 
        params: { limit } 
        });
        return response.data;
    },
};

// レポートAPI
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

// メモAPI
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

// アップロードAPI
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

// 認証API
export const authApi = {
    // 認証状態チェック
    getAuthStatus: async (): Promise<ApiResponse<{ authEnabled: boolean }>> => {
        const response = await apiClient.get('auth/status');
        return response.data;
    },

    // ログイン
    login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
        const response = await apiClient.post('auth/login', credentials);
        return response.data;
    },
    
    // ユーザー登録
    register: async (userData: RegisterRequest): Promise<ApiResponse<User>> => {
        const response = await apiClient.post('auth/register', userData);
        return response.data;
    },
    
    // ログアウト
    logout: async (): Promise<ApiResponse<void>> => {
        const response = await apiClient.post('auth/logout');
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

// 仕込みAPI
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
        const response = await apiClient.post('/preps', data);
        return response.data;
    },
    
    // 商品検索（サジェスト用）
    searchIngredients: async (query: string): Promise<ApiResponse<Ingredient[]>> => {
        const response = await apiClient.get('/ingredients/search', {
            params: { q: query }
        });
        return response.data;
    },

    // 仕込み削除
    delete: async (id: number): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`/preps/${id}`);
        return response.data;
    },
};

// ヘルスチェック
export const healthApi = {
    check: async (): Promise<any> => {
        const response = await apiClient.get('/health', { 
        timeout: 5000,
        baseURL: API_BASE_URL.replace('/api', '') 
        });
        return response.data;
    },
};

// APIクライアントのエクスポート（他のモジュールで使用する場合）
export { apiClient as api };

export default apiClient;
