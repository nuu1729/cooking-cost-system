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

import App from './App';
import { theme } from './theme';
import { AppContextProvider } from './contexts/AppContext';
import './index.css';

// React Query クライアント設定
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 5 * 60 * 1000, // 5分
        cacheTime: 10 * 60 * 1000, // 10分
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        },
        mutations: {
        retry: 1,
        retryDelay: 1000,
        },
    },
});

// エラーバウンダリー
class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error?: Error }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('アプリケーションエラー:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
        return (
            <div style={{ 
            padding: '20px', 
            textAlign: 'center',
            fontFamily: 'Arial, sans-serif'
            }}>
            <h1>🚨 アプリケーションエラー</h1>
            <p>申し訳ございませんが、予期しないエラーが発生しました。</p>
            <p>ページを再読み込みしてください。</p>
            <button 
                onClick={() => window.location.reload()}
                style={{
                padding: '10px 20px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
                }}
            >
                再読み込み
            </button>
            {process.env.NODE_ENV === 'development' && (
                <details style={{ marginTop: '20px', textAlign: 'left' }}>
                <summary>エラー詳細 (開発モード)</summary>
                <pre style={{ 
                    backgroundColor: '#f5f5f5', 
                    padding: '10px',
                    overflow: 'auto'
                }}>
                    {this.state.error?.stack}
                </pre>
                </details>
            )}
            </div>
        );
        }

        return this.props.children;
    }
}

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <ErrorBoundary>
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <AppContextProvider>
                <DndProvider backend={HTML5Backend}>
                    <App />
                    <Toaster
                    position="top-right"
                    reverseOrder={false}
                    gutter={8}
                    containerClassName=""
                    containerStyle={{}}
                    toastOptions={{
                        // デフォルトオプション
                        className: '',
                        duration: 4000,
                        style: {
                        background: '#363636',
                        color: '#fff',
                        },
                        
                        // 成功メッセージ
                        success: {
                        duration: 3000,
                        iconTheme: {
                            primary: '#4caf50',
                            secondary: '#fff',
                        },
                        },
                        
                        // エラーメッセージ
                        error: {
                        duration: 5000,
                        iconTheme: {
                            primary: '#f44336',
                            secondary: '#fff',
                        },
                        },
                        
                        // ローディング
                        loading: {
                        duration: Infinity,
                        },
                    }}
                    />
                </DndProvider>
                </AppContextProvider>
            </ThemeProvider>
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
            </QueryClientProvider>
        </BrowserRouter>
        </ErrorBoundary>
    </React.StrictMode>
);

// PWA更新通知
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
            console.log('SW registered: ', registration);
            
            // 更新があった場合の処理
            registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                    // 新しいバージョンが利用可能
                    console.log('新しいバージョンが利用可能です');
                    // ユーザーに更新を促すトーストを表示
                    import('react-hot-toast').then(({ default: toast }) => {
                        toast((t) => (
                        <div>
                            <div>新しいバージョンが利用可能です</div>
                            <button 
                            onClick={() => {
                                toast.dismiss(t.id);
                                window.location.reload();
                            }}
                            style={{
                                marginTop: '8px',
                                padding: '4px 8px',
                                backgroundColor: '#1976d2',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                            >
                            更新
                            </button>
                        </div>
                        ), { duration: 10000 });
                    });
                    }
                }
                });
            }
            });
        })
        .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}