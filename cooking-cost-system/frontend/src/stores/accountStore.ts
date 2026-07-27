export interface AccountInfo {
    userId: number | null;
    displayName: string;
    email: string;
    emailVerified: boolean;
    iconUrl: string | null;      // サーバー上の画像URL
    homeBgUrl: string | null;    // サーバー上の画像URL
}

const EMPTY: AccountInfo = {
    userId: null,
    displayName: '',
    email: '',
    emailVerified: true,
    iconUrl: null,
    homeBgUrl: null,
};

let current: AccountInfo = { ...EMPTY };

function dispatch(info: AccountInfo) {
    window.dispatchEvent(new CustomEvent('account-updated', { detail: info }));
}

export const accountStore = {
    initForUser(userId: number, username: string, email: string, emailVerified: boolean = true, iconUrl: string | null = null, homeBgUrl: string | null = null): AccountInfo {
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
