import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormData {
    name: string;
    price: string;
    quantity: string;
    unit: string;
    supplier: string;
}

const AddIngredientPage: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        price: '',
        quantity: '',
        unit: 'g',
        supplier: ''
    });

    const [errors, setErrors] = useState<Partial<Record<keyof FormData, boolean>>>({});
    const [isConfirming, setIsConfirming] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle form validation
    const validate = () => {
        const newErrors: Partial<Record<keyof FormData, boolean>> = {};
        let isValid = true;

        (Object.keys(formData) as Array<keyof FormData>).forEach(key => {
            if (!formData[key] || formData[key].toString().trim() === '') {
                newErrors[key] = true;
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name as keyof FormData]) {
            setErrors(prev => ({ ...prev, [name]: false }));
        }
    };

    const handlePreSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            setIsConfirming(true);
        }
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            alert('食材を登録しました');
            setIsSubmitting(false);
            setIsConfirming(false);
            setFormData({ name: '', price: '', quantity: '', unit: 'g', supplier: '' });
            setErrors({});
        }, 800);
    };

    // Keyboard support for Modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isConfirming) return;
            if (e.key === 'Enter') {
                handleFinalSubmit();
            } else if (e.key === 'Escape') {
                setIsConfirming(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isConfirming, formData]);

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[#f9f9f9] py-16 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row gap-12 items-start">

                    {/* Left Column: Form */}
                    <div className="w-full md:w-2/3 space-y-8">
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

                        <form onSubmit={handlePreSubmit} className="space-y-6 bg-transparent">
                            {/* 商品名 */}
                            <div className="space-y-2">
                                <label className="text-lg font-bold text-gray-700 ml-1 flex justify-between">
                                    <span>商品名</span>
                                    {errors.name && <span className="text-sm text-red-500 font-normal">入力してください</span>}
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="例：トマト"
                                    className={`w-full px-6 py-4 bg-[#f0f0f0] border-2 rounded-2xl transition-all outline-none text-lg ${errors.name ? 'border-red-300 ring-2 ring-red-100 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-emerald-500'}`}
                                />
                            </div>

                            {/* 価格 */}
                            <div className="space-y-2">
                                <label className="text-lg font-bold text-gray-700 ml-1 flex justify-between">
                                    <span>価格</span>
                                    {errors.price && <span className="text-sm text-red-500 font-normal">入力してください</span>}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 text-lg">¥</span>
                                    <input
                                        type="number"
                                        name="price"
                                        min="0"
                                        value={formData.price}
                                        onChange={handleChange}
                                        placeholder="300"
                                        className={`w-full pl-12 pr-6 py-4 bg-[#f0f0f0] border-2 rounded-2xl transition-all outline-none text-lg ${errors.price ? 'border-red-300 ring-2 ring-red-100 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-emerald-500'}`}
                                    />
                                </div>
                            </div>

                            {/* 量 & 単位 */}
                            <div className="space-y-2">
                                <label className="text-lg font-bold text-gray-700 ml-1 flex justify-between">
                                    <span>量</span>
                                    {(errors.quantity || errors.unit) && <span className="text-sm text-red-500 font-normal">入力してください</span>}
                                </label>
                                <div className="flex gap-4">
                                    <input
                                        type="number"
                                        name="quantity"
                                        min="0"
                                        step="0.1"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className={`flex-grow px-6 py-4 bg-[#f0f0f0] border-2 rounded-2xl transition-all outline-none text-lg ${errors.quantity ? 'border-red-300 ring-2 ring-red-100 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-emerald-500'}`}
                                    />
                                    <div className="relative min-w-[100px]">
                                        <select
                                            name="unit"
                                            value={formData.unit}
                                            onChange={handleChange}
                                            className={`w-full h-full px-6 py-4 bg-[#f0f0f0] border-2 rounded-2xl transition-all outline-none appearance-none cursor-pointer text-lg font-medium ${errors.unit ? 'border-red-300 ring-2 ring-red-100 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-emerald-500'}`}
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
                                <label className="text-lg font-bold text-gray-700 ml-1 flex justify-between">
                                    <span>購入先</span>
                                    {errors.supplier && <span className="text-sm text-red-500 font-normal">入力してください</span>}
                                </label>
                                <input
                                    type="text"
                                    name="supplier"
                                    value={formData.supplier}
                                    onChange={handleChange}
                                    placeholder="例：コスモス"
                                    className={`w-full px-6 py-4 bg-[#f0f0f0] border-2 rounded-2xl transition-all outline-none text-lg ${errors.supplier ? 'border-red-300 ring-2 ring-red-100 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-emerald-500'}`}
                                />
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Actions */}
                    <div className="w-full md:w-1/3 flex flex-col gap-6 pt-24">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-8 rounded-[2rem] bg-gradient-to-r from-[#a855f7] to-[#ec4899] text-white flex flex-col items-center justify-center gap-3 shadow-xl hover:shadow-purple-200 transition-all duration-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            <span className="text-xl font-bold">音声で入力</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handlePreSubmit}
                            className="w-full py-8 rounded-[2rem] bg-[#53b69b] text-white flex flex-col items-center justify-center gap-3 shadow-xl hover:shadow-emerald-200 transition-all duration-300"
                        >
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-[24px] font-bold">食材を登録</span>
                            </div>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {isConfirming && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsConfirming(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-10 space-y-8">
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-black text-gray-800">登録内容の確認</h3>
                                    <p className="text-gray-500">この内容で登録してもよろしいですか？</p>
                                </div>

                                <div className="bg-gray-50 rounded-3xl p-8 space-y-4 border border-gray-100">
                                    <div className="flex justify-between border-b border-gray-200 pb-3">
                                        <span className="text-gray-500 font-bold">商品名</span>
                                        <span className="text-gray-800 font-black">{formData.name}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-200 pb-3">
                                        <span className="text-gray-500 font-bold">価格</span>
                                        <span className="text-gray-800 font-black">¥{Number(formData.price).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-200 pb-3">
                                        <span className="text-gray-500 font-bold">量</span>
                                        <span className="text-gray-800 font-black">{formData.quantity}{formData.unit}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 font-bold">購入先</span>
                                        <span className="text-gray-800 font-black">{formData.supplier}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleFinalSubmit}
                                        disabled={isSubmitting}
                                        className="w-full py-5 bg-[#53b69b] text-white font-bold text-xl rounded-2xl shadow-lg shadow-emerald-100 hover:bg-[#45a089] transition-all flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting ? '登録中...' : '登録を確定する (Enter)'}
                                    </button>
                                    <button
                                        onClick={() => setIsConfirming(false)}
                                        disabled={isSubmitting}
                                        className="w-full py-5 bg-gray-100 text-gray-600 font-bold text-xl rounded-2xl hover:bg-gray-200 transition-all"
                                    >
                                        戻る (ESC)
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AddIngredientPage;
