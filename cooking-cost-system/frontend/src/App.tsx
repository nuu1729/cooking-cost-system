import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';

// Pages
import HomePage from './pages/HomePage';
import AddIngredientPage from './pages/AddIngredientPage';

const App: React.FC = () => {
    return (
        <Layout>
            <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]">読み込み中...</div>}>
                <Routes>
                    <Route path="/" element={<HomePage />} />

                    {/* 今後開発予定の画面（プレースホルダー） */}
                    <Route path="/ingredients/add" element={<AddIngredientPage />} />
                    <Route path="/ingredients/edit" element={<Placeholder title="食材編集" />} />
                    <Route path="/ingredients/search" element={<Placeholder title="食材検索" />} />
                    <Route path="/dishes/medium" element={<Placeholder title="中料理" />} />
                    <Route path="/dishes/large" element={<Placeholder title="大料理" />} />
                    <Route path="/calculator" element={<Placeholder title="販売価格計算" />} />

                    {/* 404 */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </Layout>
    );
};

const Placeholder: React.FC<{ title: string }> = ({ title }) => (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <h1 className="text-3xl font-bold text-gray-400">{title} (開発中)</h1>
    </div>
);

export default App;