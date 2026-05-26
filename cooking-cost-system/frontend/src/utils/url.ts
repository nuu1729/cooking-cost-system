/**
 * バックエンドの相対パスを絶対URLに変換するユーティリティ
 *
 * バックエンドは画像URLを /uploads/... の相対パスで返す。
 * フロントエンド（Vite dev server）からは /uploads/... は
 * バックエンドサーバーではなく Vite サーバーに向くため画像が表示されない。
 * この関数でバックエンドのオリジン（例: http://localhost:3001）を補完する。
 */

/** VITE_API_URL から /api サフィックスを除いたバックエンドのオリジン */
const BACKEND_ORIGIN = (() => {
    const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
    if (!apiUrl) {
        if (import.meta.env.PROD) {
            console.warn('[url] VITE_API_URL が設定されていません。本番環境では必ず設定してください。');
        }
        return 'http://localhost:3001';
    }
    // "http://localhost:3001/api" → "http://localhost:3001"
    return apiUrl.replace(/\/api\/?$/, '');
})();

/**
 * バックエンドから返された画像パスを絶対URLに変換する。
 * - null / undefined → null
 * - すでに http(s):// で始まる場合はそのまま返す
 * - /uploads/... などの相対パスにバックエンドオリジンを付与する
 */
export function toBackendUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    return `${BACKEND_ORIGIN}${path}`;
}
