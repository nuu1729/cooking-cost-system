export interface AccountInfo {
    userId: number | null;
    displayName: string;
    email: string;
    emailVerified: boolean;
    iconUrl: string | null;      // サーバー上の画像URL
    homeBgUrl: string | null;    // サーバー上の画像URL
}

// 未ログイン状態のデフォルト。emailVerified は「未確認」を安全側のデフォルトとする
// （ログイン後は initForUser が実サーバー値で必ず上書きするため、実際に画面に
// 表示されることはない。Protected route により未ログインでは AccountPage 自体が
// 描画されないため到達不能だが、将来この既定値を参照するコードが増えた場合に
// 誤って「確認済み」と判定されるのを防ぐため）
const EMPTY: AccountInfo = {
    userId: null,
    displayName: '',
    email: '',
    emailVerified: false,
    iconUrl: null,
    homeBgUrl: null,
};

let current: AccountInfo = { ...EMPTY };

function dispatch(info: AccountInfo) {
    window.dispatchEvent(new CustomEvent('account-updated', { detail: info }));
}

export const accountStore = {
    initForUser(userId: number, username: string, email: string, emailVerified: boolean = false, iconUrl: string | null = null, homeBgUrl: string | null = null): AccountInfo {
        current = { userId, displayName: username, email, emailVerified, iconUrl, homeBgUrl };
        dispatch(current);
        return { ...current };
    },

    get(): AccountInfo {
        return { ...current };
    },

    updateProfile(displayName: string, email: string, emailVerified: boolean = current.emailVerified): AccountInfo {
        current = { ...current, displayName, email, emailVerified };
        dispatch(current);
        return { ...current };
    },

    updateIconUrl(iconUrl: string | null): AccountInfo {
        current = { ...current, iconUrl };
        dispatch(current);
        return { ...current };
    },

    updateHomeBgUrl(homeBgUrl: string | null): AccountInfo {
        current = { ...current, homeBgUrl };
        dispatch(current);
        return { ...current };
    },

    clear(): void {
        current = { ...EMPTY };
        dispatch(current);
    },
};
