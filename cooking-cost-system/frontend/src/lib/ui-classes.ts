/**
 * 画面をまたいで使い回す Tailwind クラスの断片。
 *
 * shadcn/ui の Button/Input は既定サイズが小さめ（h-8）なため、
 * マスタ管理系画面の大きめCTAのように「複数画面で同じ見た目を揃えたい」
 * ものはここに集約する。個別画面でしか使わないクラスは各画面に置くこと。
 */

/**
 * マスタ管理系画面（stores / genres など）の縦積みCTAボタン。
 *
 * h-auto: shadcn Button 既定の h-8 を解除し、py-4 でボタン高を決めるため。
 * 配色は画面ごとに異なるため含めない（呼び出し側で bg- 系と hover:bg- 系を足す）。
 */
export const MASTER_CTA_BASE =
    'w-full h-auto py-4 rounded-2xl text-lg font-bold shadow transition-all';

/**
 * 上記CTAの下に置く副次ボタン（キャンセル等）。
 */
export const MASTER_CTA_SECONDARY =
    'w-full h-auto py-3 rounded-2xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-all';

/**
 * マスタ管理系画面のテキスト入力。
 *
 * md:text-lg を明示しているのは、shadcn Input 既定の `md:text-sm` が
 * ブレークポイント付きクラスであり `text-lg` だけでは tailwind-merge で
 * 打ち消せず、md 以上で文字が縮んでしまうため。
 * フォーカスリング色は画面ごとに異なるため含めない。
 */
export const MASTER_INPUT_BASE =
    'h-auto px-5 py-4 bg-[#f0f0f0] border-2 border-transparent rounded-2xl text-lg md:text-lg transition-all focus-visible:border-transparent';
