import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import FocusLock from 'react-focus-lock';
import AccountIcon from './AccountIcon';
import { Button } from '@/components/ui/button';

// ドロワーの transition-transform duration-300（Tailwind クラス）と対応する値。
// クラス側を変更する場合はこの定数も合わせて更新すること。
const DRAWER_TRANSITION_MS = 300;

const navItems = [
    { label: 'ホーム', subLabel: 'HOME', path: '/' },
    { label: '食材追加', subLabel: 'ADD', path: '/ingredients/add' },
    { label: '食材検索', subLabel: 'SEARCH', path: '/ingredients/search' },
    { label: '食材編集', subLabel: 'EDIT', path: '/ingredients/edit' },
    { label: '一覧', subLabel: 'LIST', path: '/list' },
    { label: '仕込み', subLabel: 'PREP', path: '/dishes/prep' },
    { label: 'お品', subLabel: 'DISH', path: '/dishes/large' },
    { label: '購入先', subLabel: 'STORES', path: '/stores' },
    { label: 'ジャンル', subLabel: 'GENRE', path: '/genres' },
    { label: '販売価格計算', subLabel: 'CALCULATOR', path: '/calculator' },
];

interface HeaderProps {
    // ドロワーの開閉状態は Layout が保持する（#146: main/header への inert 付与に必要）
    drawerOpen: boolean;
    setDrawerOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ drawerOpen, setDrawerOpen }) => {
    const navigate = useNavigate();

    const closeDrawer = useCallback(() => setDrawerOpen(false), [setDrawerOpen]);
    const drawerRef = useRef<HTMLDivElement>(null);

    // inert/invisible の実際の適用状態。drawerOpen とは非対称に扱う:
    // 開くとき: drawerOpen と同時（即座）に true にしてフォーカス可能にする
    // 閉じるとき: アニメーション（duration-300）終了まで true を維持し、
    //             画面上にまだ見えている間に inert でフォーカスが強制的に
    //             外れることを防ぐ（issue #136）
    const [isInteractive, setIsInteractive] = useState(false);

    useEffect(() => {
        if (drawerOpen) {
            setIsInteractive(true);
            return;
        }
        const node = drawerRef.current;
        if (!node) {
            setIsInteractive(false);
            return;
        }
        const handleTransitionEnd = (e: TransitionEvent) => {
            if (e.propertyName !== 'transform') return; // transition-transform 以外は無視
            setIsInteractive(false);
        };
        node.addEventListener('transitionend', handleTransitionEnd);
        // transitionend が発火しない環境（アニメーション中断等）向けのフォールバック
        const timer = setTimeout(() => setIsInteractive(false), DRAWER_TRANSITION_MS + 50);
        return () => {
            node.removeEventListener('transitionend', handleTransitionEnd);
            clearTimeout(timer);
        };
    }, [drawerOpen]);

    // ドロワー内へのフォーカス移動・トラップ・復帰（#145）は FocusLock に委譲する
    // （autoFocus で最初のフォーカス可能要素＝閉じるボタンへ移動、returnFocus で
    //   閉じた際にハンバーガーボタンへ復帰する）

    // Esc キーでドロワーを閉じる（open 時のみリスナー登録）
    useEffect(() => {
        if (!drawerOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeDrawer();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [drawerOpen, closeDrawer]);

    // ドロワー展開中は背景スクロールを禁止
    // paddingRight でスクロールバー消失時のレイアウトシフトを防止
    // cleanup は開いているときのみ解除し、他コンポーネントの body.overflow を上書きしない
    useEffect(() => {
        if (!drawerOpen) return;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${scrollbarWidth}px`;
        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [drawerOpen]);

    // アカウント画面へ遷移（ドロワーが開いている場合のみ閉じる）
    const handleAccountNav = () => {
        if (drawerOpen) closeDrawer();
        navigate('/account');
    };

    return (
        <>
            {/* ドロワー展開中はヘッダーを inert にし、背後のコンテンツへのフォーカス・
                読み上げを防ぐ（#146）。drawerOpen に同期して即時切り替えるため、
                閉じた瞬間には解除済みで、FocusLock の returnFocus によるハンバーガー
                ボタンへのフォーカス復帰（下記）を妨げない。 */}
            <header
                inert={drawerOpen ? '' : undefined}
                className="h-[80px] bg-[#d9d9d9] flex items-center px-0 sticky top-0 z-50 overflow-visible border-b border-gray-300">
                {/* Account Icon Area */}
                <div className="flex items-center h-full relative" style={{ minWidth: '150px' }}>
                    <div className="absolute top-0 left-0 z-50 flex items-center justify-center" style={{ height: '80px', width: '80px' }}>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleAccountNav}
                            className="h-11 w-11 rounded-full p-0"
                            title="アカウント情報"
                            aria-label="アカウント情報を表示"
                        >
                            <AccountIcon size={40} />
                        </Button>
                    </div>

                    <div className="w-[1px] h-8 bg-[#888] mx-6 ml-20 hidden sm:block" />

                    <h2 className="text-xl font-bold text-black tracking-tight self-center whitespace-nowrap hidden sm:block">
                        料理原価計算システム
                    </h2>
                </div>

                {/* Desktop Navigation */}
                <nav className="ml-auto items-center h-full gap-0 pr-4 hidden sm:flex">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center h-full px-5 transition-all duration-200 hover:bg-white/30 ${isActive ? 'text-black font-bold' : 'text-gray-700'
                                }`
                            }
                        >
                            <span className="text-[15px] leading-tight mb-1">{item.label}</span>
                            {item.subLabel && (
                                <span className="text-[9px] font-bold tracking-widest opacity-80">{item.subLabel}</span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Mobile: Title + Hamburger */}
                <div className="sm:hidden ml-auto flex items-center gap-3 pr-4">
                    <span className="text-sm font-bold text-black tracking-tight">料理原価計算システム</span>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setDrawerOpen(true)}
                        aria-label="メニューを開く"
                        aria-expanded={drawerOpen}
                        aria-controls="mobile-drawer"
                        className="h-11 w-11 flex-col gap-1.25 rounded-lg"
                    >
                        <span className="block w-6 h-0.5 bg-gray-700 rounded" />
                        <span className="block w-6 h-0.5 bg-gray-700 rounded" />
                        <span className="block w-6 h-0.5 bg-gray-700 rounded" />
                    </Button>
                </div>
            </header>

            {/* Mobile Drawer Overlay */}
            {drawerOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[60] sm:hidden"
                    onClick={closeDrawer}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Drawer
                - inert: フォーカスを完全にブロック（モダンブラウザ）
                - invisible: inert 非対応ブラウザでもフォーカスを排除
                inert/invisible は isInteractive（閉じる際はアニメーション終了まで
                true を維持）で制御し、translate-x は drawerOpen で即座に切り替える。
                これにより閉じるアニメーション中（まだ画面上に見えている間）に
                フォーカスが強制的に外れることを防ぐ（issue #136）。
                visibility の初期値は visible なので、明示的な visible クラスは
                不要（invisible クラスの有無だけで制御できる）。
                FocusLock（#145）: disabled={!drawerOpen} で開閉に同期。
                autoFocus で最初のフォーカス可能要素（閉じるボタン）へ自動移動、
                returnFocus で閉じた際にハンバーガーボタンへ復帰する。 */}
            <FocusLock disabled={!drawerOpen} returnFocus autoFocus>
                <div
                    ref={drawerRef}
                    id="mobile-drawer"
                    role="dialog"
                    aria-modal="true"
                    aria-label="ナビゲーションメニュー"
                    inert={!isInteractive ? '' : undefined}
                    className={`fixed top-0 right-0 h-full w-[280px] bg-white z-[70] shadow-2xl transition-transform duration-300 sm:hidden flex flex-col ${drawerOpen ? 'translate-x-0' : 'translate-x-full'} ${isInteractive ? '' : 'invisible'}`}
                >
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                        <span className="font-bold text-gray-800">メニュー</span>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={closeDrawer}
                            aria-label="メニューを閉じる"
                            className="h-10 w-10 rounded-lg text-2xl leading-none text-gray-500"
                        >
                            ✕
                        </Button>
                    </div>

                    {/* Drawer Nav Items */}
                    <nav className="flex-1 overflow-y-auto py-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={closeDrawer}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-5 py-4 text-base transition-colors ${isActive
                                        ? 'bg-gray-100 font-bold text-black'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`
                                }
                            >
                                <span className="flex-1">{item.label}</span>
                                {item.subLabel && (
                                    <span className="text-[10px] font-bold text-gray-400 tracking-widest">{item.subLabel}</span>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Drawer Footer: Account */}
                    <div className="border-t border-gray-200 p-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleAccountNav}
                            className="h-auto w-full justify-start gap-3 px-4 py-3 font-normal text-gray-700"
                        >
                            <AccountIcon size={28} />
                            <span className="text-base">アカウント</span>
                        </Button>
                    </div>
                </div>
            </FocusLock>
        </>
    );
};

export default Header;
