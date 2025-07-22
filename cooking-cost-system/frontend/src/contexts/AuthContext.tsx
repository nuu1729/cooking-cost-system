import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
    User, 
    LoginRequest, 
    RegisterRequest, 
    LoginResponse, 
    ApiResponse 
} from '../types';
import { authApi } from '../services/api';
import { useToast } from './AppContext';

// 認証状態の型定義
interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    token: string | null;
    authEnabled: boolean;
}

// アクションタイプ
type AuthAction =
    | { type: 'AUTH_START' }
    | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
    | { type: 'AUTH_FAILURE'; payload: string }
    | { type: 'LOGOUT' }
    | { type: 'CLEAR_ERROR' }
    | { type: 'UPDATE_USER'; payload: User }
    | { type: 'SET_AUTH_ENABLED'; payload: boolean }
    | { type: 'TOKEN_REFRESH'; payload: string };

// 初期状態
const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    token: null,
    authEnabled: false,
};

// リデューサー
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'AUTH_START':
        return {
            ...state,
            isLoading: true,
            error: null,
        };
        
        case 'AUTH_SUCCESS':
        return {
            ...state,
            user: action.payload.user,
            token: action.payload.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
        };
        
        case 'AUTH_FAILURE':
        return {
            ...state,
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: action.payload,
        };
        
        case 'LOGOUT':
        return {
            ...state,
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
        };
        
        case 'CLEAR_ERROR':
        return {
            ...state,
            error: null,
        };
        
        case 'UPDATE_USER':
        return {
            ...state,
            user: action.payload,
        };
        
        case 'SET_AUTH_ENABLED':
        return {
            ...state,
            authEnabled: action.payload,
        };
        
        case 'TOKEN_REFRESH':
        return {
            ...state,
            token: action.payload,
        };
        
        default:
        return state;
    }
};

// コンテキストの型定義
interface AuthContextType {
    state: AuthState;
    dispatch: React.Dispatch<AuthAction>;
    
    // 認証関数
    login: (credentials: LoginRequest) => Promise<boolean>;
    register: (userData: RegisterRequest) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<boolean>;
    checkAuthStatus: () => Promise<void>;
    updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
    
    // 便利なゲッター
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    authEnabled: boolean;
}

// コンテキスト作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// プロバイダーコンポーネント
interface AuthContextProviderProps {
    children: ReactNode;
}

export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);
    const { addToast } = useToast();

    // トークン管理
    const getStoredToken = (): string | null => {
        return localStorage.getItem('token');
    };

    const setStoredToken = (token: string): void => {
        localStorage.setItem('token', token);
    };

    const removeStoredToken = (): void => {
        localStorage.removeItem('token');
    };

    // 認証状態の確認
    const checkAuthStatus = async (): Promise<void> => {
        try {
        const response = await authApi.getAuthStatus();
        dispatch({ type: 'SET_AUTH_ENABLED', payload: response.data.authEnabled });

        if (!response.data.authEnabled) {
            // 認証が無効の場合はダミーユーザーを設定
            dispatch({ 
            type: 'AUTH_SUCCESS', 
            payload: { 
                user: {
                id: 1,
                username: 'admin',
                email: 'admin@example.com',
                role: 'admin',
                is_active: true,
                },
                token: 'dummy-token'
            } 
            });
            return;
        }

        const token = getStoredToken();
        if (token) {
            try {
            const userResponse = await authApi.getCurrentUser();
            dispatch({ 
                type: 'AUTH_SUCCESS', 
                payload: { 
                user: userResponse.data, 
                token 
                } 
            });
            } catch (error) {
            // トークンが無効な場合は削除
            removeStoredToken();
            dispatch({ type: 'LOGOUT' });
            }
        }
        } catch (error) {
        console.error('Auth status check failed:', error);
        dispatch({ type: 'SET_AUTH_ENABLED', payload: false });
        }
    };

    // ログイン
    const login = async (credentials: LoginRequest): Promise<boolean> => {
        dispatch({ type: 'AUTH_START' });
        
        try {
        const response = await authApi.login(credentials);
        const { user, token } = response.data;
        
        setStoredToken(token);
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
        
        addToast({ type: 'success', message: 'ログインに成功しました' });
        return true;
        } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'ログインに失敗しました';
        dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
        addToast({ type: 'error', message: errorMessage });
        return false;
        }
    };

    // ユーザー登録
    const register = async (userData: RegisterRequest): Promise<boolean> => {
        dispatch({ type: 'AUTH_START' });
        
        try {
        const response = await authApi.register(userData);
        
        addToast({ 
            type: 'success', 
            message: 'ユーザー登録が完了しました。ログインしてください。' 
        });
        
        dispatch({ type: 'CLEAR_ERROR' });
        return true;
        } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'ユーザー登録に失敗しました';
        dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
        addToast({ type: 'error', message: errorMessage });
        return false;
        }
    };

    // ログアウト
    const logout = async (): Promise<void> => {
        try {
        if (state.authEnabled) {
            await authApi.logout();
        }
        } catch (error) {
        console.error('Logout API call failed:', error);
        } finally {
        removeStoredToken();
        dispatch({ type: 'LOGOUT' });
        addToast({ type: 'info', message: 'ログアウトしました' });
        }
    };

    // トークンリフレッシュ
    const refreshToken = async (): Promise<boolean> => {
        try {
        const response = await authApi.refreshToken();
        const { token } = response.data;
        
        setStoredToken(token);
        dispatch({ type: 'TOKEN_REFRESH', payload: token });
        
        return true;
        } catch (error) {
        console.error('Token refresh failed:', error);
        removeStoredToken();
        dispatch({ type: 'LOGOUT' });
        return false;
        }
    };

    // パスワード更新
    const updatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
        try {
        await authApi.updatePassword(currentPassword, newPassword);
        addToast({ type: 'success', message: 'パスワードが更新されました' });
        return true;
        } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'パスワード更新に失敗しました';
        addToast({ type: 'error', message: errorMessage });
        return false;
        }
    };

    // 初期化時の認証状態確認
    useEffect(() => {
        checkAuthStatus();
    }, []);

    // トークン自動リフレッシュ
    useEffect(() => {
        if (!state.authEnabled || !state.isAuthenticated || !state.token) return;

        const interval = setInterval(async () => {
        try {
            await refreshToken();
        } catch (error) {
            console.error('Auto token refresh failed:', error);
        }
        }, 6 * 60 * 60 * 1000); // 6時間ごと

        return () => clearInterval(interval);
    }, [state.authEnabled, state.isAuthenticated, state.token]);

    // Axiosインターセプターの設定
    useEffect(() => {
        const { api } = require('../services/api');
        
        // リクエストインターセプター
        const requestInterceptor = api.interceptors.request.use(
        (config: any) => {
            const token = getStoredToken();
            if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error: any) => Promise.reject(error)
        );

        // レスポンスインターセプター
        const responseInterceptor = api.interceptors.response.use(
        (response: any) => response,
        async (error: any) => {
            const originalRequest = error.config;
            
            if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const success = await refreshToken();
                if (success) {
                const newToken = getStoredToken();
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                logout();
            }
            }
            
            return Promise.reject(error);
        }
        );

        return () => {
        api.interceptors.request.eject(requestInterceptor);
        api.interceptors.response.eject(responseInterceptor);
        };
    }, []);

    // コンテキスト値
    const contextValue: AuthContextType = {
        state,
        dispatch,
        login,
        register,
        logout,
        refreshToken,
        checkAuthStatus,
        updatePassword,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        error: state.error,
        authEnabled: state.authEnabled,
    };

    return (
        <AuthContext.Provider value={contextValue}>
        {children}
        </AuthContext.Provider>
    );
};

// カスタムフック
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthContextProvider');
    }
    return context;
};

// 便利なカスタムフック
export const useUser = () => {
    const { user, isAuthenticated } = useAuth();
    return {
        user,
        isAuthenticated,
        isAdmin: user?.role === 'admin',
        isUser: user?.role === 'user',
    };
};

export const useAuthActions = () => {
    const { login, register, logout, updatePassword } = useAuth();
    return {
        login,
        register,
        logout,
        updatePassword,
    };
};

export default AuthContext;