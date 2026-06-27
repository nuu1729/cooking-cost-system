import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { genreApi, Genre } from '@/api';
import toast from 'react-hot-toast';

const GenresPage: React.FC = () => {
    const [genres, setGenres] = useState<Genre[]>([]);
    const [nameInput, setNameInput] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const loadGenres = async () => {
        try {
            const res = await genreApi.getAll();
            if (res.success && res.data) {
                setGenres(res.data);
            }
        } catch {
            toast.error('ジャンル一覧の取得に失敗しました');
        }
    };

    useEffect(() => {
        loadGenres();
    }, []);

    const handleSelect = (genre: Genre) => {
        setSelectedId(genre.id);
        setNameInput(genre.name);
    };

    const handleClear = () => {
        setSelectedId(null);
        setNameInput('');
    };

    const handleRegister = async () => {
        if (!nameInput.trim()) {
            toast.error('ジャンル名を入力してください');
            return;
        }
        setIsLoading(true);
        try {
            const res = await genreApi.create({ name: nameInput.trim() });
            if (res.success) {
                toast.success(`「${nameInput.trim()}」を登録しました`);
                setNameInput('');
                await loadGenres();
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
            toast.error('ジャンル名を入力してください');
            return;
        }
        setIsLoading(true);
        try {
            const res = await genreApi.update(selectedId, { name: nameInput.trim() });
            if (res.success) {
                toast.success(`「${nameInput.trim()}」に更新しました`);
                handleClear();
                await loadGenres();
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
            const res = await genreApi.delete(id);
            if (res.success) {
                toast.success('ジャンルを削除しました');
                if (selectedId === id) handleClear();
                setDeleteConfirmId(null);
                await loadGenres();
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || '削除に失敗しました';
            toast.error(msg);
            setDeleteConfirmId(null);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedGenre = genres.find(g => g.id === selectedId);

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[#f9f9f9] py-16 px-4">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-start gap-4 mb-10">
                    <div className="w-12 h-12 bg-[#6366f1] rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">ジャンル管理</h1>
                        <p className="text-gray-500 mt-1">食材のジャンルを登録・編集・削除できます</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">

                    {/* Left: Form */}
                    <div className="w-full md:w-2/5">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                                    {selectedId ? '編集中のジャンル' : '新規ジャンル名'}
                                </label>
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={e => setNameInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') selectedId ? handleUpdate() : handleRegister(); }}
                                    placeholder="例：乳製品"
                                    className="w-full px-5 py-4 bg-[#f0f0f0] border-2 border-transparent rounded-2xl outline-none text-lg focus:ring-2 focus:ring-indigo-400 transition-all"
                                />
                            </div>

                            {selectedId && (
                                <div className="bg-indigo-50 rounded-2xl px-5 py-3 text-sm text-indigo-700 font-medium">
                                    選択中：{selectedGenre?.name}
                                    {selectedGenre && selectedGenre.ingredient_count > 0 && (
                                        <span className="ml-2 text-indigo-500">（{selectedGenre.ingredient_count}件の食材）</span>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                {!selectedId ? (
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={handleRegister}
                                        disabled={isLoading}
                                        className="w-full py-4 bg-[#6366f1] text-white font-bold text-lg rounded-2xl shadow hover:bg-indigo-600 transition-all disabled:opacity-50"
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
                                            disabled={isLoading || (selectedGenre?.ingredient_count ?? 0) > 0}
                                            className="w-full py-4 bg-red-500 text-white font-bold text-lg rounded-2xl shadow hover:bg-red-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                            title={(selectedGenre?.ingredient_count ?? 0) > 0 ? '使用中のジャンルは削除できません' : ''}
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
                                <h2 className="font-bold text-gray-700">登録済みジャンル</h2>
                                <span className="text-sm text-gray-400">{genres.length} 件</span>
                            </div>

                            {genres.length === 0 ? (
                                <div className="px-8 py-16 text-center text-gray-400">
                                    ジャンルが登録されていません
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-50">
                                    {genres.map((genre, index) => (
                                        <motion.li
                                            key={genre.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            onClick={() => handleSelect(genre)}
                                            className={`px-8 py-4 flex items-center justify-between cursor-pointer transition-colors ${selectedId === genre.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-bold text-gray-300 w-6 text-right">
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <p className="font-bold text-gray-800">{genre.name}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        食材 {genre.ingredient_count} 件
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {genre.ingredient_count > 0 && (
                                                    <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-xs font-bold rounded-full">
                                                        使用中
                                                    </span>
                                                )}
                                                {selectedId === genre.id && (
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
                                <h3 className="text-xl font-black text-gray-800">ジャンルを削除しますか？</h3>
                                <p className="text-gray-500 text-sm">
                                    「{genres.find(g => g.id === deleteConfirmId)?.name}」を削除します。この操作は取り消せません。
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

export default GenresPage;
