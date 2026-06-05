import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { accountStore } from '../../stores/accountStore';

const HomePage: React.FC = () => {
    const [bgUrl, setBgUrl] = useState<string | null>(accountStore.get().homeBgUrl);

    useEffect(() => {
        const handler = (e: Event) => {
            const custom = e as CustomEvent;
            setBgUrl(custom.detail.homeBgUrl ?? null);
        };
        window.addEventListener('account-updated', handler);
        return () => window.removeEventListener('account-updated', handler);
    }, []);

    return (
        <div className="relative flex flex-col sm:flex-row h-full overflow-hidden bg-white">
            {/* Content area */}
            <div className="flex items-center justify-center p-8 sm:p-12 relative z-10 w-full sm:w-[65%] min-h-[40vh] sm:min-h-0">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center"
                >
                    <h1 className="text-3xl sm:text-6xl font-black tracking-[0.1em] sm:tracking-[0.2em] text-[#1a1a1a] leading-tight">
                        料理原価計算システム
                    </h1>
                </motion.div>
            </div>

            {/* Image area */}
            <div className="w-full sm:w-[35%] h-[50vw] max-h-[300px] sm:h-full sm:max-h-none relative overflow-hidden">
                {bgUrl ? (
                    <img
                        src={bgUrl}
                        alt="ホーム背景"
                        className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300" />
                )}
                {/* Shadow overlay at the junction */}
                <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/20 to-transparent pointer-events-none hidden sm:block" />
                <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/10 to-transparent pointer-events-none sm:hidden" />
            </div>
        </div>
    );
};

export default HomePage;
