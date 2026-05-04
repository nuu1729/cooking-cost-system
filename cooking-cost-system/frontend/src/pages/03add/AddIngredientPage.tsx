import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ingredientApi, genreApi } from '@/api';
import type { Genre } from '@/api';
import toast from 'react-hot-toast';
import BarcodeScanner from '@/components/features/BarcodeScanner';

// Speech Recognition Types (for TypeScript)
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface FormData {
    name: string;
    price: string;
    quantity: string;
    unit: 'ml' | 'g' | '個';
    supplier: string;
    genre_id: string;
}

const AddIngredientPage: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        price: '',
        quantity: '',
        unit: 'g',
        supplier: '',
        genre_id: ''
    });

    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
    const [isConfirming, setIsConfirming] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Genre State
    const [genres, setGenres] = useState<Genre[]>([]);

    // Voice Input State
    const [isListening, setIsListening] = useState(false);
    const [lastTranscript, setLastTranscript] = useState('');

    // Barcode Scanner State
    const [showScanner, setShowScanner] = useState(false);

    useEffect(() => {
        genreApi.getAll().then(res => {
            if (res.success && res.data) setGenres(res.data);
        }).catch(() => {});
    }, []);

    // 半角数字のみ許可するバリデーション関数
    const isHalfWidthNumber = (value: string) => /^\d+(\.\d+)?$/.test(value);

    // Handle form validation
    const validate = () => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};
        let isValid = true;

        if (!formData.name.trim()) {
            newErrors.name = '入力してください';
            isValid = false;
        }
        if (!formData.price.trim()) {
            newErrors.price = '入力してください';
            isValid = false;
        } else if (!isHalfWidthNumber(formData.price)) {
            newErrors.price = '半角数字で入力してください';
            isValid = false;
        }
        if (!formData.quantity.trim()) {
            newErrors.quantity = '入力してください';
            isValid = false;
        } else if (!isHalfWidthNumber(formData.quantity)) {
            newErrors.quantity = '半角数字で入力してください';
            isValid = false;
        }
        if (!formData.supplier.trim()) {
            newErrors.supplier = '入力してください';
            isValid = false;
        }
        if (!formData.genre_id) {
            newErrors.genre_id = '選択してください';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // 数値フィールドは半角数字・ドット以外の入力を拒否
        if (name === 'price' || name === 'quantity') {
            if (value !== '' && !/^\d*\.?\d*$/.test(value)) return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handlePreSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (validate()) {
            setIsConfirming(true);
        }
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        try {
            // API call to backend
            const response = await ingredientApi.create({
                name: formData.name,
                store: formData.supplier,
                price: parseFloat(formData.price),
                quantity: parseFloat(formData.quantity),
                unit: formData.unit,
                genre_id: parseInt(formData.genre_id)
            });

            if (response.success) {
                toast.success('食材をデータベースに登録しました！');
                setFormData({ name: '', price: '', quantity: '', unit: 'g', supplier: '', genre_id: '' });
                setErrors({});
            } else {
                toast.error(response.message || '登録に失敗しました');
            }
        } catch (error: any) {
            console.error('Registration failed:', error);
            // Error is handled by apiClient interceptor (toast.error)
        } finally {
            setIsSubmitting(false);
            setIsConfirming(false);
        }
    };

    // Voice Input Parser
    const parseVoiceData = useCallback((text: string) => {
        const data = { ...formData };

        // Typical phrases: "トマト 500円 300グラム コスモス"
        const cleanText = text.replace(/、|。/g, ' ').trim();
        const words = cleanText.split(/\s+/);

        words.forEach((word) => {
            const priceMatch = word.match(/(\d+)円/);
            if (priceMatch) {
                data.price = priceMatch[1];
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
            !w.includes('円') &&
            !w.includes('g') && !w.includes('グラム') &&
            !w.includes('ml') && !w.includes('ミリ') &&
            !w.includes('個')
        );

        if (nonDataWords.length >= 1) {
            data.name = nonDataWords[0];
        }
        if (nonDataWords.length >= 2) {
            data.supplier = nonDataWords[nonDataWords.length - 1];
        }

        setFormData(data);
        (Object.keys(data) as Array<keyof FormData>).forEach(key => {
            if (data[key] !== '') {
                setErrors(prev => ({ ...prev, [key]: false }));
            }
        });
    }, [formData]);

    // Speech Recognition Setup
    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error('お使いのブラウザは音声認識に対応していません。');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'ja-JP';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setLastTranscript(transcript);
            parseVoiceData(transcript);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    // Barcode detected callback
    const handleBarcodeDetected = useCallback((productName: string, _barcode: string) => {
        setShowScanner(false);
        setFormData(prev => ({ ...prev, name: productName }));
        setErrors(prev => ({ ...prev, name: undefined }));
        toast.success(`「${productName}」を商品名に入力しました`);
    }, []);

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

                        {/* Last Transcript Display */}
                        <AnimatePresence>
                            {lastTranscript && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                    </div>
                                    <p className="text-purple-700 italic text-sm font-medium leading-relaxed font-['Outfit']">
                                        "{lastTranscript}"
                                    </p>
                                    <button
                                        onClick={() => setLastTranscript('')}
                                        className="ml-auto text-purple-300 hover:text-purple-500 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

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
                                <label className="text-lg font-bold text-gray-700 ml-1 flex justify-between" style={{ maxWidth: 400 }}>
                                    <span>価格</span>
                                    {errors.price && <span className="text-sm text-red-500 font-normal">{errors.price}</span>}
                                </label>
                                <div className="relative" style={{ maxWidth: 400 }}>
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 text-lg">¥</span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        placeholder="300"
                                        className={`w-full pl-12 pr-6 py-4 bg-[#f0f0f0] border-2 rounded-2xl transition-all outline-none text-lg text-right ${errors.price ? 'border-red-300 ring-2 ring-red-100 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-emerald-500'}`}
                                    />
                                </div>
                            </div>

                            {/* 量 & 単位 */}
                            <div className="space-y-2">
                                <label className="text-lg font-bold text-gray-700 ml-1 flex justify-between" style={{ maxWidth: 400 }}>
                                    <span>量</span>
                                    {errors.quantity && <span className="text-sm text-red-500 font-normal">{errors.quantity}</span>}
                                </label>
                                <div className="flex gap-4" style={{ maxWidth: 400 }}>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className={`flex-1 px-6 py-4 bg-[#f0f0f0] border-2 rounded-2xl transition-all outline-none text-lg text-right ${errors.quantity ? 'border-red-300 ring-2 ring-red-100 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-emerald-500'}`}
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

                            {/* ジャンル */}
                            <div className="space-y-2">
                                <label className="text-lg font-bold text-gray-700 ml-1 flex justify-between">
                                    <span>ジャンル</span>
                                    {errors.genre_id && <span className="text-sm text-red-500 font-normal">選択してください</span>}
                                </label>
                                <div className="relative">
                                    <select
                                        name="genre_id"
                                        value={formData.genre_id}
                                        onChange={handleChange}
                                        className={`w-full px-6 py-4 bg-[#f0f0f0] border-2 rounded-2xl transition-all outline-none appearance-none cursor-pointer text-lg ${errors.genre_id ? 'border-red-300 ring-2 ring-red-100 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-emerald-500'}`}
                                    >
                                        <option value="">選択してください</option>
                                        {genres.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
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
                            <div className="relative">
                                {isListening && (
                                    <span className="absolute inset-0 rounded-full animate-ping bg-red-200 opacity-75"></span>
                                )}
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 relative z-10 ${isListening ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold font-['Outfit']">
                                {isListening ? '聴いています...' : '音声で入力'}
                            </span>
                        </motion.button>

                        <motion.button
                            onClick={() => setShowScanner(true)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-8 rounded-[2rem] bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white flex flex-col items-center justify-center gap-3 shadow-xl shadow-orange-200 hover:shadow-orange-300 transition-all duration-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5V16M4 8h4m8-4h4M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4z" />
                            </svg>
                            <span className="text-xl font-bold font-['Outfit']">バーコードで入力</span>
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

                        <div className="bg-white/50 border border-gray-100 rounded-2xl p-6 text-sm text-gray-500 leading-relaxed shadow-sm">
                            <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                音声入力のコツ
                            </h4>
                            「トマト、500円、300グラム、コスモス」のように連続して話すと自動で各項目に入力されます。
                        </div>
                    </div>
                </div>
            </div>

            {/* Barcode Scanner Modal */}
            {showScanner && (
                <BarcodeScanner
                    onDetected={handleBarcodeDetected}
                    onClose={() => setShowScanner(false)}
                />
            )}

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
                            className="relative bg-white w-full max-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-10 space-y-8">
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-black text-gray-800 font-['Outfit']">登録内容の確認</h3>
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
                                    <div className="flex justify-between border-b border-gray-200 pb-3">
                                        <span className="text-gray-500 font-bold">購入先</span>
                                        <span className="text-gray-800 font-black">{formData.supplier}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 font-bold">ジャンル</span>
                                        <span className="text-gray-800 font-black">
                                            {genres.find(g => g.id.toString() === formData.genre_id)?.name || '未選択'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleFinalSubmit}
                                        disabled={isSubmitting}
                                        className="w-full py-5 bg-[#53b69b] text-white font-bold text-xl rounded-2xl shadow-lg shadow-emerald-100 hover:bg-[#45a089] transition-all flex items-center justify-center gap-3 font-['Outfit']"
                                    >
                                        {isSubmitting ? '登録中...' : '登録を確定する (Enter)'}
                                    </button>
                                    <button
                                        onClick={() => setIsConfirming(false)}
                                        disabled={isSubmitting}
                                        className="w-full py-5 bg-gray-100 text-gray-600 font-bold text-xl rounded-2xl hover:bg-gray-200 transition-all font-['Outfit']"
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
