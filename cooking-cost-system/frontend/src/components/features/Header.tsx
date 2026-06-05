import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import AccountIcon from './AccountIcon';

const navItems = [
    { label: 'ホーム', subLabel: 'HOME', path: '/' },
    { label: '食材追加', subLabel: 'ADD', path: '/ingredients/add' },
    { label: '食材検索', subLabel: 'SEARCH', path: '/ingredients/search' },
    { label: '食材編集', subLabel: 'EDIT', path: '/ingredients/edit' },
    { label: '一覧', subLabel: 'LIST', path: '/list' },
    { label: '仕込み', subLabel: 'PREP', path: '/dishes/prep' },
    { label: 'お品', subLabel: 'DISH', path: '/dishes/large' },
    { label: '購入先', subLabel: 'STORES', path: '/stores' },
    { label: 'ジャンル', subLabel: 'GENRE', path: '/genres' },
    { label: '販売価格計算', subLabel: 'CALCULATOR', path: '/calculator' },
];

const Header: React.FC = () => {
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const closeDrawer = () => setDrawerOpen(false);

    return (
        <>
            <header className="h-[80px] bg-[#d9d9d9] flex items-center px-0 sticky top-0 z-50 overflow-visible border-b border-gray-300">
                {/* Account Icon Area */}
                <div className="flex items-center h-full relative" style={{ minWidth: '150px' }}>
                    <div className="absolute top-0 left-0 z-50 flex items-center justify-center" style={{ height: '80px', width: '80px' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/account')}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '0',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                transition: 'box-shadow 0.2s',
                            }}
                            className="account-icon-btn"
                            title="アカウント情報"
                            aria-label="アカウント情報を表示"
                        >
                            <AccountIcon size={40} />
                        </button>
                    </div>

                    <div className="w-[1px] h-8 bg-[#888] mx-6 ml-20 hidden sm:block" />

                    <h2 className="text-xl font-bold text-black tracking-tight self-center whitespace-nowrap hidden sm:block">
                        料理原価計算システム
                    </h2>
                </div>

                {/* Desktop Navigation */}
                <nav className="ml-auto items-center h-full gap-0 pr-4 hidden sm:flex">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center h-full px-5 transition-all duration-200 hover:bg-white/30 ${isActive ? 'text-black font-bold' : 'text-gray-700'
                                }`
                            }
                        >
                            <span className="text-[15px] leading-tight mb-1">{item.label}</span>
                            {item.subLabel && (
                                <span className="text-[9px] font-bold tracking-widest opacity-80">{item.subLabel}</span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Mobile: Title + Hamburger */}
                <div className="sm:hidden ml-auto flex items-center gap-3 pr-4">
                    <span className="text-base font-bold text-black tracking-tight">料理原価計算</span>
                    <button
                        type="button"
                        onClick={() => setDrawerOpen(true)}
                        aria-label="メニューを開く"
                        className="flex flex-col justify-center items-center w-11 h-11 gap-[5px] rounded-lg hover:bg-black/10 transition-colors"
                    >
                        <span className="block w-6 h-0.5 bg-gray-700 rounded" />
                        <span className="block w-6 h-0.5 bg-gray-700 rounded" />
                        <span className="block w-6 h-0.5 bg-gray-700 rounded" />
                    </button>
                </div>

                <style>{`
                    .account-icon-btn:hover .account-icon-wrapper {
                        box-shadow: 0 0 0 3px rgba(0,0,0,0.18);
                    }
                `}</style>
            </header>

            {/* Mobile Drawer Overlay */}
            {drawerOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[60] sm:hidden"
                    onClick={closeDrawer}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-[280px] bg-white z-[70] shadow-2xl transition-transform duration-300 sm:hidden flex flex-col ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
                aria-hidden={!drawerOpen}
            >
                {/* Drawer Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <span className="font-bold text-gray-800">メニュー</span>
                    <button
                        type="button"
                        onClick={closeDrawer}
                        aria-label="メニューを閉じる"
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 text-2xl leading-none"
                    >
                        ✕
                    </button>
                </div>

                {/* Drawer Nav Items */}
                <nav className="flex-1 overflow-y-auto py-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={closeDrawer}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-5 py-4 text-base transition-colors ${isActive
                                    ? 'bg-gray-100 font-bold text-black'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`
                            }
                        >
                            <span className="flex-1">{item.label}</span>
                            <span className="text-[10px] font-bold text-gray-400 tracking-widest">{item.subLabel}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Drawer Footer: Account */}
                <div className="border-t border-gray-200 p-4">
                    <button
                        type="button"
                        onClick={() => { navigate('/account'); closeDrawer(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                    >
                        <AccountIcon size={28} />
                        <span className="text-base">アカウント</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Header;
