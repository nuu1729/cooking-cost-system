import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Container } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

import Layout from './components/common/Layout';
import { useAuth } from './contexts/AuthContext';
import { useAppContext } from './contexts/AppContext';

// 遅延読み込み用のページコンポーネント
const MainPage = React.lazy(() => import('./pages/MainPage'));
const LoginPage = React.lazy(() => import('./LoginPage'));
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

// 認証保護されたルートコンポーネント
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, authEnabled, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (authEnabled && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

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
  const { authEnabled, isAuthenticated } = useAuth();

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
    <>
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* ログインページ（認証が有効な場合のみ表示） */}
            {authEnabled && (
              <Route 
                path="/login" 
                element={
                  isAuthenticated ? (
                    <Navigate to="/" replace />
                  ) : (
                    <PageWrapper>
                      <LoginPage />
                    </PageWrapper>
                  )
                } 
              />
            )}
            
            {/* 保護されたルート */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <PageWrapper>
                      <MainPage />
                    </PageWrapper>
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <PageWrapper>
                      <AdminPage />
                    </PageWrapper>
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <PageWrapper>
                      <ReportsPage />
                    </PageWrapper>
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <PageWrapper>
                      <SettingsPage />
                    </PageWrapper>
                  </Layout>
                </ProtectedRoute>
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
    </>
  );
};

export default App;
