import React from 'react';
import { motion } from 'framer-motion';

const HomePage: React.FC = () => {
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
            <div className="w-[35%] relative overflow-hidden bg-gray-100">
                <img
                    src="/images/ming_outlook.jpeg"
                    alt="Mingering Diner Exterior"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/ming_outlook.png'; // Fallback to .png
                    }}
                />
                {/* Shadow overlay at the junction (vertical line) */}
                <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
            </div>
        </div>
    );
};

export default HomePage;
