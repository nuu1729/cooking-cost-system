export interface AccountInfo {
    userId: number | null;
    displayName: string;
    email: string;
    iconUrl: string | null;      // サーバー上の画像URL
    homeBgUrl: string | null;    // サーバー上の画像URL
}

const EMPTY: AccountInfo = {
    userId: null,
    displayName: '',
    email: '',
    iconUrl: null,
    homeBgUrl: null,
};

let current: AccountInfo = { ...EMPTY };

function dispatch(info: AccountInfo) {
    window.dispatchEvent(new CustomEvent('account-updated', { detail: info }));
}

export const accountStore = {
    initForUser(userId: number, username: string, email: string, iconUrl: string | null = null, homeBgUrl: string | null = null): AccountInfo {
        current = { userId, displayName: username, email, iconUrl, homeBgUrl };
        dispatch(current);
        return { ...current };
    },

    get(): AccountInfo {
        return { ...current };
    },

    updateProfile(displayName: string, email: string): AccountInfo {
        current = { ...current, displayName, email };
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
