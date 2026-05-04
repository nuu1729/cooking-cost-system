import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { storesApi, Store } from '@/api/stores';
import toast from 'react-hot-toast';

const StoresPage: React.FC = () => {
    const [stores, setStores] = useState<Store[]>([]);
    const [nameInput, setNameInput] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const loadStores = async () => {
        try {
            const res = await storesApi.getAll();
            if (res.success && res.data) setStores(res.data);
        } catch {
            toast.error('購入先一覧の取得に失敗しました');
        }
    };

    useEffect(() => {
        loadStores();
    }, []);

    const handleSelect = (store: Store) => {
        setSelectedId(store.id);
        setNameInput(store.name);
    };

    const handleClear = () => {
        setSelectedId(null);
        setNameInput('');
    };

    const handleRegister = async () => {
        if (!nameInput.trim()) {
            toast.error('購入先名を入力してください');
            return;
        }
        setIsLoading(true);
        try {
            const res = await storesApi.create(nameInput.trim());
            if (res.success) {
                toast.success(`「${nameInput.trim()}」を登録しました`);
                setNameInput('');
                await loadStores();
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || '登録に失敗しました';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedId || !nameInput.trim()) {
            toast.error('購入先名を入力してください');
            return;
        }
        setIsLoading(true);
        try {
            const res = await storesApi.update(selectedId, nameInput.trim());
            if (res.success) {
                toast.success(`「${nameInput.trim()}」に更新しました`);
                handleClear();
                await loadStores();
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || '更新に失敗しました';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        setIsLoading(true);
        try {
            const res = await storesApi.delete(id);
            if (res.success) {
                toast.success('購入先を削除しました');
                if (selectedId === id) handleClear();
                setDeleteConfirmId(null);
                await loadStores();
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || '削除に失敗しました';
            toast.error(msg);
            setDeleteConfirmId(null);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedStore = stores.find(s => s.id === selectedId);

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[#f9f9f9] py-16 px-4">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-start gap-4 mb-10">
                    <div className="w-12 h-12 bg-[#f97316] rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">購入先管理</h1>
                        <p className="text-gray-500 mt-1">食材の購入先を登録・編集・削除できます</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">

                    {/* Left: Form */}
                    <div className="w-full md:w-2/5">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                                    {selectedId ? '編集中の購入先' : '新規購入先名'}
                                </label>
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={e => setNameInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') selectedId ? handleUpdate() : handleRegister(); }}
                                    placeholder="例：業務スーパー"
                                    className="w-full px-5 py-4 bg-[#f0f0f0] border-2 border-transparent rounded-2xl outline-none text-lg focus:ring-2 focus:ring-orange-400 transition-all"
                                />
                            </div>

                            {selectedId && (
                                <div className="bg-orange-50 rounded-2xl px-5 py-3 text-sm text-orange-700 font-medium">
                                    選択中：{selectedStore?.name}
                                    {selectedStore && selectedStore.ingredient_count > 0 && (
                                        <span className="ml-2 text-orange-500">（{selectedStore.ingredient_count}件の食材）</span>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                {!selectedId ? (
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={handleRegister}
                                        disabled={isLoading}
                                        className="w-full py-4 bg-[#f97316] text-white font-bold text-lg rounded-2xl shadow hover:bg-orange-600 transition-all disabled:opacity-50"
                                    >
                                        登録する
                                    </motion.button>
                                ) : (
                                    <>
                                        <motion.button
                                            whileTap={{ scale: 0.97 }}
                                            onClick={handleUpdate}
                                            disabled={isLoading}
                                            className="w-full py-4 bg-[#53b69b] text-white font-bold text-lg rounded-2xl shadow hover:bg-emerald-600 transition-all disabled:opacity-50"
                                        >
                                            更新する
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => setDeleteConfirmId(selectedId)}
                                            disabled={isLoading || (selectedStore?.ingredient_count ?? 0) > 0}
                                            className="w-full py-4 bg-red-500 text-white font-bold text-lg rounded-2xl shadow hover:bg-red-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                            title={(selectedStore?.ingredient_count ?? 0) > 0 ? '使用中の購入先は削除できません' : ''}
                                        >
                                            削除する
                                        </motion.button>
                                        <button
                                            onClick={handleClear}
                                            className="w-full py-3 bg-gray-100 text-gray-600 font-medium rounded-2xl hover:bg-gray-200 transition-all"
                                        >
                                            キャンセル
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: List */}
                    <div className="w-full md:w-3/5">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="font-bold text-gray-700">登録済み購入先</h2>
                                <span className="text-sm text-gray-400">{stores.length} 件</span>
                            </div>

                            {stores.length === 0 ? (
                                <div className="px-8 py-16 text-center text-gray-400">
                                    購入先が登録されていません
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-50">
                                    {stores.map((store, index) => (
                                        <motion.li
                                            key={store.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            onClick={() => handleSelect(store)}
                                            className={`px-8 py-4 flex items-center justify-between cursor-pointer transition-colors ${selectedId === store.id ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-bold text-gray-300 w-6 text-right">
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <p className="font-bold text-gray-800">{store.name}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        食材 {store.ingredient_count} 件
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {store.ingredient_count > 0 && (
                                                    <span className="px-3 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded-full">
                                                        使用中
                                                    </span>
                                                )}
                                                {selectedId === store.id && (
                                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-xs font-bold rounded-full">
                                                        選択中
                                                    </span>
                                                )}
                                            </div>
                                        </motion.li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmId !== null && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirmId(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-[2rem] shadow-2xl p-10 w-full max-w-sm space-y-6"
                        >
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-black text-gray-800">購入先を削除しますか？</h3>
                                <p className="text-gray-500 text-sm">
                                    「{stores.find(s => s.id === deleteConfirmId)?.name}」を削除します。この操作は取り消せません。
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handleDelete(deleteConfirmId)}
                                    disabled={isLoading}
                                    className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all"
                                >
                                    削除する
                                </button>
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                                >
                                    キャンセル
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StoresPage;
