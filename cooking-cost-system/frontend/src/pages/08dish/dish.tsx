import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { dishApi } from '@/api';
import { OhiItem, UnifiedItem } from '../../types';
import './dish.scss';

const DishPage: React.FC = () => {
    const navigate = useNavigate();

    // --- State: 左カラム ---
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<UnifiedItem[]>([]);
    const [selectedPrep, setSelectedPrep] = useState<UnifiedItem | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [amountError, setAmountError] = useState('');
    const [calculatedCost, setCalculatedCost] = useState<number>(0);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isEditing, setIsEditing] = useState<string | null>(null);

    // --- State: 右カラム ---
    const [dishName, setDishName] = useState('');
    const [items, setItems] = useState<OhiItem[]>([]);
    const [totalCost, setTotalCost] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchParams] = useSearchParams();

    // --- 編集モード：URLの ?id=xxx からデータを読み込む ---
    useEffect(() => {
        const id = searchParams.get('id');
        if (id) {
            (async () => {
                try {
                    const res = await dishApi.getById(Number(id));
                    if (res.success && res.data) {
                        const data = res.data as any;

                        // お品名をセット（バックエンドは name で返す）
                        setDishName(data.name || '');

                        // 構成仕込みリストをセット（バックエンドは preps キーで返す）
                        const prepsList: any[] = data.preps || [];
                        setItems(prepsList.map((it: any) => ({
                            id: Math.random().toString(36).substr(2, 9),
                            prep_id: it.prep_id,
                            amount: Number(it.amount),
                            unit: it.prep_unit || 'g',
                            cost: Number(it.cost),
                            prep: {
                                id: it.prep_id,
                                name: it.prep_name || '(不明)',
                                item_type: 2 as const,
                                store: '自家製',
                                price: 0,
                                quantity: 1,
                                unit: it.prep_unit || 'g',
                                unit_price: it.prep_unit_price || 0,
                                genre: it.prep_genre || '',
                            }
                        })));
                    }
                } catch (e) {
                    console.error('Failed to load dish by ID', e);
                }
            })();
        }
    }, [searchParams]);

    // --- Effects ---
    useEffect(() => {
        const fetch = async () => {
            if (searchTerm.length < 1) { setSuggestions([]); return; }
            try {
                const res = await dishApi.searchPreps(searchTerm);
                if (res.success && res.data) setSuggestions(res.data);
            } catch (e) { console.error(e); }
        };
        const t = setTimeout(fetch, 300);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        const n = parseFloat(amount);
        if (selectedPrep && !isNaN(n) && n > 0) {
            setCalculatedCost(Math.round(selectedPrep.unit_price * n));
        } else {
            setCalculatedCost(0);
        }
    }, [selectedPrep, amount]);

    useEffect(() => {
        setTotalCost(items.reduce((s, i) => s + i.cost, 0));
    }, [items]);

    // --- Handlers ---
    const handleSelectPrep = (prep: UnifiedItem) => {
        setSelectedPrep(prep);
        setSearchTerm(prep.name);
        setShowSuggestions(false);
    };

    const handleAddItem = () => {
        const n = parseFloat(amount);
        if (!selectedPrep) { toast.error('仕込みを選択してください'); return; }
        if (amount === '' || !/^\d+(\.\d+)?$/.test(amount)) {
            setAmountError('半角数字で入力してください'); return;
        }
        if (n <= 0) { setAmountError('0より大きい値を入力してください'); return; }
        setAmountError('');

        const newItem: OhiItem = {
            id: isEditing || Math.random().toString(36).substr(2, 9),
            prep_id: selectedPrep.id,
            amount: n,
            unit: selectedPrep.unit,
            cost: calculatedCost,
            prep: selectedPrep
        };

        if (isEditing) {
            setItems(prev => prev.map(item => item.id === isEditing ? newItem : item));
            setIsEditing(null);
            toast.success('更新しました');
        } else {
            setItems(prev => [...prev, newItem]);
            toast.success('リストに追加しました');
        }
        setSearchTerm(''); setSelectedPrep(null); setAmount(''); setCalculatedCost(0);
    };

    const handleEditItem = (item: OhiItem) => {
        setIsEditing(item.id!);
        setSelectedPrep(item.prep!);
        setSearchTerm(item.prep!.name);
        setAmount(String(item.amount));
        setAmountError('');
    };

    const handleDeleteItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
        toast.success('削除しました');
    };

    const handleConfirm = () => {
        if (!dishName.trim()) { toast.error('お品名を入力してください'); return; }
        if (items.length === 0) { toast.error('仕込みを1件以上追加してください'); return; }
        setShowConfirmModal(true);
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        try {
            const res = await dishApi.createOhi({
                name: dishName.trim(),
                total_cost: totalCost,
                items: items.map(item => ({
                    prep_id: item.prep_id,
                    prep_name: item.prep?.name,
                    amount: item.amount,
                    unit: item.unit,
                    cost: item.cost
                }))
            });
            if (res.success) {
                toast.success('お品を登録しました');
                setShowConfirmModal(false);
                navigate('/list', { state: { tab: 'dishes' } });
            }
        } catch (e) {
            console.error('Failed to create dish', e);
            toast.error('登録に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            className="dish-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="dish-layout">

                {/* ===================== 左カラム ===================== */}
                <aside className="dish-left">
                    {/* ヘッダー */}
                    <div className="dish-header">
                        <div className="dish-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="dish-title">お品</h1>
                            <p className="dish-desc">登録した仕込みを選択して追加してください。</p>
                        </div>
                    </div>

                    {/* 仕込み（検索） */}
                    <div className="dish-form-block">
                        <label className="dish-form-label">仕込み（検索）</label>
                        <div className="dish-input-wrap">
                            <input
                                type="text"
                                className="d-input"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
                                onFocus={() => setShowSuggestions(true)}
                                placeholder="例：ごはん（中）"
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="dish-suggest-list">
                                    {suggestions.map(prep => (
                                        <li
                                            key={prep.id}
                                            className="dish-suggest-item"
                                            onMouseDown={() => handleSelectPrep(prep)}
                                        >
                                            <span className="dsi-name">{prep.name}</span>
                                            <span className="dsi-meta">¥{prep.unit_price.toFixed(1)}/{prep.unit}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* 量 */}
                    <div className="dish-form-block">
                        <label className="dish-form-label">量</label>
                        <div className="dish-amount-row">
                            <input
                                type="text"
                                inputMode="decimal"
                                className={`d-input d-input--num${amountError ? ' d-input--err' : ''}`}
                                value={amount}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (v === '' || /^\d*\.?\d*$/.test(v)) { setAmount(v); setAmountError(''); }
                                }}
                                placeholder="0"
                            />
                            <div className="dish-unit-pill">
                                <span>{selectedPrep?.unit || 'g'}</span>
                            </div>
                        </div>
                        {amountError && <p className="dish-form-err">{amountError}</p>}
                    </div>

                    {/* 値段 */}
                    <div className="dish-form-block">
                        <label className="dish-form-label">値段</label>
                        <div className="dish-price-row">
                            <span className="dish-yen">¥</span>
                            <input
                                type="text"
                                className="d-input d-input--num d-input--readonly"
                                value={calculatedCost === 0 ? '' : calculatedCost.toLocaleString()}
                                readOnly
                                placeholder="200"
                                tabIndex={-1}
                            />
                        </div>
                    </div>

                    {/* 追加ボタン */}
                    <button
                        className="dish-add-btn"
                        onClick={handleAddItem}
                        disabled={!selectedPrep || amount === '' || parseFloat(amount) <= 0}
                    >
                        {isEditing ? '変更を保存' : 'リスト\n追加'}
                    </button>

                    {isEditing && (
                        <button
                            className="dish-cancel-btn"
                            onClick={() => {
                                setIsEditing(null);
                                setSearchTerm('');
                                setSelectedPrep(null);
                                setAmount('');
                            }}
                        >
                            キャンセル
                        </button>
                    )}
                </aside>

                {/* ===================== 右カラム ===================== */}
                <main className="dish-right">
                    {/* 仕込み品カードエリア */}
                    <div className="dish-cards-area">
                        {items.length === 0 ? (
                            <div className="dish-cards-empty">仕込みが追加されていません</div>
                        ) : (
                            <AnimatePresence>
                                <div className="dish-cards-grid">
                                    {items.map(item => (
                                        <motion.div
                                            key={item.id}
                                            className={`dish-item-card${isEditing === item.id ? ' dish-item-card--active' : ''}`}
                                            initial={{ opacity: 0, scale: 0.92 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.88 }}
                                            layout
                                        >
                                            <div className="dic-body">
                                                <p className="dic-name">{item.prep?.name}</p>
                                                <p className="dic-meta">{item.amount}{item.unit}</p>
                                                <p className="dic-cost">¥{item.cost.toLocaleString()}</p>
                                            </div>
                                            <div className="dic-actions">
                                                <button
                                                    className="dic-btn dic-btn--edit"
                                                    onClick={() => handleEditItem(item)}
                                                    title="編集"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width={14}>
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="dic-btn dic-btn--del"
                                                    onClick={() => handleDeleteItem(item.id!)}
                                                    title="削除"
                                                >
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
                    <div className="dish-bottom-bar">
                        {/* 左：お品名 */}
                        <div className="dish-bottom-fields">
                            <div className="dish-form-block">
                                <label className="dish-form-label">お品名</label>
                                <input
                                    type="text"
                                    className="d-input"
                                    value={dishName}
                                    onChange={(e) => setDishName(e.target.value)}
                                    placeholder="例：ロコモコ"
                                />
                            </div>
                        </div>

                        {/* 右：合計金額 + 確定ボタン */}
                        <div className="dish-bottom-right">
                            <p className="dish-total-text">
                                合計金額：<span>¥{totalCost.toLocaleString()}</span>
                            </p>
                            <button
                                className="dish-confirm-btn"
                                onClick={handleConfirm}
                                disabled={!dishName.trim() || items.length === 0}
                            >
                                お品確定
                            </button>
                        </div>
                    </div>
                </main>

            </div>

            {/* ===================== 確認モーダル ===================== */}
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="dish-modal-overlay">
                        <motion.div
                            className="dish-modal"
                            initial={{ scale: 0.92, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 16 }}
                        >
                            <div className="dish-modal-head">
                                <h2>お品内容の確認</h2>
                                <button className="dish-modal-x" onClick={() => setShowConfirmModal(false)}>×</button>
                            </div>
                            <div className="dish-modal-body">
                                <div className="dish-modal-row">
                                    <span className="dml">お品名</span>
                                    <span className="dmv dmv--green">{dishName}</span>
                                </div>
                                <div className="dish-modal-row">
                                    <span className="dml">合計コスト</span>
                                    <span className="dmv dmv--bold">¥ {totalCost.toLocaleString()}</span>
                                </div>
                                <div className="dish-modal-items">
                                    <p className="dish-modal-items-ttl">構成仕込み品 ({items.length}件)</p>
                                    <div className="dish-modal-items-list">
                                        {items.map(item => (
                                            <div key={item.id} className="dish-modal-item">
                                                <span className="dmi-name">{item.prep?.name}</span>
                                                <span className="dmi-detail">{item.amount}{item.unit} / ¥{item.cost.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="dish-modal-foot">
                                <button
                                    className="dish-modal-cancel"
                                    onClick={() => setShowConfirmModal(false)}
                                    disabled={isSubmitting}
                                >
                                    キャンセル
                                </button>
                                <button
                                    className="dish-modal-submit"
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

export default DishPage;
