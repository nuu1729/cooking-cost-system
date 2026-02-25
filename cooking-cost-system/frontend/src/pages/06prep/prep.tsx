import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { prepApi } from '../../api/api';
import { Ingredient, PrepItem, CreatePrepRequest } from '../../types';
import './prep.scss';

const PrepPage: React.FC = () => {
    const navigate = useNavigate();

    // --- State: 左カラム (入力フォーム) ---
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<Ingredient[]>([]);
    const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
    const [amount, setAmount] = useState<number | ''>('');
    const [calculatedCost, setCalculatedCost] = useState<number>(0);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isEditing, setIsEditing] = useState<string | null>(null); // 編集中のアイテムID

    // --- State: 右カラム (リスト) ---
    const [prepName, setPrepName] = useState('');
    const [yieldAmount, setYieldAmount] = useState<number | ''>('');
    const [items, setItems] = useState<PrepItem[]>([]);
    const [totalCost, setTotalCost] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Effects ---
    
    // インクリメンタル検索
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (searchTerm.length < 1) {
                setSuggestions([]);
                return;
            }
            try {
                const response = await prepApi.searchIngredients(searchTerm);
                if (response.success && response.data) {
                    setSuggestions(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch suggestions', error);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // 値段の動的算出
    useEffect(() => {
        if (selectedIngredient && typeof amount === 'number' && amount > 0) {
            // 単価算出: price / quantity
            const unitPrice = selectedIngredient.price / selectedIngredient.quantity;
            setCalculatedCost(Math.round(unitPrice * amount));
        } else {
            setCalculatedCost(0);
        }
    }, [selectedIngredient, amount]);

    // 合計金額の更新
    useEffect(() => {
        const total = items.reduce((sum, item) => sum + item.cost, 0);
        setTotalCost(total);
    }, [items]);

    // --- Handlers ---

    const handleSelectIngredient = (ing: Ingredient) => {
        setSelectedIngredient(ing);
        setSearchTerm(ing.name);
        setShowSuggestions(false);
    };

    const handleAddItem = () => {
        if (!selectedIngredient || amount === '' || amount <= 0) {
            toast.error('有効な食材と量を入力してください');
            return;
        }

        const newItem: PrepItem = {
            id: isEditing || Math.random().toString(36).substr(2, 9),
            ingredient_id: selectedIngredient.id!,
            amount: Number(amount),
            unit: selectedIngredient.unit,
            cost: calculatedCost,
            ingredient: selectedIngredient
        };

        if (isEditing) {
            setItems(prev => prev.map(item => item.id === isEditing ? newItem : item));
            setIsEditing(null);
            toast.success('更新しました');
        } else {
            setItems(prev => [...prev, newItem]);
            toast.success('リストに追加しました');
        }

        // フォームクリア
        setSearchTerm('');
        setSelectedIngredient(null);
        setAmount('');
        setCalculatedCost(0);
    };

    const handleEditItem = (item: PrepItem) => {
        setIsEditing(item.id!);
        setSelectedIngredient(item.ingredient!);
        setSearchTerm(item.ingredient!.name);
        setAmount(item.amount);
        // calculatedCostはuseEffectで自動計算される
    };

    const handleDeleteItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
        toast.success('削除しました');
    };

    const handleConfirm = () => {
        if (!prepName || yieldAmount === '' || yieldAmount <= 0) {
            toast.error('仕込み名と仕込み量を入力してください');
            return;
        }
        if (items.length === 0) {
            toast.error('食材を1件以上追加してください');
            return;
        }
        setShowConfirmModal(true);
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        const request: CreatePrepRequest = {
            prep_name: prepName,
            yield_amount: Number(yieldAmount),
            yield_unit: 'g',
            total_cost: totalCost,
            items: items.map(item => ({
                ingredient_id: item.ingredient_id,
                amount: item.amount,
                unit: item.unit,
                cost: item.cost
            }))
        };

        try {
            const response = await prepApi.create(request);
            if (response.success) {
                toast.success('仕込みを登録しました');
                setShowConfirmModal(false);
                navigate('/');
            }
        } catch (error) {
            console.error('Failed to create prep', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div 
            className="prep-page-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="prep-container">
                {/* 左カラム */}
                <section className="left-column">
                    <div className="header">
                        <div className="icon-wrapper">
                            <img src="/icons/mid_icon.png" alt="仕込みアイコン" />
                        </div>
                        <div className="title-area">
                            <h1>仕込み</h1>
                            <p>登録した食材を選択して追加してください。</p>
                        </div>
                    </div>

                    <div className="search-section">
                        {/* 商品名検索 */}
                        <div className="form-group relative">
                            <label>商品名（検索）</label>
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setShowSuggestions(true)}
                                placeholder="例：トマト"
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="suggestions">
                                    {suggestions.map(ing => (
                                        <div 
                                            key={ing.id} 
                                            className="suggestion-item"
                                            onClick={() => handleSelectIngredient(ing)}
                                        >
                                            <span className="name">{ing.name}</span>
                                            <span className="meta">{ing.store} / ¥{(ing.price / ing.quantity).toFixed(2)}/ {ing.unit}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 量 & 単位 */}
                        <div className="form-group">
                            <label>量</label>
                            <div className="amount-unit">
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                    min="0"
                                    placeholder="0"
                                />
                                <div className="unit-display">
                                    {selectedIngredient?.unit || 'g'}
                                </div>
                            </div>
                        </div>

                        {/* 値段表示 */}
                        <div className="price-display">
                            <span className="label">値段</span>
                            <span className="value">¥ {calculatedCost.toLocaleString()}</span>
                        </div>

                        <button 
                            className="add-button" 
                            onClick={handleAddItem}
                            disabled={!selectedIngredient || amount === '' || amount <= 0}
                        >
                            {isEditing ? '変更を保存' : '仕込みに追加'}
                        </button>
                        {isEditing && (
                            <button className="text-sm text-gray-400 mt-2 underline" onClick={() => setIsEditing(null)}>キャンセル</button>
                        )}
                    </div>
                </section>

                {/* 右カラム */}
                <section className="right-column">
                    <div className="composition-list">
                        {items.length === 0 ? (
                            <div className="empty-msg">
                                食材が追加されていません
                            </div>
                        ) : (
                            <AnimatePresence>
                                {items.map(item => (
                                    <motion.div 
                                        key={item.id}
                                        className="ingredient-card"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                    >
                                        <div className="info">
                                            <h3>{item.ingredient?.name}</h3>
                                            <p>
                                                <span className="amount">{item.amount}{item.unit}</span> 
                                                <span className="shop"> ({item.ingredient?.store})</span>
                                                <span className="cost"> - ¥{item.cost.toLocaleString()}</span>
                                            </p>
                                        </div>
                                        <div className="actions">
                                            <button className="edit" onClick={() => handleEditItem(item)}>
                                                <img src="/icons/edit_icon.png" alt="編集" style={{ width: 16 }} />
                                            </button>
                                            <button className="delete" onClick={() => handleDeleteItem(item.id!)}>
                                                <img src="/icons/delete_icon.png" alt="削除" style={{ width: 16 }} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>

                    <div className="summary-section">
                        <div className="bottom-layout">
                            <div className="left-side">
                                <div className="form-group">
                                    <label>仕込み名</label>
                                    <input 
                                        type="text" 
                                        value={prepName}
                                        onChange={(e) => setPrepName(e.target.value)}
                                        placeholder="例：ごはん中、合わせ味噌"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>仕込み量</label>
                                    <div className="amount-wrapper">
                                        <input 
                                            type="number" 
                                            value={yieldAmount}
                                            onChange={(e) => setYieldAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                            min="0"
                                            placeholder="0"
                                        />
                                        <span>g</span>
                                    </div>
                                </div>
                            </div>

                            <div className="right-side">
                                <div className="total-price">
                                    <span className="label">合計金額 :</span>
                                    <span className="value">¥ {totalCost.toLocaleString()}</span>
                                </div>
                                <button 
                                    className="confirm-button"
                                    onClick={handleConfirm}
                                    disabled={!prepName || yieldAmount === '' || yieldAmount <= 0 || items.length === 0}
                                >
                                    仕込み確定
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* 確認モーダル */}
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="modal-overlay">
                        <motion.div 
                            className="confirm-modal"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        >
                            <div className="modal-header">
                                <h2>仕込み内容の確認</h2>
                                <button className="close-btn" onClick={() => setShowConfirmModal(false)}>×</button>
                            </div>
                            
                            <div className="modal-body">
                                <div className="summary-item">
                                    <span className="label">仕込み名</span>
                                    <span className="value primary">{prepName}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="label">仕込み量</span>
                                    <span className="value">{yieldAmount} g</span>
                                </div>
                                <div className="summary-item">
                                    <span className="label">合計コスト</span>
                                    <span className="value highlight">¥ {totalCost.toLocaleString()}</span>
                                </div>

                                <div className="items-preview">
                                    <p className="section-title">構成食材 ({items.length}件)</p>
                                    <div className="mini-list">
                                        {items.map(item => (
                                            <div key={item.id} className="mini-item">
                                                <span className="name">{item.ingredient?.name}</span>
                                                <span className="details">{item.amount}{item.unit} / ¥{item.cost.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button className="cancel-btn" onClick={() => setShowConfirmModal(false)} disabled={isSubmitting}>
                                    キャンセル
                                </button>
                                <button 
                                    className="submit-btn" 
                                    onClick={handleFinalSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? '登録中...' : 'この内容で確定する'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default PrepPage;
