import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, animate, PanInfo } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ingredientApi, prepApi, dishApi } from '@/api';
import { Ingredient, CompletedFood } from '../../types';
import './list.scss';

type TabType = 'ingredients' | 'preps' | 'dishes';

type CostJudgment = 'warning' | 'danger' | null;

function getDishCostJudgment(item: any): CostJudgment {
    const cost = item.price ?? 0;
    const selling = item.selling_price;
    if (!selling || selling <= 0 || cost <= 0) return null;
    const ratio = cost / selling;
    if (ratio >= 0.50) return 'danger';
    if (ratio >= 0.35) return 'warning';
    return null;
}

// ─── スワイプカード（モバイル専用） ───────────────────────────────
const SWIPE_REVEAL_PX = 120;
const SWIPE_THRESHOLD = 60;

interface SwipeableCardProps {
    itemId: number;
    swipeOpenId: number | null;
    setSwipeOpenId: (id: number | null) => void;
    onEdit: () => void;
    onDeleteClick: () => void;
    children: React.ReactNode;
}

// AnimatePresence (mode="popLayout") の直下に置くカスタムコンポーネントは
// ルート要素への ref 転送が必須のため forwardRef で定義する。
// リスト出現/退出アニメーション（layout/initial/animate/exit）もこのラッパーが担い、
// 内側のドラッグ用 motion.div との二重アニメーションを避ける。
const SwipeableCard = React.forwardRef<HTMLDivElement, SwipeableCardProps>(({
    itemId,
    swipeOpenId,
    setSwipeOpenId,
    onEdit,
    onDeleteClick,
    children,
}, ref) => {
    const x = useMotionValue(0);
    const isOpen = swipeOpenId === itemId;

    // 他のカードが開いたらこのカードを閉じる
    useEffect(() => {
        if (!isOpen) {
            animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
        }
    }, [isOpen, x]);

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        // 閾値未満の小さな移動では現在の開閉状態を維持する：
        // 閉じた状態 → 左へ SWIPE_THRESHOLD 超スワイプしたときだけ開く
        // 開いた状態 → 右へ SWIPE_THRESHOLD 超スワイプしたときだけ閉じる（指ブレで閉じない）
        const shouldOpen = isOpen
            ? info.offset.x <= SWIPE_THRESHOLD
            : info.offset.x < -SWIPE_THRESHOLD;
        if (shouldOpen) {
            animate(x, -SWIPE_REVEAL_PX, { type: 'spring', stiffness: 300, damping: 30 });
            setSwipeOpenId(itemId);
        } else {
            animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
            setSwipeOpenId(null);
        }
    };

    return (
        <motion.div
            ref={ref}
            className="swipeable-card-wrapper"
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
        >
            {/* スワイプで露出するアクションボタン */}
            <div className="swipe-actions" aria-hidden={!isOpen}>
                <button
                    className="swipe-btn swipe-btn--edit"
                    onClick={(e) => { e.stopPropagation(); setSwipeOpenId(null); onEdit(); }}
                    tabIndex={isOpen ? 0 : -1}
                    aria-label="編集"
                >
                    ✏️<span>編集</span>
                </button>
                <button
                    className="swipe-btn swipe-btn--delete"
                    onClick={(e) => { e.stopPropagation(); setSwipeOpenId(null); onDeleteClick(); }}
                    tabIndex={isOpen ? 0 : -1}
                    aria-label="削除"
                >
                    🗑️<span>削除</span>
                </button>
            </div>

            {/* スライドするカード本体 */}
            <motion.div
                className="swipeable-card-content"
                drag="x"
                dragConstraints={{ left: -SWIPE_REVEAL_PX, right: 0 }}
                dragElastic={0.05}
                style={{ x }}
                onDragEnd={handleDragEnd}
                onClick={(e) => {
                    // 開いているカードのタップはここで閉じて伝播を止める（アクションボタンと同じ扱い）。
                    // 閉じているカードのタップは伝播させ、mobile-card-list 側で他の開いたカードを閉じる。
                    if (isOpen) {
                        e.stopPropagation();
                        setSwipeOpenId(null);
                    }
                }}
            >
                {children}
            </motion.div>
        </motion.div>
    );
});
SwipeableCard.displayName = 'SwipeableCard';

// ─── メインコンポーネント ───────────────────────────────────────────
const ListPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState<TabType>(location.state?.tab || 'ingredients');
    const [searchTerms, setSearchTerms] = useState({ ingredients: '', preps: '', dishes: '' });
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [preps, setPreps] = useState<any[]>([]);
    const [dishes, setDishes] = useState<CompletedFood[]>([]);
    const [counts, setCounts] = useState({ ingredients: 0, preps: 0, dishes: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: TabType; item: any } | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [swipeOpenId, setSwipeOpenId] = useState<number | null>(null);

    // タブ切り替え時にスワイプ状態をリセット
    useEffect(() => {
        setSwipeOpenId(null);
    }, [activeTab]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'ingredients') {
                const res = await ingredientApi.getAll({
                    name: searchTerms.ingredients,
                    sortBy: 'name',
                    sortOrder: 'ASC'
                });
                if (res.success && res.data) {
                    setIngredients(res.data);
                    setCounts(prev => ({ ...prev, ingredients: res.data?.length || 0 }));
                }
            } else if (activeTab === 'preps') {
                const res = await prepApi.getAll({ name: searchTerms.preps });
                if (res.success && res.data) {
                    setPreps(res.data);
                    setCounts(prev => ({ ...prev, preps: res.data?.length || 0 }));
                }
            } else if (activeTab === 'dishes') {
                const res = await dishApi.getAll({ name: searchTerms.dishes });
                if (res.success && res.data) {
                    setDishes(res.data);
                    setCounts(prev => ({ ...prev, dishes: res.data?.length || 0 }));
                }
            }
        } catch (error) {
            console.error(`Failed to fetch ${activeTab}`, error);
            toast.error('データの取得に失敗しました');
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, searchTerms]);

    useEffect(() => {
        const timer = setTimeout(fetchData, 300);
        return () => clearTimeout(timer);
    }, [fetchData]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerms(prev => ({ ...prev, [activeTab]: e.target.value }));
    };

    const handleEdit = (type: TabType, id: number) => {
        if (type === 'ingredients') navigate(`/ingredients/edit?id=${id}`);
        else if (type === 'preps') navigate(`/dishes/prep?id=${id}`);
        else if (type === 'dishes') navigate(`/dishes/large?id=${id}`);
    };

    const handleDeleteClick = (type: TabType, item: any) => {
        setDeleteTarget({ type, item });
        setDeleteError(null);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const { type, item } = deleteTarget;
        try {
            let res;
            if (type === 'ingredients') res = await ingredientApi.delete(item.id);
            else if (type === 'preps') res = await prepApi.delete(item.id);
            else if (type === 'dishes') res = await dishApi.delete(item.id);

            if (res?.success) {
                toast.success('削除しました');
                setDeleteTarget(null);
                fetchData();
            }
        } catch (error: any) {
            console.error('Delete failed:', error);
            const message = error.response?.data?.message || '削除できませんでした。';
            setDeleteError(message);
        }
    };

    const currentCount = counts[activeTab];
    const currentSearch = searchTerms[activeTab];

    return (
        <div className="list-page-container">
            {/* ヘッダー */}
            <div className="page-header">
                <div className="title-section">
                    <div className="icon-badge">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6H20M4 12H20M4 18H14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h1>一覧</h1>
                </div>

                <div className="tabs-wrapper">
                    <button className={`tab-item ${activeTab === 'ingredients' ? 'active' : ''}`} onClick={() => setActiveTab('ingredients')}>食材</button>
                    <button className={`tab-item ${activeTab === 'preps' ? 'active' : ''}`} onClick={() => setActiveTab('preps')}>仕込み</button>
                    <button className={`tab-item ${activeTab === 'dishes' ? 'active' : ''}`} onClick={() => setActiveTab('dishes')}>お品</button>
                </div>
            </div>

            {/* コントロールバー */}
            <div className="control-bar">
                <div className="info-badge">全：<span>{currentCount}</span> 件</div>
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder={`${activeTab === 'ingredients' ? '食材' : activeTab === 'preps' ? '仕込み' : 'お品'}を検索...`}
                        value={currentSearch}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>

            {/* ══ デスクトップ: テーブル ══════════════════════════════════ */}
            <div className="table-wrapper">
                <table className="custom-table">
                    <thead>
                        {activeTab === 'ingredients' && (
                            <tr><th>食材名</th><th>単価</th><th>購入先</th><th>ジャンル</th><th className="text-center">操作</th></tr>
                        )}
                        {activeTab === 'preps' && (
                            <tr><th>仕込み名</th><th>単価</th><th>使用食材</th><th className="text-center">操作</th></tr>
                        )}
                        {activeTab === 'dishes' && (
                            <tr><th>お品</th><th>合計金額</th><th>使用仕込み</th><th className="text-center">操作</th></tr>
                        )}
                    </thead>
                    <tbody>
                        <AnimatePresence mode="popLayout">
                            {isLoading ? (
                                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <td colSpan={5} className="loading-cell">読み込み中...</td>
                                </motion.tr>
                            ) : (
                                <>
                                    {activeTab === 'ingredients' && ingredients.map((item) => (
                                        <motion.tr key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                                            <td><button className="link-btn" onClick={() => handleEdit('ingredients', item.id!)}>{item.name}</button></td>
                                            <td className="font-mono text-emerald-600 font-bold">¥ {(item.price / item.quantity).toFixed(2)}/{item.unit}</td>
                                            <td className="text-gray-500">{item.store}</td>
                                            <td className="text-gray-500">{(item as any).genre || '-'}</td>
                                            <td className="actions-cell">
                                                <button className="btn-icon edit" onClick={() => handleEdit('ingredients', item.id!)} title="編集">✏️</button>
                                                <button className="btn-icon delete" onClick={() => handleDeleteClick('ingredients', item)} title="削除">🗑️</button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                    {activeTab === 'preps' && preps.map((item) => (
                                        <motion.tr key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                                            <td><button className="link-btn" onClick={() => handleEdit('preps', item.id)}>{item.prep_name || item.name}</button></td>
                                            <td className="font-mono text-emerald-600 font-bold">¥ {item.unit_price != null ? Number(item.unit_price).toFixed(2) : '-'}<span className="text-gray-400 font-normal text-xs">/g</span></td>
                                            <td className="text-xs text-gray-500">{item.ingredient_names?.join(', ') || '-'}</td>
                                            <td className="actions-cell">
                                                <button className="btn-icon edit" onClick={() => handleEdit('preps', item.id)} title="編集">✏️</button>
                                                <button className="btn-icon delete" onClick={() => handleDeleteClick('preps', item)} title="削除">🗑️</button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                    {activeTab === 'dishes' && dishes.map((item) => {
                                        const judgment = getDishCostJudgment(item);
                                        const costRatio = item.selling_price && item.selling_price > 0
                                            ? ((item.price ?? 0) / item.selling_price * 100).toFixed(1)
                                            : null;
                                        return (
                                            <motion.tr key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={judgment ? `cost-row--${judgment}` : ''}>
                                                <td>
                                                    <div className="dish-name-cell">
                                                        <button className="link-btn" onClick={() => handleEdit('dishes', item.id!)}>{item.name}</button>
                                                        {judgment === 'danger' && <span className="cost-badge cost-badge--danger" title={`原価率 ${costRatio}%（赤字リスク）`}>✗ {costRatio}%</span>}
                                                        {judgment === 'warning' && <span className="cost-badge cost-badge--warning" title={`原価率 ${costRatio}%（要注意）`}>△ {costRatio}%</span>}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="price-cell">
                                                        <span className="font-mono text-gray-600">原価 ¥{(item.price ?? 0).toLocaleString()}</span>
                                                        {item.selling_price != null && <span className="font-mono text-blue-600 font-bold">売 ¥{item.selling_price.toLocaleString()}</span>}
                                                    </div>
                                                </td>
                                                <td className="text-xs text-gray-400">{item.dishes?.map((p: any) => p.prep_name || p.name).join(', ') || '-'}</td>
                                                <td className="actions-cell">
                                                    <button className="btn-icon edit" onClick={() => handleEdit('dishes', item.id!)} title="編集">✏️</button>
                                                    <button className="btn-icon delete" onClick={() => handleDeleteClick('dishes', item)} title="削除">🗑️</button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                    {!isLoading && currentCount === 0 && (
                                        <tr><td colSpan={5} className="empty-cell">データがありません</td></tr>
                                    )}
                                </>
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* ══ モバイル: スワイプカードリスト ══════════════════════════ */}
            <div
                className="mobile-card-list"
                onClick={() => { if (swipeOpenId !== null) setSwipeOpenId(null); }}
            >
                <AnimatePresence mode="popLayout">
                    {isLoading ? (
                        <motion.div className="mobile-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            読み込み中...
                        </motion.div>
                    ) : (
                        <>
                            {activeTab === 'ingredients' && (
                                ingredients.length === 0
                                    ? <div className="mobile-empty">データがありません</div>
                                    : ingredients.map((item) => (
                                        <SwipeableCard
                                            key={item.id}
                                            itemId={item.id!}
                                            swipeOpenId={swipeOpenId}
                                            setSwipeOpenId={setSwipeOpenId}
                                            onEdit={() => handleEdit('ingredients', item.id!)}
                                            onDeleteClick={() => handleDeleteClick('ingredients', item)}
                                        >
                                            <div className="card-name">{item.name}</div>
                                            <div className="card-price">¥{(item.price / item.quantity).toFixed(2)}<span className="card-unit">/{item.unit}</span></div>
                                            <div className="card-sub">{item.store}{(item as any).genre ? ` · ${(item as any).genre}` : ''}</div>
                                        </SwipeableCard>
                                    ))
                            )}
                            {activeTab === 'preps' && (
                                preps.length === 0
                                    ? <div className="mobile-empty">データがありません</div>
                                    : preps.map((item) => (
                                        // preps は any[] 型のため非 null アサーション不要（API レスポンス上 id は必須）。
                                        // ingredients/dishes は id?: number の型定義のため item.id! を使用している。
                                        <SwipeableCard
                                            key={item.id}
                                            itemId={item.id}
                                            swipeOpenId={swipeOpenId}
                                            setSwipeOpenId={setSwipeOpenId}
                                            onEdit={() => handleEdit('preps', item.id)}
                                            onDeleteClick={() => handleDeleteClick('preps', item)}
                                        >
                                            <div className="card-name">{item.prep_name || item.name}</div>
                                            <div className="card-price">¥{item.unit_price != null ? Number(item.unit_price).toFixed(2) : '-'}<span className="card-unit">/g</span></div>
                                            <div className="card-sub">{item.ingredient_names?.join(', ') || '-'}</div>
                                        </SwipeableCard>
                                    ))
                            )}
                            {activeTab === 'dishes' && (
                                dishes.length === 0
                                    ? <div className="mobile-empty">データがありません</div>
                                    : dishes.map((item) => {
                                        const judgment = getDishCostJudgment(item);
                                        const costRatio = item.selling_price && item.selling_price > 0
                                            ? ((item.price ?? 0) / item.selling_price * 100).toFixed(1)
                                            : null;
                                        return (
                                            <SwipeableCard
                                                key={item.id}
                                                itemId={item.id!}
                                                swipeOpenId={swipeOpenId}
                                                setSwipeOpenId={setSwipeOpenId}
                                                onEdit={() => handleEdit('dishes', item.id!)}
                                                onDeleteClick={() => handleDeleteClick('dishes', item)}
                                            >
                                                <div className={`card-name ${judgment ? `card-name--${judgment}` : ''}`}>
                                                    {item.name}
                                                    {judgment === 'danger' && <span className="cost-badge cost-badge--danger">✗ {costRatio}%</span>}
                                                    {judgment === 'warning' && <span className="cost-badge cost-badge--warning">△ {costRatio}%</span>}
                                                </div>
                                                <div className="card-price">原価 ¥{(item.price ?? 0).toLocaleString()}</div>
                                                {item.selling_price != null && (
                                                    <div className="card-selling-price">売 ¥{item.selling_price.toLocaleString()}</div>
                                                )}
                                                <div className="card-sub">{item.dishes?.map((p: any) => p.prep_name || p.name).join(', ') || '-'}</div>
                                            </SwipeableCard>
                                        );
                                    })
                            )}
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* 削除確認モーダル */}
            <AnimatePresence>
                {deleteTarget && (
                    <div className="modal-overlay">
                        <motion.div className="confirm-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                            <h2>削除の確認</h2>
                            <p>「<strong>{deleteTarget.item.name || deleteTarget.item.prep_name}</strong>」を本当に削除しますか？</p>
                            {deleteError ? (
                                <p className="error-text">{deleteError}</p>
                            ) : (
                                <p className="warning-text">この操作は取り消せません。</p>
                            )}
                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={() => { setDeleteTarget(null); setDeleteError(null); }}>
                                    {deleteError ? '閉じる' : 'キャンセル'}
                                </button>
                                {!deleteError && (
                                    <button className="btn-danger" onClick={confirmDelete}>保存して削除</button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ListPage;
