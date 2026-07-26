import React, { useState } from 'react';
import Header from '../features/Header';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    // ドロワーの開閉は Header 単体ではなく Layout が保持する。
    // main を drawerOpen 中に inert にするため（#146）、Header と main の
    // 共通の親である Layout に状態を持ち上げる必要がある。
    const [drawerOpen, setDrawerOpen] = useState(false);

    // h-screen-dvh: iOS Safari の URL バー表示中もヘッダーが固定されるよう dvh を使う（index.css 参照）
    return (
        <div className="h-screen-dvh bg-white flex flex-col overflow-hidden">
            <Header drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
            {/* モバイル（sm未満）はここがスクロールを担当。デスクトップは各ページが個別に overflow を管理する */}
            {/* overscroll-y-contain: スクロール終端で body へのチェイニング（iOS のバウンス）を防ぐ */}
            {/* inert: ドロワー展開中は背後の main コンテンツへのフォーカス・読み上げを防ぐ（#146） */}
            <main
                inert={drawerOpen ? '' : undefined}
                className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain sm:overflow-hidden"
            >
                {children}
            </main>
        </div>
    );
};

export default Layout;