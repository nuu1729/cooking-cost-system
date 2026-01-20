import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ingredientApi } from '../services/api';
import { Ingredient } from '../types';
import toast from 'react-hot-toast';

// Speech Recognition Types
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface FormData {
    id: number | null;
    name: string;
    priceBefore: string;
    priceAfter: string;
    quantity: string;
    unit: string;
    supplier: string;
}

const EditIngredientPage: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        id: null,
        name: '',
        priceBefore: '0',
        priceAfter: '',
        quantity: '',
        unit: 'g',
        supplier: ''
    });

    const [errors, setErrors] = useState<Partial<Record<keyof FormData, boolean>>>({});
    const [isConfirming, setIsConfirming] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Ingredient[]>([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Voice Input State
    const [isListening, setIsListening] = useState(false);
    const [lastTranscript, setLastTranscript] = useState('');

    // Predictive Search Logic
    useEffect(() => {
        const fetchResults = async () => {
            if (searchQuery.length < 1) {
                setSearchResults([]);
                return;
            }
            try {
                const response = await ingredientApi.getAll({ name: searchQuery, limit: 5 });
                if (response.success && response.data) {
                    setSearchResults(response.data);
                }
            } catch (error) {
                console.error('Search failed:', error);
            }
        };

        const timer = setTimeout(fetchResults, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectIngredient = (item: Ingredient) => {
        setFormData({
            id: item.id || null,
            name: item.name,
            priceBefore: item.price.toString(),
            priceAfter: item.price.toString(),
            quantity: item.quantity.toString(),
            unit: item.unit,
            supplier: item.store
        });
        setSearchQuery(item.name);
        setSearchResults([]);
        setShowResults(false);
        setErrors({});
    };

    const validate = () => {
        const newErrors: Partial<Record<keyof FormData, boolean>> = {};
        let isValid = true;

        const requiredFields: Array<keyof FormData> = ['id', 'name', 'priceAfter', 'quantity', 'supplier'];
        requiredFields.forEach(key => {
            if (!formData[key] || formData[key]?.toString().trim() === '') {
                newErrors[key] = true;
                isValid = false;
            }
        });

        setErrors(newErrors);
        if (!formData.id) {
            toast.error('編集する食材を検索して選択してください');
        }
        return isValid;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormData]) {
            setErrors(prev => ({ ...prev, [name]: false }));
        }
    };

    const handlePreSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (validate()) {
            setIsConfirming(true);
        }
    };

    const handleFinalSubmit = async () => {
        if (!formData.id) return;
        setIsSubmitting(true);
        try {
            const response = await ingredientApi.update(formData.id, {
                name: formData.name,
                store: formData.supplier,
                price: parseFloat(formData.priceAfter),
                quantity: parseFloat(formData.quantity),
                unit: formData.unit
            });

            if (response.success) {
                toast.success('食材情報を更新しました！');
                setFormData({ id: null, name: '', priceBefore: '0', priceAfter: '', quantity: '', unit: 'g', supplier: '' });
                setSearchQuery('');
                setErrors({});
            } else {
                toast.error(response.message || '更新に失敗しました');
            }
        } catch (error) {
            console.error('Update failed:', error);
        } finally {
            setIsSubmitting(false);
            setIsConfirming(false);
        }
    };

    // Voice Input Parser
    const parseVoiceData = useCallback((text: string) => {
        const data = { ...formData };
        const cleanText = text.replace(/、|。/g, ' ').trim();
        const words = cleanText.split(/\s+/);

        words.forEach((word) => {
            const priceMatch = word.match(/(\d+)円/);
            if (priceMatch) {
                data.priceAfter = priceMatch[1];
                return;
            }
            const gMatch = word.match(/([\d.]+)グラム/) || word.match(/([\d.]+)g/i);
            if (gMatch) {
                data.quantity = gMatch[1];
                data.unit = 'g';
                return;
            }
            const mlMatch = word.match(/([\d.]+)ミリリットル/) || word.match(/([\d.]+)ml/i);
            if (mlMatch) {
                data.quantity = mlMatch[1];
                data.unit = 'ml';
                return;
            }
            const unitMatch = word.match(/([\d.]+)個/);
            if (unitMatch) {
                data.quantity = unitMatch[1];
                data.unit = '個';
                return;
            }
        });

        const nonDataWords = words.filter(w =>
            !w.includes('円') && !w.includes('g') && !w.includes('グラム') &&
            !w.includes('ml') && !w.includes('ミリ') && !w.includes('個')
        );

        if (nonDataWords.length >= 2) {
            data.supplier = nonDataWords[nonDataWords.length - 1];
        }

        setFormData(data);
    }, [formData]);

    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error('お使いのブラウザは音声認識に対応していません。');
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = 'ja-JP';
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setLastTranscript(transcript);
            parseVoiceData(transcript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };

    // Modal Keyboard Support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isConfirming) return;
            if (e.key === 'Enter') handleFinalSubmit();
            else if (e.key === 'Escape') setIsConfirming(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isConfirming, formData]);

    // Custom Icon Component: Professional Line Art representing Ingredients + Document
    const IngredientEditIcon = () => (
        <svg viewBox="0 0 100 100" className="w-9 h-9 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Document / Clipboard Base */}
            <path
                d="M30 20 H70 C72.2 20 74 21.8 74 24 V76 C74 78.2 72.2 80 70 80 H30 C27.8 80 26 78.2 26 76 V24 C26 21.8 27.8 20 30 20Z"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinejoin="round"
            />
            {/* Document Lines */}
            <path d="M38 35 H62" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
            <path d="M38 45 H50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />

            {/* Apple Silhouette (Ingredient) */}
            <path
                d="M55 58 C55 52 62 48 68 48 C74 48 81 52 81 58 C81 68 74 74 68 74 C62 74 55 68 55 58Z"
                fill="currentColor"
                stroke="#10b981"
                strokeWidth="1.5"
            />
            <path d="M68 48 Q70 42 74 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

            {/* Pencil (Edit Action) */}
            <path
                d="M78 25 L88 35 L80 43 L70 33 L78 25Z"
                fill="currentColor"
                stroke="#10b981"
                strokeWidth="1"
            />
            <path d="M70 33 L67 36 L70 39" fill="currentColor" />
        </svg>
    );

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[#f9f9f9] py-16 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row gap-12 items-start">

                    {/* Left Column: Form */}
                    <div className="w-full md:w-2/3 space-y-8">
                        {/* Title Section */}
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-[#10b981] rounded-xl flex items-center justify-center shadow-lg shadow-green-200/50">
                                <IngredientEditIcon />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">食材情報を編集</h1>
                                <p className="text-gray-500 mt-1">購入した食材の情報を編集してください</p>
                            </div>
                        </div>

                        <form onSubmit={handlePreSubmit} className="space-y-6">
                            {/* 商品名 (検索) */}
                            <div className="space-y-2 relative" ref={searchRef}>
                                <label className="text-lg font-bold text-gray-700 ml-1 flex justify-between">
                                    <span>商品名 (検索)</span>
                                    {errors.name && <span className="text-sm text-red-500 font-normal">入力してください</span>}
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowResults(true);
                                        setFormData(prev => ({ ...prev, name: e.target.value }));
                                    }}
                                    onFocus={() => setShowResults(true)}
                                    placeholder="例：トマト"
                                    autoComplete="off"
                                    className={`w-full px-6 py-4 bg-[#f0f0f0] border-2 rounded-2xl transition-all outline-none text-lg ${errors.name ? 'border-red-300 ring-2 ring-red-100 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-emerald-500'}`}
                                />
                                {/* Predictive Search Results */}
                                <AnimatePresence>
                                    {showResults && searchResults.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                                        >
                                            {searchResults.map((item) => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => handleSelectIngredient(item)}
                                                    className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex justify-between items-center group border-b border-gray-50 last:border-none"
                                                >
                                                    <div>
                                                        <div className="font-bold text-gray-800 group-hover:text-emerald-600">{item.name}</div>
                                                        <div className="text-xs text-gray-400">{item.store}</div>
                                                    </div>
                                                    <div className="text-sm font-bold text-gray-400">¥{item.price.toLocaleString()}</div>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* 価格 (Before & After) */}
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-2">
                                    <label className="text-lg font-bold text-gray-700 ml-1">価格 (変更前)</label>
                                    <div className="relative opacity-60">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 text-lg">¥</span>
                                        <input
                                            type="text"
                                            readOnly
                                            value={Number(formData.priceBefore).toLocaleString()}
                                            className="w-full pl-12 pr-6 py-4 bg-gray-100 border-2 border-transparent rounded-2xl outline-none text-lg font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <label className="text-lg font-bold text-gray-700 ml-1 flex justify-between">
                                        <span>価格 (変更後)</span>
                                        {errors.priceAfter && <span className="text-sm text-red-500 font-normal">入力してください</span>}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 text-lg">¥</span>
                                        <input
                                            type="number"
                                            name="priceAfter"
                                            value={formData.priceAfter}
                                            onChange={handleChange}
                                            placeholder="300"
                                            className={`w-full pl-12 pr-6 py-4 bg-[#f0f0f0] border-2 rounded-2xl transition-all outline-none text-lg ${errors.priceAfter ? 'border-red-300 ring-2 ring-red-100 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-emerald-500'}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 量 & 単位 */}
                            <div className="space-y-2">
                                <label className="text-lg font-bold text-gray-700 ml-1 flex justify-between">
                                    <span>量</span>
                                    {errors.quantity && <span className="text-sm text-red-500 font-normal">入力してください</span>}
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
                            onClick={startListening}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            animate={isListening ? { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1.5 } } : {}}
                            className={`w-full py-8 rounded-[2rem] text-white flex flex-col items-center justify-center gap-3 shadow-xl transition-all duration-300 ${isListening ? 'bg-red-500 shadow-red-200' : 'bg-gradient-to-r from-[#a855f7] to-[#ec4899] shadow-purple-200 hover:shadow-purple-300'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            <span className="text-xl font-bold font-['Outfit']">{isListening ? '聴いています...' : '音声で入力'}</span>
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
                                <span className="text-[24px] font-bold font-['Outfit']">食材を登録</span>
                            </div>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {isConfirming && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsConfirming(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
                            <div className="p-10 space-y-8">
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-black text-gray-800 font-['Outfit']">情報の更新確認</h3>
                                    <p className="text-gray-500">この内容で更新してもよろしいですか？</p>
                                </div>
                                <div className="bg-gray-50 rounded-3xl p-8 space-y-4 border border-gray-100">
                                    <div className="flex justify-between border-b border-gray-200 pb-3">
                                        <span className="text-gray-500 font-bold">商品名</span>
                                        <span className="text-gray-800 font-black">{formData.name}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-200 pb-3">
                                        <span className="text-gray-500 font-bold">価格 (変更前)</span>
                                        <span className="text-gray-400 font-bold line-through">¥{Number(formData.priceBefore).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-200 pb-3">
                                        <span className="text-gray-500 font-bold">価格 (変更後)</span>
                                        <span className="text-emerald-600 font-black">¥{Number(formData.priceAfter).toLocaleString()}</span>
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
                                    <button onClick={handleFinalSubmit} disabled={isSubmitting} className="w-full py-5 bg-[#53b69b] text-white font-bold text-xl rounded-2xl shadow-lg shadow-emerald-100 hover:bg-[#45a089] transition-all flex items-center justify-center gap-3 font-['Outfit']">
                                        {isSubmitting ? '更新中...' : '情報を更新する (Enter)'}
                                    </button>
                                    <button onClick={() => setIsConfirming(false)} disabled={isSubmitting} className="w-full py-5 bg-gray-100 text-gray-600 font-bold text-xl rounded-2xl hover:bg-gray-200 transition-all font-['Outfit']">
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

export default EditIngredientPage;
