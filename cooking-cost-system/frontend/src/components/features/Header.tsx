import React from 'react';
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
    { label: 'ジャンル', subLabel: 'GENRE', path: '/genres' },
    { label: '販売価格計算', subLabel: 'CALCULATOR', path: '/calculator' },
];

const Header: React.FC = () => {
    const navigate = useNavigate();

    return (
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

                <div className="w-[1px] h-8 bg-[#888] mx-6 ml-20" />

                <h2 className="text-xl font-bold text-black tracking-tight self-center whitespace-nowrap">
                    料理原価計算システム
                </h2>
            </div>

            {/* Navigation */}
            <nav className="ml-auto flex items-center h-full gap-0 pr-4">
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

            <style>{`
                .account-icon-btn:hover .account-icon-wrapper {
                    box-shadow: 0 0 0 3px rgba(0,0,0,0.18);
                }
            `}</style>
        </header>
    );
};

export default Header;
