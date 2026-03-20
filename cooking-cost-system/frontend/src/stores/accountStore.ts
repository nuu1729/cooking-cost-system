/**
 * アカウント情報のストア（localStorageベース）
 * 将来的にはAPIと連携することを想定したシンプルな実装
 */

const STORAGE_KEY = 'account_info';

export interface AccountInfo {
    displayName: string;
    email: string;
    iconDataUrl: string | null;    // base64エンコードされたアカウントアイコン
    homeBgDataUrl: string | null;  // base64エンコードされたホーム画面背景画像
}

const DEFAULT_ACCOUNT: AccountInfo = {
    displayName: '',
    email: '',
    iconDataUrl: null,
    homeBgDataUrl: null,
};

export const accountStore = {
    get(): AccountInfo {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { ...DEFAULT_ACCOUNT };
            return { ...DEFAULT_ACCOUNT, ...JSON.parse(raw) };
        } catch {
            return { ...DEFAULT_ACCOUNT };
        }
    },

    save(info: Partial<AccountInfo>): AccountInfo {
        const current = this.get();
        const updated = { ...current, ...info };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        // カスタムイベントで変更を通知
        window.dispatchEvent(new CustomEvent('account-updated', { detail: updated }));
        return updated;
    },

    clearIcon(): AccountInfo {
        return this.save({ iconDataUrl: null });
    },

    clearHomeBg(): AccountInfo {
        return this.save({ homeBgDataUrl: null });
    },
};
