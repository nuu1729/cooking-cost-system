import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { prepApi } from '@/api';
import { Ingredient, PrepItem, CreatePrepRequest } from '../../types';
import './prep.scss';

const PrepPage: React.FC = () => {
    const navigate = useNavigate();

    // --- State: 左カラム ---
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<Ingredient[]>([]);
    const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [amountError, setAmountError] = useState('');
    const [calculatedCost, setCalculatedCost] = useState<number>(0);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isEditing, setIsEditing] = useState<string | null>(null);

    // --- State: 右カラム ---
    const [prepName, setPrepName] = useState('');
    const [yieldAmount, setYieldAmount] = useState<string>('');
    const [yieldAmountError, setYieldAmountError] = useState('');
    const [items, setItems] = useState<PrepItem[]>([]);
    const [totalCost, setTotalCost] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchParams] = useSearchParams();

    // --- Effects ---
    useEffect(() => {
        const id = searchParams.get('id');
        if (id) {
            (async () => {
                try {
                    const res = await prepApi.getById(Number(id));
                    if (res.success && res.data) {
                        const data = res.data;

                        // バックエンドは name / quantity / unit で返す
                        // フロントの state名 (prep_name / yield_amount / yield_unit) と異なるため両方に対応
                        setPrepName(data.prep_name || data.name || '');
                        setYieldAmount(String(data.yield_amount ?? data.quantity ?? 0));

                        // バックエンドは "ingredients" キーで返す
                        // (get_prep が ingredients リストを返す構造)
                        const ingredientsList: any[] = data.items || data.ingredients || [];
                        setItems(ingredientsList.map((it: any) => ({
                            id: Math.random().toString(36).substr(2, 9),
                            ingredient_id: it.ingredient_id,
                            amount: Number(it.amount),
                            unit: it.unit || it.ingredient_unit || '',
                            cost: Number(it.cost),
                            ingredient: it.ingredient || {
                                id: it.ingredient_id,
                                name: it.ingredient_name || '(不明)',
                                store: it.ingredient_store || it.store || '-',
                                unit: it.ingredient_unit || '',
                                price: it.ingredient_price ?? 0,
                                quantity: it.ingredient_quantity ?? 1,
                                unit_price: it.ingredient_unit_price ?? 0,
                            }
                        })));
                    }
                } catch (e) {
                    console.error('Failed to load prep by ID', e);
                }
            })();
        }
    }, [searchParams]);

    useEffect(() => {
        const fetch = async () => {
            if (searchTerm.length < 1) { setSuggestions([]); return; }
            try {
                const res = await prepApi.searchIngredients(searchTerm);
                if (res.success && res.data) setSuggestions(res.data);
            } catch (e) { console.error(e); }
        };
        const t = setTimeout(fetch, 300);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        const n = parseFloat(amount);
        if (selectedIngredient && !isNaN(n) && n > 0) {
            const unitPrice = selectedIngredient.price / selectedIngredient.quantity;
            setCalculatedCost(Math.round(unitPrice * n));
        } else {
            setCalculatedCost(0);
        }
    }, [selectedIngredient, amount]);

    useEffect(() => {
        setTotalCost(items.reduce((s, i) => s + i.cost, 0));
    }, [items]);

    // --- Handlers ---
    const handleSelectIngredient = (ing: Ingredient) => {
        setSelectedIngredient(ing);
        setSearchTerm(ing.name);
        setShowSuggestions(false);
    };

    const handleAddItem = () => {
        const n = parseFloat(amount);
        if (!selectedIngredient) { toast.error('食材を選択してください'); return; }
        if (amount === '' || !/^\d+(\.\d+)?$/.test(amount)) {
            setAmountError('半角数字で入力してください'); return;
        }
        if (n <= 0) { setAmountError('0より大きい値を入力してください'); return; }
        setAmountError('');

        if (!isEditing) {
            const duplicate = items.find(i => i.ingredient_id === selectedIngredient.id);
            if (duplicate) {
                toast.error(`「${selectedIngredient.name}」はすでにリストに追加されています`);
                return;
            }
        }

        const newItem: PrepItem = {
            id: isEditing || Math.random().toString(36).substr(2, 9),
            ingredient_id: selectedIngredient.id!,
            amount: n,
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
        setSearchTerm(''); setSelectedIngredient(null); setAmount(''); setCalculatedCost(0);
    };

    const handleEditItem = (item: PrepItem) => {
        setIsEditing(item.id!);
        setSelectedIngredient(item.ingredient!);
        setSearchTerm(item.ingredient!.name);
        setAmount(String(item.amount));
        setAmountError('');
    };

    const handleDeleteItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
        toast.success('削除しました');
    };

    const handleConfirm = () => {
        if (!prepName) { toast.error('仕込み名を入力してください'); return; }
        if (yieldAmount === '' || !/^\d+(\.\d+)?$/.test(yieldAmount)) {
            setYieldAmountError('半角数字で入力してください');
            toast.error('仕込み量を正しく入力してください'); return;
        }
        if (parseFloat(yieldAmount) <= 0) {
            setYieldAmountError('0より大きい値を入力してください');
            toast.error('仕込み量を正しく入力してください'); return;
        }
        if (items.length === 0) { toast.error('食材を1件以上追加してください'); return; }
        setYieldAmountError('');
        setShowConfirmModal(true);
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        const request: CreatePrepRequest = {
            prep_name: prepName,
            yield_amount: parseFloat(yieldAmount),
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
            const editId = searchParams.get('id');
            const res = editId
                ? await prepApi.update(Number(editId), request)
                : await prepApi.create(request);
            if (res.success) {
                toast.success(editId ? '仕込みを更新しました' : '仕込みを登録しました');
                setShowConfirmModal(false);
                navigate('/list', { state: { tab: 'preps' } });
            }
        } catch (e) {
            console.error('Failed to save prep', e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            className="prep-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="prep-layout">

                {/* ===================== 左カラム ===================== */}
                <aside className="prep-left">
                    {/* ヘッダー */}
                    <div className="prep-header">
                        <div className="prep-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="prep-title">仕込み</h1>
                            <p className="prep-desc">登録した食材を選択して追加してください。</p>
                        </div>
                    </div>

                    {/* 商品名（検索） */}
                    <div className="form-block">
                        <label className="form-label">商品名（検索）</label>
                        <div className="input-wrap">
                            <input
                                type="text"
                                className="p-input"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
                                onFocus={() => setShowSuggestions(true)}
                                placeholder="例：トマト"
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="suggest-list">
                                    {suggestions.map(ing => (
                                        <li
                                            key={ing.id}
                                            className="suggest-item"
                                            onMouseDown={() => handleSelectIngredient(ing)}
                                        >
                                            <span className="si-name">{ing.name}</span>
                                            <span className="si-meta">{ing.store} / ¥{(ing.price / ing.quantity).toFixed(1)}/{ing.unit}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* 量 */}
                    <div className="form-block">
                        <label className="form-label">量</label>
                        <div className="amount-row">
                            <input
                                type="text"
                                inputMode="decimal"
                                className={`p-input p-input--num${amountError ? ' p-input--err' : ''}`}
                                value={amount}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (v === '' || /^\d*\.?\d*$/.test(v)) { setAmount(v); setAmountError(''); }
                                }}
                                placeholder="0"
                            />
                            <div className="unit-pill">
                                <span>{selectedIngredient?.unit || ''}</span>
                            </div>
                        </div>
                        {amountError && <p className="form-err">{amountError}</p>}
                    </div>

                    {/* 値段 */}
                    <div className="form-block">
                        <label className="form-label">値段</label>
                        <div className="price-row">
                            <span className="yen">¥</span>
                            <input
                                type="text"
                                className="p-input p-input--num p-input--readonly"
                                value={calculatedCost === 0 ? '' : calculatedCost.toLocaleString()}
                                readOnly
                                placeholder="200"
                                tabIndex={-1}
                            />
                        </div>
                    </div>

                    {/* 追加ボタン */}
                    <button
                        className="add-btn"
                        onClick={handleAddItem}
                        disabled={!selectedIngredient || amount === '' || parseFloat(amount) <= 0}
                    >
                        {isEditing ? '変更を保存' : 'リスト\n追加'}
                    </button>

                    {isEditing && (
                        <button className="cancel-btn" onClick={() => { setIsEditing(null); setSearchTerm(''); setSelectedIngredient(null); setAmount(''); }}>
                            キャンセル
                        </button>
                    )}
                </aside>

                {/* ===================== 右カラム ===================== */}
                <main className="prep-right">
                    {/* 食材カードエリア */}
                    <div className="cards-area">
                        {items.length === 0 ? (
                            <div className="cards-empty">食材が追加されていません</div>
                        ) : (
                            <AnimatePresence>
                                <div className="cards-grid">
                                    {items.map(item => (
                                        <motion.div
                                            key={item.id}
                                            className={`item-card${isEditing === item.id ? ' item-card--active' : ''}`}
                                            initial={{ opacity: 0, scale: 0.92 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.88 }}
                                            layout
                                        >
                                            <div className="ic-body">
                                                <p className="ic-name">{item.ingredient?.name}</p>
                                                <p className="ic-meta">{item.amount}{item.unit}　{item.ingredient?.store}</p>
                                                <p className="ic-cost">¥{item.cost.toLocaleString()}</p>
                                            </div>
                                            <div className="ic-actions">
                                                <button className="ic-btn ic-btn--edit" onClick={() => handleEditItem(item)} title="編集">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width={14}>
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </button>
                                                <button className="ic-btn ic-btn--del" onClick={() => handleDeleteItem(item.id!)} title="削除">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width={14}>
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                        <path d="M10 11v6M14 11v6" />
                                                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </AnimatePresence>
                        )}
                    </div>

                    {/* 下部バー */}
                    <div className="bottom-bar">
                        {/* 左：仕込み名 + 仕込み量 */}
                        <div className="bottom-fields">
                            <div className="form-block">
                                <label className="form-label">仕込み名</label>
                                <input
                                    type="text"
                                    className="p-input"
                                    value={prepName}
                                    onChange={(e) => setPrepName(e.target.value)}
                                    placeholder="例：ごはん中、合わせ味噌"
                                />
                            </div>
                            <div className="form-block">
                                <label className="form-label">仕込み量</label>
                                <div className="amount-row">
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        className={`p-input p-input--num${yieldAmountError ? ' p-input--err' : ''}`}
                                        value={yieldAmount}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            if (v === '' || /^\d*\.?\d*$/.test(v)) { setYieldAmount(v); setYieldAmountError(''); }
                                        }}
                                        placeholder="0"
                                    />
                                    <div className="unit-pill">
                                        <span>g</span>
                                    </div>
                                </div>
                                {yieldAmountError && <p className="form-err">{yieldAmountError}</p>}
                            </div>
                        </div>

                        {/* 右：合計金額 + 確定ボタン */}
                        <div className="bottom-right">
                            <p className="total-text">合計金額：<span>¥{totalCost.toLocaleString()}</span></p>
                            <button
                                className="confirm-btn"
                                onClick={handleConfirm}
                                disabled={!prepName || yieldAmount === '' || parseFloat(yieldAmount) <= 0 || items.length === 0}
                            >
                                仕込み確定
                            </button>
                        </div>
                    </div>
                </main>

            </div>

            {/* ===================== 確認モーダル ===================== */}
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="modal-overlay">
                        <motion.div
                            className="modal"
                            initial={{ scale: 0.92, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 16 }}
                        >
                            <div className="modal-head">
                                <h2>仕込み内容の確認</h2>
                                <button className="modal-x" onClick={() => setShowConfirmModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="modal-row"><span className="ml">仕込み名</span><span className="mv mv--green">{prepName}</span></div>
                                <div className="modal-row"><span className="ml">仕込み量</span><span className="mv">{yieldAmount} g</span></div>
                                <div className="modal-row"><span className="ml">合計コスト</span><span className="mv mv--bold">¥ {totalCost.toLocaleString()}</span></div>
                                <div className="modal-items">
                                    <p className="modal-items-ttl">構成食材 ({items.length}件)</p>
                                    <div className="modal-items-list">
                                        {items.map(item => (
                                            <div key={item.id} className="modal-item">
                                                <span className="mi-name">{item.ingredient?.name}</span>
                                                <span className="mi-detail">{item.amount}{item.unit} / ¥{item.cost.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-foot">
                                <button className="modal-cancel" onClick={() => setShowConfirmModal(false)} disabled={isSubmitting}>キャンセル</button>
                                <button className="modal-submit" onClick={handleFinalSubmit} disabled={isSubmitting}>
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
