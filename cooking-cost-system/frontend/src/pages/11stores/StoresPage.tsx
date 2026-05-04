import React, { useEffect, useRef, useState } from 'react';
import { storesApi, Store } from '@/api/stores';
import './StoresPage.scss';

const StoresPage: React.FC = () => {
    const [stores, setStores] = useState<Store[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [nameInput, setNameInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const loadStores = async () => {
        const res = await storesApi.getAll();
        if (res.success && res.data) setStores(res.data);
    };

    useEffect(() => { loadStores(); }, []);

    const clearMessages = () => {
        setErrorMessage(null);
        setSuccessMessage(null);
    };

    const handleSelect = (store: Store) => {
        setSelectedId(store.id);
        setNameInput(store.name);
        clearMessages();
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleNew = () => {
        setSelectedId(null);
        setNameInput('');
        clearMessages();
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleSubmit = async () => {
        const name = nameInput.trim();
        if (!name) {
            setErrorMessage('購入先名を入力してください');
            return;
        }
        setIsLoading(true);
        clearMessages();
        try {
            if (selectedId !== null) {
                const res = await storesApi.update(selectedId, name);
                if (res.success) {
                    setSuccessMessage('購入先を更新しました');
                    await loadStores();
                }
            } else {
                const res = await storesApi.create(name);
                if (res.success) {
                    setSuccessMessage('購入先を登録しました');
                    setNameInput('');
                    await loadStores();
                }
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || '操作に失敗しました';
            setErrorMessage(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (selectedId === null) return;
        setIsLoading(true);
        clearMessages();
        try {
            const res = await storesApi.delete(selectedId);
            if (res.success) {
                setSuccessMessage('購入先を削除しました');
                setSelectedId(null);
                setNameInput('');
                await loadStores();
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || '削除に失敗しました';
            setErrorMessage(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedStore = stores.find(s => s.id === selectedId);

    return (
        <div className="stores-page">
            {/* Left: Form */}
            <div className="stores-page__left">
                <div className="stores-page__left-header">
                    <h2 className="stores-page__title">購入先</h2>
                    <p className="stores-page__subtitle">STORE MASTER</p>
                </div>

                <div className="stores-page__form">
                    <label className="stores-page__label">購入先名</label>
                    <input
                        ref={inputRef}
                        type="text"
                        value={nameInput}
                        onChange={e => { setNameInput(e.target.value); clearMessages(); }}
                        placeholder="例: 業務スーパー"
                        className="stores-page__input"
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        disabled={isLoading}
                    />

                    {selectedStore && (
                        <p className="stores-page__editing-note">
                            編集中: <strong>{selectedStore.name}</strong>
                            （食材 {selectedStore.ingredient_count}件）
                        </p>
                    )}

                    {errorMessage && (
                        <p className="stores-page__message stores-page__message--error">{errorMessage}</p>
                    )}
                    {successMessage && (
                        <p className="stores-page__message stores-page__message--success">{successMessage}</p>
                    )}

                    <div className="stores-page__actions">
                        <button
                            onClick={handleNew}
                            className="stores-page__btn stores-page__btn--secondary"
                            disabled={isLoading}
                        >
                            新規
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="stores-page__btn stores-page__btn--primary"
                            disabled={isLoading || !nameInput.trim()}
                        >
                            {isLoading ? '処理中...' : selectedId !== null ? '更新' : '登録'}
                        </button>
                        {selectedId !== null && (
                            <button
                                onClick={handleDelete}
                                className="stores-page__btn stores-page__btn--danger"
                                disabled={isLoading}
                            >
                                削除
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: List */}
            <div className="stores-page__right">
                <div className="stores-page__list-header">
                    <div>
                        <h3 className="stores-page__list-title">購入先一覧</h3>
                        <p className="stores-page__list-subtitle">使用食材数が多い順</p>
                    </div>
                    <span className="stores-page__list-badge">{stores.length}件</span>
                </div>

                {stores.length === 0 ? (
                    <div className="stores-page__empty">
                        <p>購入先が登録されていません</p>
                        <p className="stores-page__empty-hint">左のフォームから追加してください</p>
                    </div>
                ) : (
                    <div className="stores-page__list">
                        {stores.map((store, idx) => (
                            <div
                                key={store.id}
                                className={`stores-page__item ${selectedId === store.id ? 'stores-page__item--selected' : ''}`}
                                onClick={() => handleSelect(store)}
                            >
                                <span className="stores-page__item-rank">#{idx + 1}</span>
                                <span className="stores-page__item-name">{store.name}</span>
                                <span className="stores-page__item-count">
                                    食材 <strong>{store.ingredient_count}</strong>件
                                </span>
                                <svg className="stores-page__item-arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoresPage;
