import React, { useEffect, useState } from 'react';
import { accountStore } from '../../stores/accountStore';

interface AccountIconProps {
    /** アイコンの直径（px）。デフォルト40 */
    size?: number;
    onClick?: () => void;
    className?: string;
}

/**
 * アカウントアイコン
 * - アイコン未登録：人型シルエットSVG
 * - アイコン登録済み：円形切り抜き画像
 */
const AccountIcon: React.FC<AccountIconProps> = ({ size = 40, onClick, className = '' }) => {
    const [iconDataUrl, setIconDataUrl] = useState<string | null>(null);

    // 初期ロード
    useEffect(() => {
        setIconDataUrl(accountStore.get().iconDataUrl);
    }, []);

    // 他コンポーネントからの更新を受け取る
    useEffect(() => {
        const handler = (e: Event) => {
            const custom = e as CustomEvent;
            setIconDataUrl(custom.detail?.iconDataUrl ?? null);
        };
        window.addEventListener('account-updated', handler);
        return () => window.removeEventListener('account-updated', handler);
    }, []);

    const containerStyle: React.CSSProperties = {
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#c8c8c8',
        border: '2px solid #aaa',
        flexShrink: 0,
        transition: 'box-shadow 0.2s',
    };

    return (
        <div
            style={containerStyle}
            onClick={onClick}
            className={`account-icon-wrapper ${className}`}
            title="アカウント情報"
        >
            {iconDataUrl ? (
                <img
                    src={iconDataUrl}
                    alt="アカウントアイコン"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            ) : (
                // 人型シルエット SVG
                <svg
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ width: '70%', height: '70%', fill: '#fff' }}
                    aria-label="アカウントアイコン（未設定）"
                >
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
            )}
        </div>
    );
};

export default AccountIcon;
