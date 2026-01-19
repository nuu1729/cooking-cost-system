import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
    { label: 'ホーム', subLabel: 'HOME', path: '/' },
    { label: '食材追加', subLabel: 'ADD', path: '/ingredients/add' },
    { label: '食材編集', subLabel: 'EDIT', path: '/ingredients/edit' },
    { label: '食材検索', subLabel: 'SEARCH', path: '/ingredients/search' },
    { label: '中料理', subLabel: 'MEDIUM', path: '/dishes/medium' },
    { label: '大料理', subLabel: 'LARGE', path: '/dishes/large' },
    { label: '販売価格計算', subLabel: 'CALCULATOR', path: '/calculator' },
];

const Header: React.FC = () => {
    return (
        <header className="h-[80px] bg-[#d9d9d9] flex items-center px-0 sticky top-0 z-50 overflow-visible border-b border-gray-300">
            {/* Logo Area */}
            <div className="flex items-center h-full relative" style={{ minWidth: '150px' }}>
                <div className="absolute top-0 left-0 z-50">
                    <NavLink to="/">
                        <img
                            src="/images/ming_10th_icon.png"
                            alt="Mingering Diner Logo"
                            className="w-auto object-contain bg-white shadow-xl cursor-pointer"
                            style={{
                                height: '140px',
                                display: 'block',
                                position: 'relative',
                                top: '0px'
                            }}
                        />
                    </NavLink>
                </div>

                <div className="w-[1px] h-8 bg-[#888] mx-6 ml-40" />

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
        </header>
    );
};

export default Header;
