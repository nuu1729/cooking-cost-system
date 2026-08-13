/**
 * 画面をまたいで使い回す Button / Input のスタイル定義。
 *
 * shadcn/ui の Button/Input は既定サイズが小さめ（h-8）なため、
 * マスタ管理系画面の大きめCTAのように「複数画面で同じ見た目を揃えたい」
 * ものはここに集約する。個別画面でしか使わないクラスは各画面に置くこと。
 *
 * Button 系は **クラス文字列を直接 export せず、`variant` とセットで返す
 * ファクトリ関数だけを export している**。
 * これらのクラスは `variant="ghost"` と組み合わせる前提で書かれており、
 * 別の variant と組み合わせると二重にスタイルが当たるため、
 * 呼び出し側が variant を選べないようにして誤用を防ぐ。
 *
 * なぜ ghost 前提か:
 * - ghost は背景色も文字色も持たない（hover 時のみ効く）ので、
 *   既定 variant の bg-primary / text-primary-foreground と競合しない
 * - ghost が持つ hover:bg-muted / hover:text-foreground は、
 *   各クラス側の hover:bg-* / hover:text-* で打ち消している
 *   （打ち消しを忘れるとホバー時だけ配色が変わる）
 * - secondary は使わない: --color-secondary は oklch(0.97 0 0) で、
 *   本画面群が使う gray-100 とは別の灰色になるため
 */

/**
 * ファクトリが返す Button props。`{...}` で展開して使う。
 *
 * ⚠ **スプレッドは属性リストの最後に置くこと。**
 * JSX は後に書かれた props が勝つため、
 * `<Button {...masterCta(...)} variant="secondary">` のように
 * スプレッドより後ろに variant を書くと ghost 前提が壊れる
 * （`<Button variant="secondary" {...masterCta(...)}>` の順なら ghost が勝つ）。
 * 型では防げないため、この規約を守ること。
 */
type MasterButtonProps = { variant: 'ghost'; className: string };

/** クラス片を空要素を除いて連結する。 */
const join = (...parts: string[]) => parts.filter(Boolean).join(' ');

/**
 * マスタ管理系画面（stores / genres など）の縦積みCTAボタン。
 *
 * h-auto: shadcn Button 既定の h-8 を解除し、py-4 でボタン高を決めるため。
 * 文字色は利用箇所すべてが白なので text-white / hover:text-white を含める
 * （hover 側は ghost の hover:text-foreground を打ち消すために必須）。
 * 背景色は画面ごとに異なるため引数で受け取る。
 */
const MASTER_CTA_BASE =
    'w-full h-auto py-4 rounded-2xl text-lg font-bold shadow transition-all text-white hover:text-white';

/** 上記CTAの下に置く副次ボタン（キャンセル等）。 */
const MASTER_CTA_SECONDARY =
    'w-full h-auto py-3 rounded-2xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 hover:text-gray-600 transition-all';

/**
 * マスタ管理系画面の削除確認ダイアログ内のボタン（危険操作 / キャンセル）。
 *
 * MASTER_CTA_* とは別にしている。見た目が近いが、ダイアログ内は
 * text-lg と shadow を持たないため MASTER_CTA_BASE を流用すると
 * 文字サイズと影が変わってしまうため。
 */
const MASTER_DIALOG_CTA_DANGER =
    'w-full h-auto py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 hover:text-white transition-all';

const MASTER_DIALOG_CTA_CANCEL =
    'w-full h-auto py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 hover:text-gray-600 transition-all';

/**
 * 縦積みCTA。背景色は画面ごとに異なるため引数で渡す。
 * 例: masterCta('bg-[#f97316] hover:bg-orange-600')
 */
export const masterCta = (colorClasses: string, extraClasses = ''): MasterButtonProps => ({
    variant: 'ghost',
    className: join(MASTER_CTA_BASE, colorClasses, extraClasses),
});

/** CTA の下に置く副次ボタン（キャンセル等）。 */
export const masterCtaSecondary = (): MasterButtonProps => ({
    variant: 'ghost',
    className: MASTER_CTA_SECONDARY,
});

/** 削除確認ダイアログの危険操作ボタン。 */
export const masterDialogCtaDanger = (): MasterButtonProps => ({
    variant: 'ghost',
    className: MASTER_DIALOG_CTA_DANGER,
});

/** 削除確認ダイアログのキャンセルボタン。 */
export const masterDialogCtaCancel = (): MasterButtonProps => ({
    variant: 'ghost',
    className: MASTER_DIALOG_CTA_CANCEL,
});

/**
 * テキスト入力の共通コア。
 *
 * 画面によって異なる「幅・padding・フォーカス表現」は含めず、
 * 全画面で揃えたい部分（背景・角丸・枠線の初期値・文字サイズ）だけを持つ。
 * 実際に使うのは下の masterInput / formInput。
 *
 * md:text-lg を明示している理由:
 * tailwind-merge は修飾子（`md:` など）ごとに別グループとして競合解決するため、
 * 修飾子なしの `text-lg` は shadcn Input 既定の `md:text-sm` とは競合せず
 * 両方が残る。結果 md 以上では CSS の詳細度で `md:text-sm` が効いて文字が縮む。
 * 同じ修飾子を持つ `md:text-lg` を書くことで初めて上書きできる
 * （Input は `cn(基底クラス, className)` の順なので className 側が勝つ）。
 *
 */
const INPUT_CORE =
    'h-auto bg-[#f0f0f0] border-2 border-transparent rounded-2xl text-lg md:text-lg transition-all';

/**
 * マスタ管理系画面（stores / genres）のテキスト入力。padding は px-5。
 *
 * `focus-visible:border-transparent` は意図的な指定で、
 * shadcn Input 基底の `focus-visible:border-ring` を打ち消している。
 * （`border-transparent` と `focus-visible:border-transparent` は
 * tailwind-merge では別グループ扱いなので、基底値と同値でも打ち消しに必要。）
 * これによりフォーカス表現を「枠線＋リング」の二重ではなく、
 * focusClasses で渡す単色リングだけに統一している
 * （移行前のデザインが outline-none + 単色リングだったのを踏襲）。
 *
 * 例: masterInput('focus-visible:ring-2 focus-visible:ring-orange-400')
 */
export const masterInput = (focusClasses: string, extraClasses = '') =>
    join(INPUT_CORE, 'px-5 py-4 focus-visible:border-transparent', focusClasses, extraClasses);

/**
 * 食材フォーム系画面（add / edit / search）のテキスト入力。
 * マスタ管理系より padding が広く（px-6）、既定で幅いっぱい。
 *
 * フォーカス表現は画面ごとに異なる（search は枠線+淡いリング、
 * edit は枠線なし+濃いリング）ため focusClasses で丸ごと受け取る。
 *
 * 例: formInput('focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-emerald-500',
 *               'aria-invalid:bg-red-50')
 */
export const formInput = (focusClasses: string, extraClasses = '') =>
    join(INPUT_CORE, 'w-full px-6 py-4', focusClasses, extraClasses);
