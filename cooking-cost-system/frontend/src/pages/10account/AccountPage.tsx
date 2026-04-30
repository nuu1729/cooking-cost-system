import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountStore, AccountInfo } from '../../stores/accountStore';
import AccountIcon from '../../components/features/AccountIcon';
import { authApi } from '../../api';
import './AccountPage.scss';

const MAX_FILE_SIZE_MB = 5;

const AccountPage: React.FC = () => {
    const [account, setAccount] = useState<AccountInfo>(accountStore.get());
    const [editDisplayName, setEditDisplayName] = useState(accountStore.get().displayName);
    const [editEmail, setEditEmail] = useState(accountStore.get().email);
    const [previewUrl, setPreviewUrl] = useState<string | null>(accountStore.get().iconUrl);
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            const custom = e as CustomEvent<AccountInfo>;
            setAccount(custom.detail);
            setEditDisplayName(custom.detail.displayName);
            setEditEmail(custom.detail.email);
            setPreviewUrl(custom.detail.iconUrl);
            setBgPreviewUrl(custom.detail.homeBgUrl);
        };
        window.addEventListener('account-updated', handler);
        return () => window.removeEventListener('account-updated', handler);
    }, []);

    /** 画像ファイルをプレビュー表示してアップロード用に保持 */
    const loadFile = useCallback((file: File) => {
        setErrorMsg('');
        if (!file.type.startsWith('image/')) {
            setErrorMsg('画像ファイル（PNG / JPG / GIF / WebP）を選択してください。');
            return;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setErrorMsg(`ファイルサイズが大きすぎます（最大 ${MAX_FILE_SIZE_MB}MB）。`);
            return;
        }
        setIconFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
        reader.readAsDataURL(file);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) loadFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) loadFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = () => setIsDragging(false);

    const handleClearIcon = () => {
        setPreviewUrl(null);
        setIconFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ─── ホーム背景画像 ───────────────────────────────────────────
    const [bgPreviewUrl, setBgPreviewUrl] = useState<string | null>(accountStore.get().homeBgUrl);
    const [bgFile, setBgFile] = useState<File | null>(null);
    const [isBgDragging, setIsBgDragging] = useState(false);
    const [bgErrorMsg, setBgErrorMsg] = useState('');
    const bgFileInputRef = useRef<HTMLInputElement>(null);

    const loadBgFile = useCallback((file: File) => {
        setBgErrorMsg('');
        if (!file.type.startsWith('image/')) {
            setBgErrorMsg('画像ファイル（PNG / JPG / GIF / WebP）を選択してください。');
            return;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setBgErrorMsg(`ファイルサイズが大きすぎます（最大 ${MAX_FILE_SIZE_MB}MB）。`);
            return;
        }
        setBgFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setBgPreviewUrl(ev.target?.result as string);
        reader.readAsDataURL(file);
    }, []);

    const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) loadBgFile(file);
    };

    const handleBgDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsBgDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) loadBgFile(file);
    };

    const handleBgDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsBgDragging(true);
    };
    const handleBgDragLeave = () => setIsBgDragging(false);

    const handleClearBg = () => {
        setBgPreviewUrl(null);
        setBgFile(null);
        if (bgFileInputRef.current) bgFileInputRef.current.value = '';
    };
    // ─────────────────────────────────────────────────────────────

    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch {}
        localStorage.removeItem('authToken');
        accountStore.clear();
        navigate('/login');
    };

    const handleSave = async () => {
        setErrorMsg('');
        try {
            // プロフィール更新（username / email）
            const res = await authApi.updateProfile({
                username: editDisplayName.trim(),
                email: editEmail.trim(),
            });
            if (res.success && res.data) {
                const u = res.data as any;
                accountStore.updateProfile(u.username, u.email);
            }
        } catch (err: any) {
            setErrorMsg(err?.response?.data?.message || 'プロフィールの保存に失敗しました。');
            return;
        }

        // アイコン画像のアップロード
        if (iconFile) {
            try {
                const res = await authApi.uploadIcon(iconFile);
                if (res.success && res.data) {
                    accountStore.updateIconUrl(res.data.icon_url);
                }
            } catch {
                setErrorMsg('アイコン画像のアップロードに失敗しました。');
                return;
            }
        } else if (previewUrl === null && accountStore.get().iconUrl !== null) {
            // クリアされた場合はサーバーからも削除
            await authApi.deleteIcon().catch(() => {});
            accountStore.updateIconUrl(null);
        }

        // 背景画像のアップロード
        if (bgFile) {
            try {
                const res = await authApi.uploadHomeBg(bgFile);
                if (res.success && res.data) {
                    accountStore.updateHomeBgUrl(res.data.home_bg_url);
                }
            } catch {
                setErrorMsg('背景画像のアップロードに失敗しました。');
                return;
            }
        } else if (bgPreviewUrl === null && accountStore.get().homeBgUrl !== null) {
            await authApi.deleteHomeBg().catch(() => {});
            accountStore.updateHomeBgUrl(null);
        }

        setAccount(accountStore.get());
        setShowSaveModal(true);
    };

    // モーダル表示後、一定時間で自動的にホーム画面へ遷移
    useEffect(() => {
        if (!showSaveModal) return;

        const timer = setTimeout(() => {
            navigate('/');
        }, 2000); // 2秒後に遷移

        return () => clearTimeout(timer);
    }, [showSaveModal, navigate]);

    return (
        <div className="account-page">
            <div className="account-card">
                <h1 className="account-card__title">アカウント情報</h1>

                <div className="account-body">

                    {/* ── 左列：アカウントアイコン ＋ 基本情報 ── */}
                    <div className="account-body__col">

                        {/* アカウントアイコン */}
                        <section className="account-section">
                            <h2 className="account-card__section-title">アカウントアイコン</h2>

                            <div className="account-icon-preview">
                                <div className="account-icon-preview__circle">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="プレビュー" />
                                    ) : (
                                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="アイコン未設定">
                                            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                                        </svg>
                                    )}
                                </div>
                                <div className="account-icon-preview__sample">
                                    <span className="account-icon-preview__sample-label">ヘッダー表示サイズ</span>
                                    <AccountIcon size={40} />
                                </div>
                            </div>

                            <div
                                className={`account-upload-zone ${isDragging ? 'account-upload-zone--dragging' : ''}`}
                                onClick={() => fileInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                                aria-label="アイコン画像をアップロード"
                            >
                                <svg className="account-upload-zone__icon" viewBox="0 0 24 24">
                                    <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                                </svg>
                                <p className="account-upload-zone__text">クリックまたはドラッグ＆ドロップ</p>
                                <p className="account-upload-zone__hint">正方形推奨（PNG/JPG/GIF/WebP、最大 {MAX_FILE_SIZE_MB}MB）</p>
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                                onChange={handleFileChange} id="account-icon-input" />

                            {errorMsg && <p className="account-card__error">{errorMsg}</p>}
                            {previewUrl && (
                                <button className="account-btn account-btn--danger" onClick={handleClearIcon} type="button">
                                    アイコンを削除
                                </button>
                            )}
                        </section>

                        {/* 基本情報 */}
                        <section className="account-section">
                            <h2 className="account-card__section-title">基本情報</h2>
                            <div className="account-form">
                                <div className="account-form__group">
                                    <label className="account-form__label" htmlFor="account-display-name">表示名</label>
                                    <input
                                        id="account-display-name"
                                        type="text"
                                        className="account-form__input"
                                        value={editDisplayName}
                                        onChange={(e) => setEditDisplayName(e.target.value)}
                                        placeholder="例：山田 太郎"
                                        maxLength={50}
                                    />
                                </div>
                                <div className="account-form__group">
                                    <label className="account-form__label" htmlFor="account-email">メールアドレス</label>
                                    <input
                                        id="account-email"
                                        type="email"
                                        className="account-form__input"
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        placeholder="例：taro@example.com"
                                    />
                                </div>
                            </div>
                        </section>

                    </div>{/* ／左列 */}

                    {/* ── 右列：ホーム画面の背景画像 ── */}
                    <div className="account-body__col">
                        <section className="account-section">
                            <h2 className="account-card__section-title">ホーム画面の背景画像</h2>

                            <div className="account-bg-preview">
                                <div className="account-bg-preview__frame">
                                    {bgPreviewUrl ? (
                                        <img src={bgPreviewUrl} alt="ホーム背景プレビュー" />
                                    ) : (
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            background: 'linear-gradient(135deg, #f3f4f6, #d1d5db, #9ca3af)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#6b7280',
                                            fontSize: '13px',
                                        }}>
                                            未設定
                                        </div>
                                    )}
                                </div>
                                <p className="account-bg-preview__caption">
                                    {bgPreviewUrl ? '登録済みの画像' : '未設定（グラデーション表示）'}
                                </p>
                            </div>

                            <div
                                className={`account-upload-zone ${isBgDragging ? 'account-upload-zone--dragging' : ''}`}
                                onClick={() => bgFileInputRef.current?.click()}
                                onDrop={handleBgDrop}
                                onDragOver={handleBgDragOver}
                                onDragLeave={handleBgDragLeave}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && bgFileInputRef.current?.click()}
                                aria-label="ホーム背景画像をアップロード"
                            >
                                <svg className="account-upload-zone__icon" viewBox="0 0 24 24">
                                    <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                                </svg>
                                <p className="account-upload-zone__text">クリックまたはドラッグ＆ドロップ</p>
                                <p className="account-upload-zone__hint">横長画像推奨（PNG/JPG/GIF/WebP、最大 {MAX_FILE_SIZE_MB}MB）</p>
                            </div>
                            <input ref={bgFileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                                onChange={handleBgFileChange} id="account-bg-input" />

                            {bgErrorMsg && <p className="account-card__error">{bgErrorMsg}</p>}
                            {bgPreviewUrl && (
                                <button className="account-btn account-btn--danger" onClick={handleClearBg} type="button">
                                    背景画像を削除（デフォルトに戻す）
                                </button>
                            )}
                        </section>
                    </div>{/* ／右列 */}

                    {/* ── フッター：ログアウト（左）/ 保存（右） ── */}
                    <div className="account-body__footer">
                        <button className="account-btn account-btn--logout" onClick={handleLogout} type="button">
                            ログアウト
                        </button>
                        <button className="account-btn account-btn--primary" onClick={handleSave} type="button">
                            保存する
                        </button>
                    </div>

                </div>{/* ／account-body */}
            </div>

            {/* 保存完了モーダル */}
            {showSaveModal && (
                <div className="account-modal-overlay" onClick={() => navigate('/')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/')}>
                    <div className="account-modal">
                        <p className="account-modal__text">保存しました。</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountPage;
