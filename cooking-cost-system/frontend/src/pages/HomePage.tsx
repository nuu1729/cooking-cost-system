import React from 'react';
import { motion } from 'framer-motion';

const HomePage: React.FC = () => {
    return (
        <div className="relative h-[calc(100vh-80px)] flex flex-row overflow-hidden">
            {/* Left side - Content (Matches Figma) */}
            <div className="w-1/2 flex items-center justify-center bg-white p-12">
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

            {/* Right side - Image (Matches Figma) */}
            <div className="w-1/2 relative bg-gray-100">
                <img
                    src="/images/ming_outlook.jpeg"
                    alt="Mingering Diner Exterior"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Shadow overlay at the junction (vertical line) */}
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
            </div>
        </div>
    );
};

export default HomePage;
