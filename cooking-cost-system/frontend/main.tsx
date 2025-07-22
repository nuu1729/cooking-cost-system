import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { HelmetProvider } from 'react-helmet-async';
import { ErrorBoundary } from 'react-error-boundary';

import App from './App';
import { theme } from './theme';
import { AppContextProvider } from './contexts/AppContext';
import { AuthContextProvider } from './contexts/AuthContext';
import ErrorFallback from './components/common/ErrorFallback';

import './index.css';

// React Query クライアント設定
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
        retry: (failureCount, error: any) => {
            // 認証エラーの場合はリトライしない
            if (error?.response?.status === 401) return false;
            // その他は最大2回リトライ
            return failureCount < 2;
        },
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
        staleTime: 5 * 60 * 1000, // 5分
        cacheTime: 10 * 60 * 1000, // 10分
        },
        mutations: {
        retry: (failureCount, error: any) => {
            // 4xx エラーはリトライしない
            if (error?.response?.status >= 400 && error?.response?.status < 500) {
            return false;
            }
            // 5xx エラーは1回だけリトライ
            return failureCount < 1;
        },
        },
    },
});

// エラーハンドリング
const onError = (error: Error, errorInfo: any) => {
    console.error('アプリケーションエラー:', error, errorInfo);
    
    // 本番環境では外部エラー監視サービスに送信
    if (import.meta.env.PROD) {
        // Sentry, LogRocket, etc.
        // trackError(error, errorInfo);
    }
};

// パフォーマンス監視
if (import.meta.env.PROD) {
    // Web Vitals の測定
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log);
        getFID(console.log);
        getFCP(console.log);
        getLCP(console.log);
        getTTFB(console.log);
    });
}

// PWA更新通知
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
            console.log('SW registered: ', registration);
        },
        (registrationError) => {
            console.log('SW registration failed: ', registrationError);
        }
        );
    });
}

// メインアプリケーション
const AppWithProviders: React.FC = () => {
    return (
        <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onError={onError}
        onReset={() => window.location.reload()}
        >
        <HelmetProvider>
            <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <BrowserRouter>
                <DndProvider backend={HTML5Backend}>
                    <AuthContextProvider>
                    <AppContextProvider>
                        <App />
                        {/* Toast通知 */}
                        <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                            background: '#333',
                            color: '#fff',
                            },
                            success: {
                            duration: 3000,
                            iconTheme: {
                                primary: '#4caf50',
                                secondary: '#fff',
                            },
                            },
                            error: {
                            duration: 5000,
                            iconTheme: {
                                primary: '#f44336',
                                secondary: '#fff',
                            },
                            },
                        }}
                        />
                        {/* React Query DevTools (開発環境のみ) */}
                        {import.meta.env.DEV && (
                        <ReactQueryDevtools
                            initialIsOpen={false}
                            position="bottom-right"
                        />
                        )}
                    </AppContextProvider>
                    </AuthContextProvider>
                </DndProvider>
                </BrowserRouter>
            </ThemeProvider>
            </QueryClientProvider>
        </HelmetProvider>
        </ErrorBoundary>
    );
};

// React 18 Concurrent Features対応
const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(<AppWithProviders />);

// 開発環境での追加設定
if (import.meta.env.DEV) {
    // React DevTools の設定
    if (typeof window !== 'undefined') {
        (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__?.onCommitFiberRoot = null;
    }
    
    // Hot Module Replacement
    if (import.meta.hot) {
        import.meta.hot.accept();
    }
}

// 型安全性のためのグローバル宣言拡張
declare global {
    interface Window {
        __REACT_DEVTOOLS_GLOBAL_HOOK__?: any;
    }
}

// アプリケーション情報をコンソールに出力
console.log(`
🍽️ 料理原価計算システム v2.0
==============================
Environment: ${import.meta.env.MODE}
API URL: ${import.meta.env.VITE_API_URL}
Version: ${import.meta.env.VITE_APP_VERSION || '2.0.0'}
Build Time: ${new Date().toISOString()}
`);

// メタ情報
export const appMetadata = {
    name: '料理原価計算システム',
    version: import.meta.env.VITE_APP_VERSION || '2.0.0',
    environment: import.meta.env.MODE,
    apiUrl: import.meta.env.VITE_API_URL,
    buildTime: new Date().toISOString(),
};