/**
 * 画面をまたいで使い回す Tailwind クラスの断片。
 *
 * shadcn/ui の Button/Input は既定サイズが小さめ（h-8）なため、
 * マスタ管理系画面の大きめCTAのように「複数画面で同じ見た目を揃えたい」
 * ものはここに集約する。個別画面でしか使わないクラスは各画面に置くこと。
 *
 * ⚠ MASTER_CTA_* / MASTER_DIALOG_CTA_* は **`variant="ghost"` と組み合わせる前提**。
 * ghost は背景色も文字色も持たない（hover 時のみ効く）ため、
 * 既定 variant の bg-primary / text-primary-foreground と競合しない。
 * ただし ghost は hover:bg-muted / hover:text-foreground を持つので、
 * 各定数で hover:bg-* と hover:text-* を明示して打ち消している
 * （打ち消しを忘れるとホバー時だけ配色が変わる）。
 *
 * variant="secondary" は使わない: --color-secondary は oklch(0.97 0 0) で
 * 本画面群が使う gray-100 とは別の灰色になるため。
 */

/**
 * マスタ管理系画面（stores / genres など）の縦積みCTAボタン。
 *
 * h-auto: shadcn Button 既定の h-8 を解除し、py-4 でボタン高を決めるため。
 * 文字色は利用箇所すべてが白なので text-white / hover:text-white を含める
 * （hover 側は ghost の hover:text-foreground を打ち消すために必須）。
 * 背景色は画面ごとに異なるため含めない（呼び出し側で bg- 系と hover:bg- 系を足す）。
 */
export const MASTER_CTA_BASE =
    'w-full h-auto py-4 rounded-2xl text-lg font-bold shadow transition-all text-white hover:text-white';

/**
 * 上記CTAの下に置く副次ボタン（キャンセル等）。
 */
export const MASTER_CTA_SECONDARY =
    'w-full h-auto py-3 rounded-2xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 hover:text-gray-600 transition-all';

/**
 * マスタ管理系画面の削除確認ダイアログ内のボタン（危険操作 / キャンセル）。
 *
 * MASTER_CTA_* とは別定数にしている。見た目が近いが、ダイアログ内は
 * text-lg と shadow を持たないため MASTER_CTA_BASE を流用すると
 * 文字サイズと影が変わってしまうため。
 */
export const MASTER_DIALOG_CTA_DANGER =
    'w-full h-auto py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 hover:text-white transition-all';

export const MASTER_DIALOG_CTA_CANCEL =
    'w-full h-auto py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 hover:text-gray-600 transition-all';

/**
 * マスタ管理系画面のテキスト入力。
 *
 * md:text-lg を明示している理由:
 * tailwind-merge は修飾子（`md:` など）ごとに別グループとして競合解決するため、
 * 修飾子なしの `text-lg` は shadcn Input 既定の `md:text-sm` とは競合せず
 * 両方が残る。結果 md 以上では CSS の詳細度で `md:text-sm` が効いて文字が縮む。
 * 同じ修飾子を持つ `md:text-lg` を書くことで初めて上書きできる
 * （Input は `cn(基底クラス, className)` の順なので className 側が勝つ）。
 * フォーカスリング色は画面ごとに異なるため含めない。
 */
export const MASTER_INPUT_BASE =
    'h-auto px-5 py-4 bg-[#f0f0f0] border-2 border-transparent rounded-2xl text-lg md:text-lg transition-all focus-visible:border-transparent';
