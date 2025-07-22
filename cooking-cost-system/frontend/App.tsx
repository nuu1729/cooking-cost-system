import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Container } from '@mui/material';
import { Helmet } from 'react-helmet-async';

import Layout from './components/common/Layout';
import { useAuth } from './contexts/AuthContext';

// 遅延読み込みされるページコンポーネント
const MainPage = React.lazy(() => import('./pages/MainPage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

// ローディングコンポーネント
const LoadingFallback: React.FC = () => (
    <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
        flexDirection="column"
        gap={2}
    >
        <CircularProgress size={40} />
        <Box color="text.secondary">読み込み中...</Box>
    </Box>
);

// 認証が必要なルートのラッパー
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingFallback />;
    }

    if (!isAuthenticated) {
        // 認証機能が実装されるまでは、すべてのユーザーにアクセスを許可
        // return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

// 管理者専用ルートのラッパー
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingFallback />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

// メインアプリケーションコンポーネント
const App: React.FC = () => {
    return (
        <>
        <Helmet>
            <title>料理原価計算システム v2.0</title>
            <meta name="description" content="モダンな料理原価計算・管理システム" />
            <meta name="keywords" content="料理,原価計算,レストラン,食材管理,コスト管理" />
            <meta name="author" content="料理原価計算システム開発チーム" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            
            {/* Open Graph tags */}
            <meta property="og:title" content="料理原価計算システム v2.0" />
            <meta property="og:description" content="モダンな料理原価計算・管理システム" />
            <meta property="og:type" content="website" />
            <meta property="og:url" content={window.location.origin} />
            
            {/* Twitter Card tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="料理原価計算システム v2.0" />
            <meta name="twitter:description" content="モダンな料理原価計算・管理システム" />
            
            {/* PWA関連 */}
            <meta name="theme-color" content="#1976d2" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="apple-mobile-web-app-title" content="原価計算" />
            
            {/* Preconnect for performance */}
            <link rel="preconnect" href={import.meta.env.VITE_API_URL} />
            <link rel="dns-prefetch" href={import.meta.env.VITE_API_URL} />
        </Helmet>

        <Routes>
            {/* メインレイアウトを使用するルート */}
            <Route path="/" element={<Layout />}>
            <Route
                index
                element={
                <ProtectedRoute>
                    <Suspense fallback={<LoadingFallback />}>
                    <MainPage />
                    </Suspense>
                </ProtectedRoute>
                }
            />
            
            <Route
                path="admin"
                element={
                <AdminRoute>
                    <Suspense fallback={<LoadingFallback />}>
                    <AdminPage />
                    </Suspense>
                </AdminRoute>
                }
            />
            
            <Route
                path="reports"
                element={
                <ProtectedRoute>
                    <Suspense fallback={<LoadingFallback />}>
                    <ReportsPage />
                    </Suspense>
                </ProtectedRoute>
                }
            />
            
            <Route
                path="settings"
                element={
                <ProtectedRoute>
                    <Suspense fallback={<LoadingFallback />}>
                    <SettingsPage />
                    </Suspense>
                </ProtectedRoute>
                }
            />
            </Route>

            {/* 認証ページ（将来の実装用） */}
            {/*
            <Route
            path="/login"
            element={
                <Suspense fallback={<LoadingFallback />}>
                <LoginPage />
                </Suspense>
            }
            />
            
            <Route
            path="/register"
            element={
                <Suspense fallback={<LoadingFallback />}>
                <RegisterPage />
                </Suspense>
            }
            />
            */}

            {/* 404ページ */}
            <Route
            path="*"
            element={
                <Suspense fallback={<LoadingFallback />}>
                <NotFoundPage />
                </Suspense>
            }
            />
        </Routes>
        </>
    );
};

export default App;