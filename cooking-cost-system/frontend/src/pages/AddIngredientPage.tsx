import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AddIngredientPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        supplier: '',
        price: '',
        quantity: '',
        unit: ''
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

        // TODO: API connection
        console.log('Submitting data:', formData);

        // Temporary simulation
        setTimeout(() => {
            alert('食材を追加しました（デモ）');
            setIsSubmitting(false);
            setFormData({
                name: '',
                supplier: '',
                price: '',
                quantity: '',
                unit: ''
            });
        }, 1000);
    };

    return (
        <div className="min-h-[calc(100vh-80px)] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-xl w-full"
            >
                <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
                    <div className="bg-[#1a1a1a] py-6 px-8">
                        <h2 className="text-2xl font-bold text-white tracking-wider flex items-center">
                            <span className="w-2 h-8 bg-[#d9d9d9] mr-4 inline-block"></span>
                            食材追加
                            <span className="ml-auto text-xs font-normal opacity-60 tracking-widest uppercase">Add Ingredient</span>
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            {/* 商品名 */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2">
                                    商品名 <span className="text-red-500 font-normal">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="例: マヨネーズ"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                                />
                            </div>

                            {/* 購入先 */}
                            <div>
                                <label htmlFor="supplier" className="block text-sm font-bold text-gray-700 mb-2">
                                    購入先 <span className="text-red-500 font-normal">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="supplier"
                                    name="supplier"
                                    required
                                    value={formData.supplier}
                                    onChange={handleChange}
                                    placeholder="例: Aマート"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* 価格 */}
                                <div>
                                    <label htmlFor="price" className="block text-sm font-bold text-gray-700 mb-2">
                                        価格 (円) <span className="text-red-500 font-normal">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="price"
                                        name="price"
                                        required
                                        min="0"
                                        value={formData.price}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                                    />
                                </div>

                                {/* 量 */}
                                <div>
                                    <label htmlFor="quantity" className="block text-sm font-bold text-gray-700 mb-2">
                                        量 <span className="text-red-500 font-normal">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="quantity"
                                        name="quantity"
                                        required
                                        min="0"
                                        step="0.1"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* 単位 */}
                            <div>
                                <label htmlFor="unit" className="block text-sm font-bold text-gray-700 mb-2">
                                    単位 <span className="text-red-500 font-normal">*</span>
                                </label>
                                <select
                                    id="unit"
                                    name="unit"
                                    required
                                    value={formData.unit}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>選択してください</option>
                                    <option value="g">g (グラム)</option>
                                    <option value="ml">ml (ミリリットル)</option>
                                    <option value="個">個 (個数)</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-4 bg-[#1a1a1a] text-white font-bold rounded-lg shadow-lg hover:bg-black transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>登録中...</span>
                                    </>
                                ) : (
                                    <span>食材を登録する</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default AddIngredientPage;
