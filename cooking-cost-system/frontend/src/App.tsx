import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Container } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

import Layout from './components/common/Layout';
import { useAppContext } from './contexts/AppContext';

// 遅延読み込み用のページコンポーネント
const MainPage = React.lazy(() => import('./pages/MainPage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

// ローディングコンポーネント
const LoadingSpinner: React.FC = () => (
    <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
        flexDirection="column"
        gap={2}
    >
        <CircularProgress size={40} />
        <Box color="text.secondary" fontSize="0.875rem">
        読み込み中...
        </Box>
    </Box>
);

// ページアニメーション設定
const pageVariants = {
    initial: {
        opacity: 0,
        x: -20,
    },
    in: {
        opacity: 1,
        x: 0,
    },
    out: {
        opacity: 0,
        x: 20,
    },
};

const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.3,
};

// ページラッパーコンポーネント
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
    >
        {children}
    </motion.div>
);

const App: React.FC = () => {
    const { isLoading, error } = useAppContext();

    // アプリケーションレベルのエラー表示
    if (error) {
        return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Box textAlign="center">
            <h1>🚨 エラーが発生しました</h1>
            <p>{error}</p>
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
            </Box>
        </Container>
        );
    }

    return (
        <Layout>
        <AnimatePresence mode="wait">
            <Suspense fallback={<LoadingSpinner />}>
            <Routes>
                {/* メインページ */}
                <Route 
                path="/" 
                element={
                    <PageWrapper>
                    <MainPage />
                    </PageWrapper>
                } 
                />
                
                {/* 管理ページ */}
                <Route 
                path="/admin" 
                element={
                    <PageWrapper>
                    <AdminPage />
                    </PageWrapper>
                } 
                />
                
                {/* レポートページ */}
                <Route 
                path="/reports" 
                element={
                    <PageWrapper>
                    <ReportsPage />
                    </PageWrapper>
                } 
                />
                
                {/* 設定ページ */}
                <Route 
                path="/settings" 
                element={
                    <PageWrapper>
                    <SettingsPage />
                    </PageWrapper>
                } 
                />
                
                {/* 404 ページ */}
                <Route 
                path="/404" 
                element={
                    <PageWrapper>
                    <NotFoundPage />
                    </PageWrapper>
                } 
                />
                
                {/* 未定義のルートは404にリダイレクト */}
                <Route 
                path="*" 
                element={<Navigate to="/404" replace />} 
                />
            </Routes>
            </Suspense>
        </AnimatePresence>

        {/* グローバルローディング */}
        {isLoading && (
            <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bgcolor="rgba(255, 255, 255, 0.7)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex={9999}
            >
            <Box textAlign="center">
                <CircularProgress />
                <Box mt={2} color="text.secondary">
                処理中...
                </Box>
            </Box>
            </Box>
        )}
        </Layout>
    );
};

export default App;