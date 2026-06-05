// React の型定義に inert 属性を追加（React 19 で正式対応予定）
declare module 'react' {
    interface HTMLAttributes<T> {
        inert?: '' | undefined;
    }
}
