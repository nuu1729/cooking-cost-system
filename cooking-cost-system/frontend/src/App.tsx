import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';

// Pages
// Pages
import HomePage from './pages/02home/HomePage';
import AddIngredientPage from './pages/03add/AddIngredientPage';
import EditIngredientPage from './pages/04edit/EditIngredientPage';
import SearchIngredientPage from './pages/05search/SearchIngredientPage';
import PrepPage from './pages/06prep/prep';
import SignupPage from './pages/00signup/SignupPage';
import LoginPage from './pages/01login/LoginPage';

const App: React.FC = () => {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">読み込み中...</div>}>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Main Application Routes wrapped in Layout */}
                <Route
                    path="/*"
                    element={
                        <Layout>
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/ingredients/add" element={<AddIngredientPage />} />
                                <Route path="/ingredients/search" element={<SearchIngredientPage />} />
                                <Route path="/ingredients/edit" element={<EditIngredientPage />} />
                                <Route path="/list" element={<Placeholder title="一覧" />} />
                                <Route path="/dishes/prep" element={<PrepPage />} />
                                <Route path="/dishes/medium" element={<Navigate to="/dishes/prep" replace />} />
                                <Route path="/dishes/large" element={<Placeholder title="お品" />} />
                                <Route path="/calculator" element={<Placeholder title="販売価格計算" />} />

                                {/* 404 - Inside Layout */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Layout>
                    }
                />
            </Routes>
        </Suspense>
    );
};

const Placeholder: React.FC<{ title: string }> = ({ title }) => (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <h1 className="text-3xl font-bold text-gray-400">{title} (開発中)</h1>
    </div>
);

export default App;