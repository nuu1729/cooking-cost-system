import axios, { AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';

// APIベースURL設定
const API_BASE_URL = import.meta.env.VITE_ENABLE_MOCK === 'true' 
    ? '/api' // Mock有効時は相対パスにしつつ /api サフィックスをつける
    : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');

// Axiosインスタンス作成
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

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

const SENSITIVE_KEYS = ['password', 'currentPassword', 'newPassword', 'token'];

function sanitizeForLog(data: unknown): unknown {
    if (!data || typeof data !== 'object') return data;
    return Object.fromEntries(
        Object.entries(data as Record<string, unknown>).map(([k, v]) =>
            SENSITIVE_KEYS.some(f => k.toLowerCase().includes(f.toLowerCase()))
                ? [k, '[MASKED]']
                : [k, v]
        )
    );
}

// リクエストインターセプター
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (import.meta.env.DEV) {
            console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, sanitizeForLog(config.data));
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
        if (import.meta.env.DEV) {
            console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        }
        return response;
    },
    (error: AxiosError) => {
        const errorMessage = getErrorMessage(error);
        
        console.error('API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            message: errorMessage,
            data: error.response?.data,
        });
        
        const url = error.config?.url ?? '';
        // login/register はページ側でエラーを処理するため除外
        // auth/me・auth/status はApp起動時のセッション復元呼び出しのため除外（App.tsx の catch で処理）
        const isLoginOrRegister = url.includes('auth/login') || url.includes('auth/register');
        const isSessionCheck = url.includes('auth/me') || url.includes('auth/status');

        if (error.response?.status === 401 && !isLoginOrRegister && !isSessionCheck) {
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            return Promise.reject(error);
        }

        const isConflict = error.response?.status === 409;
        if (!isLoginOrRegister && !isSessionCheck && !isConflict) {
            toast.error(errorMessage);
        }
        
        return Promise.reject(error);
    }
);

export default apiClient;
