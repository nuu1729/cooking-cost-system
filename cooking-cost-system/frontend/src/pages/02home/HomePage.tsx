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
        <div className="relative h-[calc(100vh-80px)] flex flex-row overflow-hidden bg-white">
            {/* Left side - Content (65%) */}
            <div className="w-[65%] flex items-center justify-center p-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center"
                >
                    <h1 className="text-6xl font-black tracking-[0.2em] text-[#1a1a1a] leading-tight">
                        料理原価計算システム
                    </h1>
                </motion.div>
            </div>

            {/* Right side - Image (35%) */}
            <div className="w-[35%] relative overflow-hidden">
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
                <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
            </div>
        </div>
    );
};

export default HomePage;

