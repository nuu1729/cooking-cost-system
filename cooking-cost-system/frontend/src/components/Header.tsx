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
        <header className="h-[80px] bg-[#d9d9d9] flex items-center px-0 sticky top-0 z-50 overflow-visible">
            {/* Logo Area */}
            <div className="flex items-center h-full relative" style={{ minWidth: '150px' }}>
                <div className="absolute top-0 left-0 z-50">
                    <img
                        src="/images/ming_10th_icon.png"
                        alt="Mingering Diner Logo"
                        className="w-auto object-contain bg-white shadow-xl"
                        style={{
                            height: '140px',
                            display: 'block',
                            position: 'relative',
                            top: '10px' // 10px down from the top of the viewport
                        }}
                    />
                </div>

                <div className="w-[1px] h-8 bg-[#888] mx-6 ml-40" />

                <h2 className="text-xl font-bold text-black tracking-tight self-center">
                    料理原価計算システム
                </h2>
            </div>

            {/* Navigation */}
            <nav className="ml-auto flex items-center h-full gap-6 px-10">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center transition-opacity duration-200 hover:opacity-70 ${isActive ? 'text-black font-bold' : 'text-gray-800'
                            }`
                        }
                    >
                        <span className="text-base">{item.label}</span>
                        {item.subLabel && (
                            <span className="text-[10px] font-medium tracking-widest -mt-1">{item.subLabel}</span>
                        )}
                    </NavLink>
                ))}
            </nav>
        </header>
    );
};

export default Header;
