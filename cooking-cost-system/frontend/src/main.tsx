import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

async function enableMocking() {
    if (import.meta.env.VITE_ENABLE_MOCK !== 'true') {
        return;
    }
    const { worker } = await import('./mocks/browser');
    console.log('[MSW] Mocking enabled.');
    return worker.start({
        onUnhandledRequest: 'bypass',
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