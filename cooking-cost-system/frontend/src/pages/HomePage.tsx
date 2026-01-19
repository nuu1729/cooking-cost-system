import React from 'react';
import { motion } from 'framer-motion';

const HomePage: React.FC = () => {
    return (
        <div className="relative h-[calc(100vh-120px)] flex flex-row-reverse overflow-hidden">
            {/* Right side - Content (since user said image is on the LEFT) */}
            <div className="w-1/2 flex items-center justify-center bg-white p-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="text-center"
                >
                    <h1 className="text-6xl font-black tracking-[0.2em] text-[#1a1a1a] leading-tight">
                        料理原価計算システム
                    </h1>
                </motion.div>
            </div>

            {/* Left side - Image (Matching user's specific instruction "左側背景") */}
            <div className="w-1/2 relative bg-gray-100">
                <img
                    src="/images/ming_outlook.png"
                    alt="Mingering Diner Exterior"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Shadow overlay at the junction */}
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black/40 to-transparent pointer-events-none" />
            </div>
        </div>
    );
};

export default HomePage;
