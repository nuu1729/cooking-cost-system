// React の型定義に inert 属性を追加
// inert 属性: 存在する（''）= 要素を無効化、undefined = 有効
// React 19 では boolean 型として正式対応予定のため、先行して boolean も許容しておく
declare module 'react' {
    interface HTMLAttributes<T> {
        inert?: '' | boolean | undefined;
    }
}
