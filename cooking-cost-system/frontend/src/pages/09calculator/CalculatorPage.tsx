import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dishApi } from '@/api';
import './CalculatorPage.scss';

// ── 判定型 ──────────────────────────────────────────────
type Judgment = 'excellent' | 'good' | 'warning' | 'danger';

const JUDGMENT: Record<Judgment, { mark: string; name: string; desc: string; cls: string }> = {
    excellent: {
        mark: '◎',
        name: '最適',
        desc: '三分法の目標原価率30%以内。十分な利益が期待できます。',
        cls: 'excellent',
    },
    good: {
        mark: '○',
        name: '適正',
        desc: '業界標準範囲内（30〜35%）。概ね健全な価格設定です。',
        cls: 'good',
    },
    warning: {
        mark: '△',
        name: '要注意',
        desc: '人件費・諸経費まで含めると収益が厳しくなる可能性があります。',
        cls: 'warning',
    },
    danger: {
        mark: '✗',
        name: '赤字リスク',
        desc: '食材費だけで売上の半分を超えています。価格改定を強く推奨します。',
        cls: 'danger',
    },
};

function judge(ratio: number): Judgment {
    if (ratio < 0.30) return 'excellent';
    if (ratio < 0.35) return 'good';
    if (ratio < 0.50) return 'warning';
    return 'danger';
}

// 10円単位で切り上げ
function ceilTo10(n: number): number {
    return Math.ceil(n / 10) * 10;
}

// ── お品データ型 ─────────────────────────────────────────
interface DishOption {
    id: number;
    name: string;
    total_cost: number;
    price: number;
    selling_price: number | null;
}

// ── 価格帯テーブル行 ─────────────────────────────────────
function buildPriceRows(cost: number, basePrice: number) {
    const factors = [0.70, 0.80, 0.90, 0.95, 1.00, 1.05, 1.10, 1.20, 1.30];
    return factors.map(f => {
        const p = Math.round(basePrice * f);
        const ratio = p > 0 ? cost / p : 0;
        return { price: p, ratio, profit: p - cost, judgment: judge(ratio), isCurrent: f === 1.00 };
    });
}

// ── コスト上昇行 ──────────────────────────────────────────
function buildCostRows(cost: number, price: number) {
    return [5, 10, 15, 20, 30].map(pct => {
        const newCost = cost * (1 + pct / 100);
        const ratio = price > 0 ? newCost / price : 0;
        return { pct, newCost, ratio, judgment: judge(ratio) };
    });
}

// ── スライダーの % 計算（CSS var 用）─────────────────────
function sliderPct(val: number, min: number, max: number): string {
    return `${((val - min) / (max - min)) * 100}%`;
}

// =====================================================
const CalculatorPage: React.FC = () => {
    const [dishes, setDishes] = useState<DishOption[]>([]);
    const [selectedId, setSelectedId] = useState<number | ''>('');
    const [cost, setCost] = useState<number>(0);
    const [priceInput, setPriceInput] = useState<string>('');
    const [targetRatio, setTargetRatio] = useState<number>(30);
    const [isLoading, setIsLoading] = useState(true);
    const [priceErr, setPriceErr] = useState(false);

    // お品一覧取得
    useEffect(() => {
        dishApi.getAll({ sortBy: 'name', sortOrder: 'ASC' })
            .then(res => {
                if (res.success && res.data) {
                    setDishes(res.data.map((d: any) => ({
                        id: d.id,
                        name: d.name,
                        total_cost: d.price ?? 0,
                        price: d.price ?? 0,
                        selling_price: d.selling_price ?? null,
                    })));
                }
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    // お品選択ハンドラー
    const handleSelect = (id: number | '') => {
        setSelectedId(id);
        if (id === '') { setCost(0); setPriceInput(''); return; }
        const d = dishes.find(x => x.id === id);
        if (d) {
            setCost(d.total_cost);
            setPriceInput(d.selling_price != null ? String(d.selling_price) : '');
            setPriceErr(false);
        }
    };

    // 販売価格のパース
    const price = useMemo(() => {
        const n = parseFloat(priceInput);
        return isNaN(n) || n <= 0 ? 0 : n;
    }, [priceInput]);

    const hasResult = selectedId !== '' && price > 0;

    // 指標計算
    const costRatio      = hasResult ? cost / price : 0;
    const grossProfit    = hasResult ? price - cost : 0;
    const grossProfitRatio = hasResult ? grossProfit / price : 0;
    const estimatedFL    = hasResult ? costRatio + 0.30 : 0; // 人件費30%推定
    const recommendedPrice = cost > 0 ? ceilTo10(cost / (targetRatio / 100)) : 0;
    const currentJudgment  = hasResult ? judge(costRatio) : null;
    const jConfig          = currentJudgment ? JUDGMENT[currentJudgment] : null;

    // 価格帯テーブル
    const priceRows = useMemo(
        () => hasResult ? buildPriceRows(cost, price) : [],
        [cost, price, hasResult]
    );

    // コスト上昇シミュレーション
    const costRows = useMemo(
        () => hasResult ? buildCostRows(cost, price) : [],
        [cost, price, hasResult]
    );

    // 三分法内訳（販売価格基準）
    const sanbu = useMemo(() => {
        if (!hasResult) return null;
        return {
            food    : { pct: costRatio * 100,        yen: cost },
            labor   : { pct: 30,                     yen: price * 0.30 },
            expense : { pct: 30,                     yen: price * 0.30 },
            profit  : { pct: Math.max(0, (1 - costRatio - 0.60) * 100), yen: Math.max(0, price - cost - price * 0.60) },
        };
    }, [cost, price, costRatio, hasResult]);

    return (
        <motion.div
            className="calc-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="calc-layout">

                {/* ===================== 左カラム ===================== */}
                <aside className="calc-left">
                    <div className="calc-header">
                        <div className="calc-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="calc-title">販売価格<br />シミュレーター</h1>
                            <p className="calc-desc">食材原価から適正価格を診断します。</p>
                        </div>
                    </div>

                    {/* お品選択 */}
                    <div className="calc-form-block">
                        <label className="calc-form-label">お品を選択</label>
                        {isLoading ? (
                            <div className="c-input c-input--readonly">読み込み中...</div>
                        ) : (
                            <select
                                className="c-select"
                                value={selectedId}
                                onChange={e => handleSelect(e.target.value === '' ? '' : Number(e.target.value))}
                            >
                                <option value="">-- 選択してください --</option>
                                {dishes.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* 食材原価（読み取り専用） */}
                    <div className="calc-form-block">
                        <label className="calc-form-label">食材原価</label>
                        <div className="c-price-row">
                            <span className="c-yen">¥</span>
                            <input
                                type="text"
                                className="c-input c-input--num c-input--readonly"
                                value={selectedId !== '' ? cost.toLocaleString() : ''}
                                readOnly
                                placeholder="0"
                                tabIndex={-1}
                            />
                        </div>
                    </div>

                    {/* 販売価格（手入力可） */}
                    <div className="calc-form-block">
                        <label className="calc-form-label">販売価格</label>
                        <div className="c-price-row">
                            <span className="c-yen">¥</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                className={`c-input c-input--num${priceErr ? ' c-input--err' : ''}`}
                                value={priceInput}
                                placeholder="例：980"
                                onChange={e => {
                                    const v = e.target.value;
                                    if (v === '' || /^\d*$/.test(v)) {
                                        setPriceInput(v);
                                        setPriceErr(false);
                                    }
                                }}
                                onBlur={() => {
                                    if (priceInput !== '' && (isNaN(parseFloat(priceInput)) || parseFloat(priceInput) <= 0)) {
                                        setPriceErr(true);
                                    }
                                }}
                            />
                        </div>
                        {priceErr && <p style={{ fontSize: '0.75rem', color: '#e87c6a', margin: '2px 0 0', fontWeight: 600 }}>正の数値を入力してください</p>}
                    </div>

                    {/* 目標原価率スライダー */}
                    <div className="calc-slider-wrap">
                        <div className="calc-slider-header">
                            <span className="calc-slider-label">目標原価率</span>
                            <span className="calc-slider-value">{targetRatio}%</span>
                        </div>
                        <input
                            type="range"
                            className="calc-slider"
                            min={20}
                            max={50}
                            step={1}
                            value={targetRatio}
                            style={{ '--pct': sliderPct(targetRatio, 20, 50) } as React.CSSProperties}
                            onChange={e => setTargetRatio(Number(e.target.value))}
                        />
                        <div className="calc-slider-hint">
                            <span>20%</span>
                            <span>三分法基準：30%</span>
                            <span>50%</span>
                        </div>
                    </div>

                    {/* 推奨販売価格 */}
                    {cost > 0 && (
                        <div className="recommended-box">
                            <span className="rec-label">推奨販売価格（目標{targetRatio}%）</span>
                            <span className="rec-value">¥{recommendedPrice.toLocaleString()}</span>
                        </div>
                    )}
                </aside>

                {/* ===================== 右カラム ===================== */}
                <main className="calc-right">
                    <AnimatePresence mode="wait">
                        {!hasResult ? (
                            <motion.div
                                key="empty"
                                className="calc-empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                お品を選択して販売価格を入力してください
                            </motion.div>
                        ) : (
                            <motion.div
                                key="result"
                                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* ── 判定バッジ ── */}
                                {jConfig && (
                                    <div className={`judgment-card judgment-card--${jConfig.cls}`}>
                                        <span className="judgment-mark">{jConfig.mark}</span>
                                        <div className="judgment-text">
                                            <p className="judgment-name">{jConfig.name}</p>
                                            <p className="judgment-desc">{jConfig.desc}</p>
                                        </div>
                                        <div className="judgment-ratio">
                                            <p className="jr-label">現在の原価率</p>
                                            <p className="jr-value">{(costRatio * 100).toFixed(1)}%</p>
                                        </div>
                                    </div>
                                )}

                                {/* ── 主要指標 ── */}
                                <div className="metrics-grid">
                                    <div className="metric-card">
                                        <p className="metric-label">粗利益</p>
                                        <p className="metric-value">¥{grossProfit.toLocaleString()}</p>
                                        <p className="metric-sub">販売価格 - 食材原価</p>
                                    </div>
                                    <div className="metric-card">
                                        <p className="metric-label">粗利益率</p>
                                        <p className="metric-value">{(grossProfitRatio * 100).toFixed(1)}%</p>
                                        <p className="metric-sub">目標：65%以上</p>
                                    </div>
                                    <div className="metric-card">
                                        <p className="metric-label">推定FL比率</p>
                                        <p className="metric-value" style={{ color: estimatedFL > 0.65 ? '#e87c6a' : estimatedFL > 0.60 ? '#f5a623' : '#3aad87' }}>
                                            {(estimatedFL * 100).toFixed(1)}%
                                        </p>
                                        <p className="metric-sub">F+L（人件費30%推定）</p>
                                    </div>
                                    <div className="metric-card">
                                        <p className="metric-label">推奨価格との差</p>
                                        <p className="metric-value" style={{ color: price >= recommendedPrice ? '#3aad87' : '#e87c6a' }}>
                                            {price >= recommendedPrice ? '+' : ''}{(price - recommendedPrice).toLocaleString()}円
                                        </p>
                                        <p className="metric-sub">推奨：¥{recommendedPrice.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* ── 三分法内訳 ── */}
                                {sanbu && (
                                    <div className="sanbu-card">
                                        <p className="sanbu-title">三分法による価格構成イメージ（¥{price.toLocaleString()} 基準）</p>
                                        <div className="sanbu-rows">
                                            {[
                                                { label: `食材費`, cls: 'food',    pct: sanbu.food.pct,    yen: sanbu.food.yen,    est: false },
                                                { label: `人件費`,   cls: 'labor',   pct: sanbu.labor.pct,   yen: sanbu.labor.yen,   est: true  },
                                                { label: `諸経費`,   cls: 'expense', pct: sanbu.expense.pct, yen: sanbu.expense.yen, est: true  },
                                                { label: `推定利益`, cls: 'profit',  pct: sanbu.profit.pct,  yen: sanbu.profit.yen,  est: true  },
                                            ].map(row => (
                                                <div key={row.cls} className="sanbu-row">
                                                    <span className="sanbu-label">{row.label}</span>
                                                    <div className="sanbu-bar-wrap">
                                                        <div
                                                            className={`sanbu-bar sanbu-bar--${row.cls}`}
                                                            style={{ width: `${Math.min(row.pct, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="sanbu-pct">{row.pct.toFixed(1)}%</span>
                                                    <span className="sanbu-yen">¥{Math.round(row.yen).toLocaleString()}</span>
                                                    {row.est && <span className="sanbu-est">推定</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── 価格帯シミュレーション ── */}
                                <div className="sim-table-card">
                                    <p className="sim-table-head">価格帯シミュレーション（現在価格 ±30%）</p>
                                    <table className="sim-table">
                                        <thead>
                                            <tr>
                                                <th>販売価格</th>
                                                <th>原価率</th>
                                                <th>粗利益</th>
                                                <th>判定</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {priceRows.map(row => (
                                                <tr key={row.price} className={row.isCurrent ? 'sim-current' : ''}>
                                                    <td>¥{row.price.toLocaleString()}</td>
                                                    <td>{(row.ratio * 100).toFixed(1)}%</td>
                                                    <td>¥{row.profit.toLocaleString()}</td>
                                                    <td>
                                                        <span className={`sim-judgment sim-judgment--${JUDGMENT[row.judgment].cls}`}>
                                                            {JUDGMENT[row.judgment].mark} {JUDGMENT[row.judgment].name}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* ── コスト上昇シミュレーション ── */}
                                <div className="cost-sim-card">
                                    <div className="cost-sim-head">
                                        <p>コスト上昇シミュレーション</p>
                                        <p>現在の販売価格（¥{price.toLocaleString()}）を据え置いた場合、食材原価が上昇したときの影響</p>
                                    </div>
                                    <div className="cost-sim-rows">
                                        {costRows.map(row => (
                                            <div key={row.pct} className="cost-sim-row">
                                                <span className="csr-pct">+{row.pct}%</span>
                                                <div className="csr-bar-wrap">
                                                    <div
                                                        className={`csr-bar${row.ratio >= 0.5 ? ' csr-bar--over50' : ''}`}
                                                        style={{ width: `${Math.min(row.ratio * 100 * 1.5, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="csr-cost">¥{Math.round(row.newCost).toLocaleString()}</span>
                                                <span className="csr-ratio" style={{ color: row.ratio >= 0.5 ? '#e87c6a' : row.ratio >= 0.35 ? '#f5a623' : '#3aad87' }}>
                                                    {(row.ratio * 100).toFixed(1)}%
                                                </span>
                                                <span className={`csr-badge csr-badge--${JUDGMENT[row.judgment].cls}`}>
                                                    {JUDGMENT[row.judgment].mark} {JUDGMENT[row.judgment].name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

            </div>
        </motion.div>
    );
};

export default CalculatorPage;
