import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

async function enableMocking() {
    console.log('[App] VITE_ENABLE_MOCK:', import.meta.env.VITE_ENABLE_MOCK);
    console.log('[App] VITE_API_URL:', import.meta.env.VITE_API_URL);
    
    if (import.meta.env.VITE_ENABLE_MOCK !== 'true') {
        console.log('[App] Mocking is disabled by environment variable.');
        return;
    }

    const { worker } = await import('./mocks/browser');
    console.log('[MSW] Starting worker...');
    
    return worker.start({
        onUnhandledRequest: (req) => {
            if (req.url.includes('/api/')) {
                console.warn(`[MSW] Unhandled request to API: ${req.method} ${req.url}`);
            }
        },
    }).then(() => {
        console.log('[MSW] Mocking is now fully enabled and active.');
    });
}

enableMocking().then(() => {
    const root = ReactDOM.createRoot(
        document.getElementById('root') as HTMLElement
    );
    
    root.render(
        <React.StrictMode>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <App />
            </BrowserRouter>
        </React.StrictMode>
    );
});