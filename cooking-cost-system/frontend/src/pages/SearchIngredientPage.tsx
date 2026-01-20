import React, { useState, useEffect, useCallback } from 'react';
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

interface SearchFilters {
    name: string;
    isLowestPrice: boolean;
    isNormalizeQuantity: boolean;
    isNormalizePiece: boolean;
    pieceToGram: string;
}

const SearchIngredientPage: React.FC = () => {
    const [filters, setFilters] = useState<SearchFilters>({
        name: '',
        isLowestPrice: true,
        isNormalizeQuantity: false,
        isNormalizePiece: false,
        pieceToGram: '0'
    });

    const [results, setResults] = useState<Ingredient[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [lastTranscript, setLastTranscript] = useState('');

    // Fetch results from DB
    const fetchResults = useCallback(async () => {
        if (filters.name.trim() === '') {
            setResults([]);
            return;
        }
        setIsLoading(true);
        try {
            const response = await ingredientApi.getAll({
                name: filters.name,
                sortBy: filters.isLowestPrice ? 'unit_price' : 'created_at',
                sortOrder: 'ASC'
            });
            if (response.success && response.data) {
                setResults(response.data);
            }
        } catch (error) {
            console.error('Search failed:', error);
            toast.error('検索に失敗しました');
        } finally {
            setIsLoading(false);
        }
    }, [filters.name, filters.isLowestPrice]);

    useEffect(() => {
        const timer = setTimeout(fetchResults, 500);
        return () => clearTimeout(timer);
    }, [fetchResults]);

    const handleFilterChange = (key: keyof SearchFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Voice Input
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
            // Clean up transcript for search
            const searchQuery = transcript.replace(/を検索|で検索|探し|見つけ/g, '').trim();
            setFilters(prev => ({ ...prev, name: searchQuery }));
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };

    // Custom Icon: Search + Magnifying Glass + Ingredients
    const IngredientSearchIcon = () => (
        <svg viewBox="0 0 100 100" className="w-8 h-8 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Magnifying Glass */}
            <circle cx="45" cy="45" r="25" stroke="currentColor" strokeWidth="6" />
            <line x1="63" y1="63" x2="85" y2="85" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
            {/* Tiny Vegetable icon inside glass */}
            <path d="M40 40 Q45 35 50 40 Q55 45 50 50 Q45 55 40 50 Z" fill="currentColor" opacity="0.6" />
        </svg>
    );

    // Helper to calculate unit price for display/sorting
    const getUnitPrice = (item: Ingredient) => {
        let price = item.price;
        let quantity = item.quantity;

        // If normalize piece is ON and item is '個'
        if (filters.isNormalizePiece && item.unit === '個') {
            const weight = parseFloat(filters.pieceToGram) || 0;
            if (weight > 0) {
                quantity = quantity * weight; // total grams
                // we treat it as grams now
            }
        }

        return price / quantity;
    };

    // Sort and highlight logic
    const processedResults = [...results].sort((a, b) => {
        if (filters.isLowestPrice) {
            return getUnitPrice(a) - getUnitPrice(b);
        }
        return 0; // maintain default search order if not sorting by price
    });

    const lowestPriceId = processedResults.length > 0 ? processedResults[0].id : null;

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[#f9f9f9] py-16 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-[#10b981] rounded-xl flex items-center justify-center shadow-lg shadow-green-200/50">
                            <IngredientSearchIcon />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 font-['Outfit']">食材を検索</h1>
                            <div className="mt-4">
                                <label className="text-sm font-bold text-gray-500 ml-1">商品名</label>
                                <input
                                    type="text"
                                    value={filters.name}
                                    onChange={(e) => handleFilterChange('name', e.target.value)}
                                    placeholder="例：トマト"
                                    className="w-full md:w-80 px-6 py-4 bg-[#f0f0f0] border-2 border-transparent focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-2xl transition-all outline-none text-lg mt-1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Search Criteria Panel - Premium Card */}
                    <div className="w-full md:w-auto bg-[#e0e0e0] rounded-[2.5rem] p-8 shadow-inner flex flex-col md:flex-row gap-8 items-center border border-white/20">
                        <div className="space-y-3">
                            <h3 className="text-gray-700 font-black text-lg mb-4 font-['Outfit']">検索条件</h3>
                            <div className="space-y-4">
                                <Switch
                                    label="最安値"
                                    active={filters.isLowestPrice}
                                    onClick={() => handleFilterChange('isLowestPrice', !filters.isLowestPrice)}
                                />
                                <Switch
                                    label="量を揃える"
                                    active={filters.isNormalizeQuantity}
                                    onClick={() => handleFilterChange('isNormalizeQuantity', !filters.isNormalizeQuantity)}
                                />
                                <Switch
                                    label="1個を別の単位に揃える"
                                    active={filters.isNormalizePiece}
                                    onClick={() => handleFilterChange('isNormalizePiece', !filters.isNormalizePiece)}
                                />
                            </div>
                        </div>

                        {/* Unit Conversion Inputs */}
                        <div className="flex items-center gap-4 bg-white/40 p-4 rounded-3xl self-end">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-gray-700">1</span>
                                <span className="font-bold text-gray-500">個</span>
                            </div>
                            <div className="w-8 h-[2px] bg-gray-400"></div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={filters.pieceToGram}
                                    onChange={(e) => handleFilterChange('pieceToGram', e.target.value)}
                                    className="w-20 bg-white border-2 border-transparent focus:border-emerald-500 rounded-xl px-2 py-1 text-center font-bold text-gray-700 outline-none"
                                />
                                <span className="font-bold text-gray-500">g</span>
                            </div>
                        </div>
                    </div>

                    {/* Voice Input Button */}
                    <motion.button
                        onClick={startListening}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        animate={isListening ? { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1.5 } } : {}}
                        className={`py-8 px-12 rounded-[2rem] text-white flex flex-col items-center justify-center gap-3 shadow-xl transition-all duration-300 ${isListening ? 'bg-red-500' : 'bg-gradient-to-r from-[#a855f7] to-[#ec4899]'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <span className="text-xl font-bold font-['Outfit']">{isListening ? '聴いています...' : '音声で入力'}</span>
                    </motion.button>
                </div>

                {/* Last Transcript Display */}
                <AnimatePresence>
                    {lastTranscript && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center gap-3 mb-8 max-w-md"
                        >
                            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                            </div>
                            <p className="text-purple-700 italic text-sm font-medium leading-relaxed font-['Outfit']">
                                "{lastTranscript}" を検索しています...
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

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {processedResults.map((item, index) => (
                        <CandidateCard
                            key={item.id}
                            item={item}
                            index={index + 1}
                            isOptimal={item.id === lowestPriceId}
                            normalize={filters.isNormalizeQuantity}
                            getUnitPrice={getUnitPrice}
                        />
                    ))}
                    {processedResults.length === 0 && !isLoading && filters.name && (
                        <div className="col-span-full py-20 text-center">
                            <p className="text-gray-400 text-xl font-bold">該当する食材が見つかりませんでした</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Custom Switch Component
const Switch: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <div className="flex items-center gap-4 cursor-pointer group" onClick={onClick}>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-200' : 'bg-white border-gray-400 group-hover:border-gray-600'}`}>
            {active && <div className="w-2 h-2 bg-white rounded-full"></div>}
        </div>
        <span className={`font-bold transition-all ${active ? 'text-gray-800' : 'text-gray-500'}`}>{label}</span>
    </div>
);

// Candidate Card Component
const CandidateCard: React.FC<{
    item: Ingredient;
    index: number;
    isOptimal: boolean;
    normalize: boolean;
    getUnitPrice: (item: Ingredient) => number;
}> = ({ item, index, isOptimal, normalize, getUnitPrice }) => {
    const unitPrice = getUnitPrice(item);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative p-8 rounded-[2.5rem] bg-[#e0e0e0] shadow-xl border-4 transition-all ${isOptimal ? 'border-orange-500/50 shadow-orange-200' : 'border-transparent'}`}
        >
            {isOptimal && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-6 py-1 rounded-full text-xs font-black tracking-widest uppercase">
                    Best Value
                </div>
            )}

            <h3 className="text-2xl font-black text-gray-800 mb-8 font-['Outfit'] text-center">
                候補 {index}
            </h3>

            <div className="space-y-6">
                <div>
                    <label className="text-xs font-bold text-gray-500 ml-1">商品名</label>
                    <div className="bg-[#f0f0f0] rounded-2xl px-6 py-3 text-gray-700 font-bold overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.name}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 ml-1">価格</label>
                    <div className="bg-[#f0f0f0] rounded-2xl px-6 py-3 flex justify-between items-center">
                        <span className="text-gray-400">¥</span>
                        <span className="text-gray-800 font-black text-xl">{item.price.toLocaleString()}</span>
                    </div>
                    {normalize && (
                        <div className="mt-2 text-right">
                            <span className="text-emerald-600 font-bold text-sm">
                                (¥{Math.round(unitPrice * 100).toLocaleString()} / 100{item.unit === '個' ? '単位' : item.unit})
                            </span>
                        </div>
                    )}
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 ml-1">購入先</label>
                    <div className="bg-[#f0f0f0] rounded-2xl px-6 py-3 text-gray-700 font-bold overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.store}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SearchIngredientPage;
