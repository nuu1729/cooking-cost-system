import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
    { label: 'ホーム', subLabel: 'HOME', path: '/' },
    { label: '食材追加', path: '/ingredients/add' },
    { label: '食材編集', path: '/ingredients/edit' },
    { label: '食材検索', path: '/ingredients/search' },
    { label: '中料理', path: '/dishes/medium' },
    { label: '大料理', path: '/dishes/large' },
    { label: '販売価格計算', path: '/calculator' },
];

const Header: React.FC = () => {
    return (
        <header className="h-[120px] bg-[#d9d9d9] flex items-center px-0 sticky top-0 z-50">
            {/* Logo Area */}
            <div className="h-full flex items-center">
                <img
                    src="/images/ming_10th_icon.png"
                    alt="Mingering Diner Logo"
                    className="h-full w-auto object-contain bg-white"
                />

                <div className="w-[2px] h-10 bg-[#a0a0a0] mx-6" />

                <h2 className="text-xl font-bold text-black tracking-tight">
                    料理原価計算システム
                </h2>
            </div>

            {/* Navigation */}
            <nav className="ml-auto flex items-center h-full gap-8 px-10">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center transition-opacity duration-200 hover:opacity-70 ${isActive ? 'text-black font-bold' : 'text-gray-800'
                            }`
                        }
                    >
                        <span className="text-lg">{item.label}</span>
                        {item.subLabel && (
                            <span className="text-xs font-medium tracking-widest">{item.subLabel}</span>
                        )}
                    </NavLink>
                ))}
            </nav>
        </header>
    );
};

export default Header;
