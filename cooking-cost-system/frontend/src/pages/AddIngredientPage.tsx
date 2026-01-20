import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AddIngredientPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        supplier: '',
        price: '',
        quantity: '',
        unit: 'g'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulating submission
        setTimeout(() => {
            alert('食材を登録しました');
            setIsSubmitting(false);
            setFormData({ name: '', supplier: '', price: '', quantity: '', unit: 'g' });
        }, 800);
    };

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[#f9f9f9] py-16 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row gap-12 items-start">

                    {/* Left Column: Form */}
                    <div className="w-full md:w-2/3 space-y-8">
                        {/* Title Section */}
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-[#10b981] rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-200/50">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">食材を追加</h1>
                                <p className="text-gray-500 mt-1">購入した食材の情報を入力してください</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 bg-transparent">
                            {/* 商品名 */}
                            <div className="space-y-2">
                                <label className="text-lg font-bold text-gray-700 ml-1">商品名</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="例：トマト"
                                    className="w-full px-6 py-4 bg-[#f0f0f0] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-lg"
                                />
                            </div>

                            {/* 価格 */}
                            <div className="space-y-2">
                                <label className="text-lg font-bold text-gray-700 ml-1">価格</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 text-lg">¥</span>
                                    <input
                                        type="number"
                                        name="price"
                                        required
                                        min="0"
                                        value={formData.price}
                                        onChange={handleChange}
                                        placeholder="300"
                                        className="w-full pl-12 pr-6 py-4 bg-[#f0f0f0] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-lg"
                                    />
                                </div>
                            </div>

                            {/* 量 & 単位 */}
                            <div className="space-y-2">
                                <label className="text-lg font-bold text-gray-700 ml-1">量</label>
                                <div className="flex gap-4">
                                    <input
                                        type="number"
                                        name="quantity"
                                        required
                                        min="0"
                                        step="0.1"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="flex-grow px-6 py-4 bg-[#f0f0f0] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-lg"
                                    />
                                    <div className="relative min-w-[100px]">
                                        <select
                                            name="unit"
                                            value={formData.unit}
                                            onChange={handleChange}
                                            className="w-full h-full px-6 py-4 bg-[#f0f0f0] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none appearance-none cursor-pointer text-lg font-medium"
                                        >
                                            <option value="g">g</option>
                                            <option value="ml">ml</option>
                                            <option value="個">個</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 購入先 */}
                            <div className="space-y-2">
                                <label className="text-lg font-bold text-gray-700 ml-1">購入先</label>
                                <input
                                    type="text"
                                    name="supplier"
                                    required
                                    value={formData.supplier}
                                    onChange={handleChange}
                                    placeholder="例：コスモス"
                                    className="w-full px-6 py-4 bg-[#f0f0f0] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-lg"
                                />
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Actions */}
                    <div className="w-full md:w-1/3 flex flex-col gap-6 pt-24">
                        {/* Voice Input Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-8 rounded-[2rem] bg-gradient-to-r from-[#a855f7] to-[#ec4899] text-white flex flex-col items-center justify-center gap-3 shadow-xl hover:shadow-purple-200 transition-all transition-all duration-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            <span className="text-xl font-bold">音声で入力</span>
                        </motion.button>

                        {/* Submit Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full py-8 rounded-[2rem] bg-[#53b69b] text-white flex flex-col items-center justify-center gap-3 shadow-xl hover:shadow-emerald-200 transition-all duration-300 disabled:opacity-70"
                        >
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-xl font-bold text-[24px]">食材を登録</span>
                            </div>
                        </motion.button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AddIngredientPage;
