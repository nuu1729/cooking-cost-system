import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { healthApi } from '../services/api';

// 状態の型定義
interface AppState {
    isLoading: boolean;
    error: string | null;
    user: any | null;
    settings: {
        theme: 'light' | 'dark';
        language: 'ja' | 'en';
        currency: string;
        autoSave: boolean;
        notifications: boolean;
    };
    connectionStatus: 'online' | 'offline' | 'checking';
}

// アクションの型定義
type AppAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_USER'; payload: any }
    | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState['settings']> }
    | { type: 'SET_CONNECTION_STATUS'; payload: 'online' | 'offline' | 'checking' };

// 初期状態
const initialState: AppState = {
    isLoading: false,
    error: null,
    user: null,
    settings: {
        theme: 'light',
        language: 'ja',
        currency: '¥',
        autoSave: true,
        notifications: true,
    },
    connectionStatus: 'checking',
};

// リデューサー
const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'SET_LOADING':
        return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
        return { ...state, error: action.payload };
        case 'SET_USER':
        return { ...state, user: action.payload };
        case 'UPDATE_SETTINGS':
        return { 
            ...state, 
            settings: { ...state.settings, ...action.payload } 
        };
        case 'SET_CONNECTION_STATUS':
        return { ...state, connectionStatus: action.payload };
        default:
        return state;
    }
};

// コンテキスト作成
const AppContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
    actions: {
        setLoading: (loading: boolean) => void;
        setError: (error: string | null) => void;
        setUser: (user: any) => void;
        updateSettings: (settings: Partial<AppState['settings']>) => void;
        setConnectionStatus: (status: 'online' | 'offline' | 'checking') => void;
    };
    } | null>(null);

    // プロバイダーコンポーネント
    export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // ヘルスチェック
    const { refetch: checkHealth } = useQuery({
        queryKey: ['health'],
        queryFn: healthApi.check,
        enabled: false,
        retry: false,
        onSuccess: () => {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'online' });
        dispatch({ type: 'SET_ERROR', payload: null });
        },
        onError: () => {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'offline' });
        dispatch({ type: 'SET_ERROR', payload: 'サーバーに接続できません' });
        },
    });

    // 接続状態監視
    useEffect(() => {
        // 初回チェック
        checkHealth();

        // 定期的なヘルスチェック
        const healthCheckInterval = setInterval(() => {
        if (navigator.onLine) {
            checkHealth();
        } else {
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'offline' });
        }
        }, 30000); // 30秒ごと

        // オンライン/オフライン状態監視
        const handleOnline = () => {
        checkHealth();
        };

        const handleOffline = () => {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'offline' });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
        clearInterval(healthCheckInterval);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        };
    }, [checkHealth]);

    // ローカルストレージから設定読み込み
    useEffect(() => {
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
        } catch (error) {
            console.error('設定の読み込みに失敗しました:', error);
        }
        }
    }, []);

    // 設定変更時にローカルストレージに保存
    useEffect(() => {
        localStorage.setItem('appSettings', JSON.stringify(state.settings));
    }, [state.settings]);

    // アクション関数
    const actions = {
        setLoading: (loading: boolean) => {
        dispatch({ type: 'SET_LOADING', payload: loading });
        },
        setError: (error: string | null) => {
        dispatch({ type: 'SET_ERROR', payload: error });
        },
        setUser: (user: any) => {
        dispatch({ type: 'SET_USER', payload: user });
        },
        updateSettings: (settings: Partial<AppState['settings']>) => {
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
        },
        setConnectionStatus: (status: 'online' | 'offline' | 'checking') => {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: status });
        },
    };

    return (
        <AppContext.Provider value={{ state, dispatch, actions }}>
        {children}
        </AppContext.Provider>
    );
};

// カスタムフック
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppContextProvider');
    }
    return context;
};

// 個別フック
export const useAppState = () => {
    const { state } = useAppContext();
    return state;
};

export const useAppActions = () => {
    const { actions } = useAppContext();
    return actions;
};

export const useAppSettings = () => {
    const { state, actions } = useAppContext();
    return {
        settings: state.settings,
        updateSettings: actions.updateSettings,
    };
};

export const useConnectionStatus = () => {
    const { state } = useAppContext();
    return state.connectionStatus;
};

export default AppContext;