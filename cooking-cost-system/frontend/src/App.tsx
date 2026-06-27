import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/common/Layout';
import { authApi } from './api';
import { accountStore } from './stores/accountStore';
import { toBackendUrl } from './utils/url';

// Pages
import HomePage from './pages/02home/HomePage';
import AddIngredientPage from './pages/03add/AddIngredientPage';
import EditIngredientPage from './pages/05edit/EditIngredientPage';
import SearchIngredientPage from './pages/04search/SearchIngredientPage';
import PrepPage from './pages/07prep/prep';
import DishPage from './pages/08dish/dish';
import CalculatorPage from './pages/09calculator/CalculatorPage';
import SignupPage from './pages/00signup/SignupPage';
import LoginPage from './pages/01login/LoginPage';
import ListPage from './pages/06list/list';
import AccountPage from './pages/10account/AccountPage';
import StoresPage from './pages/11stores/StoresPage';
import GenresPage from './pages/12genres/GenresPage';

const App: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setAuthChecked(true);
            return;
        }
        authApi.me().then(res => {
            if (res.success && res.data) {
                const u = res.data as any;
                accountStore.initForUser(
                    u.id,
                    u.username,
                    u.email,
                    toBackendUrl(u.icon_url),
                    toBackendUrl(u.home_bg_url),
                );
            }
        }).catch((err: any) => {
            const status = err?.response?.status;
            const code = err?.response?.data?.error;
            if (status === 401 && code === 'UNAUTHORIZED') {
                localStorage.removeItem('authToken');
                const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
                if (!isAuthPage) {
                    navigate('/login');
                }
            }
        }).finally(() => {
            setAuthChecked(true);
        });
    }, []);

    if (!authChecked) {
        return <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">読み込み中...</div>;
    }

    const isAuthenticated = !!localStorage.getItem('authToken');

    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">読み込み中...</div>}>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Protected routes - redirect to /login if not authenticated */}
                <Route
                    path="/*"
                    element={
                        isAuthenticated ? (
                            <Layout>
                                <Routes>
                                    <Route path="/" element={<HomePage />} />
                                    <Route path="/ingredients/add" element={<AddIngredientPage />} />
                                    <Route path="/ingredients/search" element={<SearchIngredientPage />} />
                                    <Route path="/ingredients/edit" element={<EditIngredientPage />} />
                                    <Route path="/list" element={<ListPage />} />
                                    <Route path="/dishes/prep" element={<PrepPage />} />
                                    <Route path="/dishes/medium" element={<Navigate to="/dishes/prep" replace />} />
                                    <Route path="/dishes/large" element={<DishPage />} />
                                    <Route path="/stores" element={<StoresPage />} />
                                    <Route path="/genres" element={<GenresPage />} />
                                    <Route path="/calculator" element={<CalculatorPage />} />
                                    <Route path="/account" element={<AccountPage />} />

                                    {/* 404 - Inside Layout */}
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                            </Layout>
                        ) : (
                            <Navigate to="/login" replace state={{ from: location }} />
                        )
                    }
                />
            </Routes>
        </Suspense>
    );
};

export default App;
