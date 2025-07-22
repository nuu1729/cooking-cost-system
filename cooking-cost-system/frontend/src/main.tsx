import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// PWA関連の型定義
declare global {
    interface Window {
        deferredPrompt?: any;
    }
}

// エラーハンドリング
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // チャンクロードエラーの場合は自動リロード
    if (event.error?.name === 'ChunkLoadError') {
        console.log('Chunk load error detected, reloading...');
        window.location.reload();
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // ネットワークエラーの場合の処理
    if (event.reason?.message?.includes('Failed to fetch')) {
        console.log('Network error detected');
        // 必要に応じてオフライン通知など
    }
});

// パフォーマンス監視
if (import.meta.env.DEV) {
    // 開発環境でのパフォーマンス監視
    new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            console.log(`Performance: ${entry.name} - ${entry.duration}ms`);
        }
    }).observe({ entryTypes: ['measure', 'navigation', 'resource'] });
}

// Service Worker登録
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
                
                // 更新があった場合の処理
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker?.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // 新しいバージョンが利用可能
                            console.log('New content is available; please refresh.');
                            // 必要に応じて更新通知を表示
                        }
                    });
                });
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// PWAインストールプロンプト
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA install prompt available');
    e.preventDefault();
    window.deferredPrompt = e;
});

// PWAがインストールされた時の処理
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    window.deferredPrompt = null;
});

// オンライン/オフライン状態の監視
window.addEventListener('online', () => {
    console.log('App is online');
    // オンライン復帰時の処理
});

window.addEventListener('offline', () => {
    console.log('App is offline');
    // オフライン時の処理
});

// ビジュアルビューポートAPIのサポート
if ('visualViewport' in window) {
    window.visualViewport?.addEventListener('resize', () => {
        // モバイルでのキーボード表示/非表示時の対応
        const vh = window.visualViewport?.height;
        if (vh) {
            document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
        }
    });
}

// 初期ビューポート高さの設定
const setVh = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
};

setVh();
window.addEventListener('resize', setVh);

// React 18 Concurrent Features
const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

// 開発環境では StrictMode を有効にする
if (import.meta.env.DEV) {
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
} else {
    root.render(<App />);
}

// ホットリロード対応（開発環境のみ）
if (import.meta.hot) {
    import.meta.hot.accept('./App', () => {
        console.log('Hot reloading App component');
    });
}

// 開発環境でのデバッグ情報
if (import.meta.env.DEV) {
    console.log(`🍽️ 料理原価計算システム v2.0`);
    console.log(`📱 Environment: ${import.meta.env.MODE}`);
    console.log(`🔧 API URL: ${import.meta.env.VITE_API_URL}`);
    console.log(`⚡ Vite Version: ${import.meta.env.VITE_VERSION || 'unknown'}`);
    
    // React DevTools の有効化確認
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        console.log('🛠️ React DevTools detected');
    }
    
    // パフォーマンス測定
    performance.mark('app-start');
    window.addEventListener('load', () => {
        performance.mark('app-loaded');
        performance.measure('app-load-time', 'app-start', 'app-loaded');
        
        const loadTime = performance.getEntriesByName('app-load-time')[0];
        console.log(`⏱️ App load time: ${loadTime.duration.toFixed(2)}ms`);
    });
}

// グローバルエラー境界（最後の砦）
window.addEventListener('error', (event) => {
    // 重要なエラーの場合は外部サービスに送信
    if (import.meta.env.PROD && event.error?.name !== 'ChunkLoadError') {
        // エラー報告サービスへの送信（例：Sentry、LogRocket等）
        console.error('Critical error:', {
            message: event.error?.message,
            stack: event.error?.stack,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
        });
    }
});

// キーボードショートカット
document.addEventListener('keydown', (event) => {
    // Ctrl+K でクイック検索（将来の機能）
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        console.log('Quick search shortcut triggered');
        // クイック検索モーダルを開く処理
    }
    
    // Ctrl+/ でヘルプ表示
    if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        console.log('Help shortcut triggered');
        // ヘルプモーダルを開く処理
    }
});

// アプリケーションの初期化完了
console.log('🚀 Application initialized successfully');