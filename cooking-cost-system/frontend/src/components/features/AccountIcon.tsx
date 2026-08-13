import React, { useEffect, useState } from 'react';
import { accountStore } from '../../stores/accountStore';
import { cn } from '@/lib/utils';

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
    const [iconUrl, setIconUrl] = useState<string | null>(accountStore.get().iconUrl);

    useEffect(() => {
        const handler = (e: Event) => {
            const custom = e as CustomEvent;
            setIconUrl(custom.detail?.iconUrl ?? null);
        };
        window.addEventListener('account-updated', handler);
        return () => window.removeEventListener('account-updated', handler);
    }, []);

    return (
        <div
            // width/height はプロップで動的に決まるため、Tailwind の静的クラスでは
            // 表現できず inline style のままにしている（他のスタイルは Tailwind 化済み）
            style={{ width: size, height: size }}
            onClick={onClick}
            className={cn(
                'flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#aaa] bg-[#c8c8c8] transition-shadow',
                onClick ? 'cursor-pointer' : 'cursor-default',
                className
            )}
            title="アカウント情報"
        >
            {iconUrl ? (
                <img
                    src={iconUrl}
                    alt="アカウントアイコン"
                    className="h-full w-full object-cover"
                />
            ) : (
                // 人型シルエット SVG
                <svg
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-[70%] w-[70%] fill-white"
                    aria-label="アカウントアイコン（未設定）"
                >
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
            )}
        </div>
    );
};

export default AccountIcon;
