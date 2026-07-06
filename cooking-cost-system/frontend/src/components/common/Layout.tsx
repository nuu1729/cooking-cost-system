import React from 'react';
import Header from '../features/Header';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    // h-screen-dvh: iOS Safari の URL バー表示中もヘッダーが固定されるよう dvh を使う（index.css 参照）
    return (
        <div className="h-screen-dvh bg-white flex flex-col overflow-hidden">
            <Header />
            {/* モバイル（sm未満）はここがスクロールを担当。デスクトップは各ページが個別に overflow を管理する */}
            <main className="flex-1 min-h-0 overflow-y-auto sm:overflow-hidden">
                {children}
            </main>
        </div>
    );
};

export default Layout;