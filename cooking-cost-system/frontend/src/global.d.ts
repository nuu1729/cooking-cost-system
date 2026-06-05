// React の型定義に inert 属性を追加（React 19 で正式対応予定）
// inert='' → 要素を無効化（フォーカス・クリック・スクリーンリーダーをブロック）
// inert={undefined} → 通常状態（属性なし）
// boolean は許容しない（inert={false} のような誤用を防ぐため）
declare module 'react' {
    interface HTMLAttributes<T> {
        inert?: '' | undefined;
    }
}
