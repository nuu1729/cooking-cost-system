// React の型定義に inert 属性を追加（React 19 で正式対応予定）
// inert 属性: '' を渡す = 要素を無効化、undefined = 有効
// boolean は許容しない（inert={false} のような誤用を防ぐため）
declare module 'react' {
    interface HTMLAttributes<T> {
        inert?: '' | undefined;
    }
}
