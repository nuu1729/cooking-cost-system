import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ingredientApi, prepApi, dishApi } from '../../api/api';
import { Ingredient, CompletedFood } from '../../types';
import './list.scss';

type TabType = 'ingredients' | 'preps' | 'dishes';

const ListPage: React.FC = () => {
    const navigate = useNavigate();
    
    // Tab State
    const [activeTab, setActiveTab] = useState<TabType>('ingredients');
    
    // Search State
    const [searchTerms, setSearchTerms] = useState({
        ingredients: '',
        preps: '',
        dishes: ''
    });
    
    // Data State
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [preps, setPreps] = useState<any[]>([]); // Using any because prepApi returns any[] currently
    const [dishes, setDishes] = useState<CompletedFood[]>([]);
    
    const [counts, setCounts] = useState({
        ingredients: 0,
        preps: 0,
        dishes: 0
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: TabType; item: any } | null>(null);

    // Data Fetching
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

    // Initial fetch and search debounce
    useEffect(() => {
        const timer = setTimeout(fetchData, 300);
        return () => clearTimeout(timer);
    }, [fetchData]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerms(prev => ({ ...prev, [activeTab]: value }));
    };

    const handleEdit = (type: TabType, id: number) => {
        console.log(`Editing ${type} with id ${id}`);
        if (type === 'ingredients') {
            navigate(`/ingredients/edit?id=${id}`);
        } else if (type === 'preps') {
            navigate(`/dishes/prep?id=${id}`);
        } else if (type === 'dishes') {
            navigate(`/dishes/large?id=${id}`);
        }
    };

    const handleDeleteClick = (type: TabType, item: any) => {
        setDeleteTarget({ type, item });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const { type, item } = deleteTarget;
        
        try {
            let res;
            if (type === 'ingredients') {
                res = await ingredientApi.delete(item.id);
            } else if (type === 'preps') {
                res = await prepApi.delete(item.id);
            } else if (type === 'dishes') {
                res = await dishApi.delete(item.id);
            }

            if (res?.success) {
                toast.success('削除しました');
                setDeleteTarget(null);
                fetchData();
            }
        } catch (error: any) {
            console.error('Delete failed:', error);
            // Handling "in use" error as per spec
            if (error.response?.status === 400 || error.response?.status === 409) {
                const message = error.response?.data?.message || '削除できませんでした。';
                toast.error(message);
            }
        }
    };

    const currentCount = counts[activeTab];
    const currentSearch = searchTerms[activeTab];

    return (
        <div className="list-page-container">
            {/* Header / Title Area */}
            <div className="page-header">
                <div className="title-section">
                    <div className="icon-badge">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6H20M4 12H20M4 18H14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h1>一覧</h1>
                </div>

                {/* Tabs */}
                <div className="tabs-wrapper">
                    <button 
                        className={`tab-item ${activeTab === 'ingredients' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ingredients')}
                    >
                        食材
                    </button>
                    <button 
                        className={`tab-item ${activeTab === 'preps' ? 'active' : ''}`}
                        onClick={() => setActiveTab('preps')}
                    >
                        仕込み
                    </button>
                    <button 
                        className={`tab-item ${activeTab === 'dishes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dishes')}
                    >
                        お品
                    </button>
                </div>
            </div>

            {/* Filter / Info Bar */}
            <div className="control-bar">
                <div className="info-badge">
                    全：<span>{currentCount}</span> 件
                </div>
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

            {/* Table Area */}
            <div className="table-wrapper">
                <table className="custom-table">
                    <thead>
                        {activeTab === 'ingredients' && (
                            <tr>
                                <th>食材名</th>
                                <th>単価/金額</th>
                                <th>購入先</th>
                                <th className="text-center">操作</th>
                            </tr>
                        )}
                        {activeTab === 'preps' && (
                            <tr>
                                <th>仕込み名</th>
                                <th>単価</th>
                                <th>使用食材</th>
                                <th className="text-center">操作</th>
                            </tr>
                        )}
                        {activeTab === 'dishes' && (
                            <tr>
                                <th>お品</th>
                                <th>合計金額</th>
                                <th>使用仕込み</th>
                                <th className="text-center">操作</th>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        <AnimatePresence mode="popLayout">
                            {isLoading ? (
                                <motion.tr 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <td colSpan={4} className="loading-cell">読み込み中...</td>
                                </motion.tr>
                            ) : (
                                <>
                                    {activeTab === 'ingredients' && ingredients.map((item) => (
                                        <motion.tr 
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                        >
                                            <td>
                                                <button className="link-btn" onClick={() => handleEdit('ingredients', item.id!)}>
                                                    {item.name}
                                                </button>
                                            </td>
                                            <td className="font-mono text-emerald-600 font-bold">
                                                ¥ {(item.price / item.quantity).toFixed(2)}/{item.unit}
                                            </td>
                                            <td className="text-gray-500">{item.store}</td>
                                            <td className="actions-cell">
                                                <button className="btn-icon edit" onClick={() => handleEdit('ingredients', item.id!)} title="編集">
                                                    ✏️
                                                </button>
                                                <button className="btn-icon delete" onClick={() => handleDeleteClick('ingredients', item)} title="削除">
                                                    🗑️
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                    {activeTab === 'preps' && preps.map((item) => (
                                        <motion.tr 
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                        >
                                            <td>
                                                <button className="link-btn" onClick={() => handleEdit('preps', item.id)}>
                                                    {item.prep_name || item.name}
                                                </button>
                                            </td>
                                            <td className="font-mono text-emerald-600 font-bold">
                                                ¥ {item.total_cost?.toLocaleString()}
                                            </td>
                                            <td className="text-xs text-gray-500">
                                                {item.items?.map((i: any) => i.ingredient?.name).join(', ') || item.ingredients?.join(', ')}
                                            </td>
                                            <td className="actions-cell">
                                                <button className="btn-icon edit" onClick={() => handleEdit('preps', item.id)} title="編集">
                                                    ✏️
                                                </button>
                                                <button className="btn-icon delete" onClick={() => handleDeleteClick('preps', item)} title="削除">
                                                    🗑️
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                    {activeTab === 'dishes' && dishes.map((item) => (
                                        <motion.tr 
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                        >
                                            <td>
                                                <button className="link-btn" onClick={() => handleEdit('dishes', item.id!)}>
                                                    {item.name}
                                                </button>
                                            </td>
                                            <td className="font-mono text-blue-600 font-bold">
                                                ¥ {item.price?.toLocaleString() || item.total_cost?.toLocaleString()}
                                            </td>
                                            <td className="text-xs text-gray-400">
                                                {item.dishes?.map((p: any) => p.prep_name || p.name).join(', ') || '-'}
                                            </td>
                                            <td className="actions-cell">
                                                <button className="btn-icon edit" onClick={() => handleEdit('dishes', item.id!)} title="編集">
                                                    ✏️
                                                </button>
                                                <button className="btn-icon delete" onClick={() => handleDeleteClick('dishes', item)} title="削除">
                                                    🗑️
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                    
                                    {!isLoading && currentCount === 0 && (
                                        <tr>
                                            <td colSpan={4} className="empty-cell">データがありません</td>
                                        </tr>
                                    )}
                                </>
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <div className="modal-overlay">
                        <motion.div 
                            className="confirm-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <h2>削除の確認</h2>
                            <p>「<strong>{deleteTarget.item.name || deleteTarget.item.prep_name}</strong>」を本当に削除しますか？</p>
                            <p className="warning-text">この操作は取り消せません。</p>
                            
                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>キャンセル</button>
                                <button className="btn-danger" onClick={confirmDelete}>保存して削除</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ListPage;
