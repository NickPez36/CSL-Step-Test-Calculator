import type { CalculationResult, SavedTestSession, SessionDetails, TableType } from '../types';

export function parseMetricNumber(s: string | undefined): number | null {
    if (s == null || s === '' || s === '—') return null;
    const n = parseFloat(String(s).replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
}

/** Percent change from A to B: ((B − A) / A) × 100. Returns null if A is zero or values missing. */
function formatPercentChange(a: number | null, b: number | null, maxDecimals: number): string | null {
    if (a === null || b === null) return null;
    if (Math.abs(a) < 1e-12) return null;
    const pct = ((b - a) / a) * 100;
    if (Math.abs(pct) < 1e-6) return '0%';
    const sign = pct > 0 ? '+' : '';
    return sign + pct.toFixed(maxDecimals) + '%';
}

function ChangePill({ children, variant }: { children: string; variant: 'positive' | 'negative' | 'neutral' }) {
    const cls =
        variant === 'neutral'
            ? 'bg-slate-700/80 text-slate-200'
            : variant === 'positive'
              ? 'bg-emerald-950/80 text-emerald-300 ring-1 ring-emerald-800/60'
              : 'bg-rose-950/80 text-rose-300 ring-1 ring-rose-800/60';
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${cls}`}>
            {children}
        </span>
    );
}

function DualMetricRowCompact({
    label,
    unit,
    strA,
    strB,
    percentDecimals,
    colorA,
    colorB,
}: {
    label: string;
    unit: string;
    strA: string;
    strB: string;
    percentDecimals: number;
    colorA: string;
    colorB: string;
}) {
    const na = parseMetricNumber(strA);
    const nb = parseMetricNumber(strB);
    const pct = formatPercentChange(na, nb, percentDecimals);
    let variant: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (pct !== null && pct !== '0%') {
        const d = (nb ?? 0) - (na ?? 0);
        variant = d > 0 ? 'positive' : 'negative';
    }
    return (
        <div className="border-t border-slate-800/80 pt-3 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <p className="text-[11px] font-medium text-slate-400">{label}</p>
                    <p className="text-[10px] text-slate-600">{unit}</p>
                </div>
                {pct !== null && <ChangePill variant={variant}>{pct}</ChangePill>}
            </div>
            <div className="mt-2 flex flex-wrap items-end gap-3">
                <div>
                    <span className="text-[10px] font-semibold uppercase text-sky-400/90">A</span>
                    <span className="ml-2 text-lg font-semibold tabular-nums text-white">{strA}</span>
                </div>
                <span className="text-slate-600">·</span>
                <div>
                    <span className="text-[10px] font-semibold uppercase text-amber-400/90">B</span>
                    <span className="ml-2 text-lg font-semibold tabular-nums text-white">{strB}</span>
                </div>
            </div>
            <DualBar a={na} b={nb} colorA={colorA} colorB={colorB} />
        </div>
    );
}

function DualBar({ a: valA, b: valB, colorA, colorB }: { a: number | null; b: number | null; colorA: string; colorB: string }) {
    const max = valA !== null && valB !== null ? Math.max(valA, valB, 1e-9) : valA !== null ? valA : valB !== null ? valB : null;
    if (max === null || max <= 0) {
        return <div className="mt-2 h-2 rounded bg-slate-800/80" />;
    }
    const pctA = valA !== null ? Math.min(100, (valA / max) * 100) : 0;
    const pctB = valB !== null ? Math.min(100, (valB / max) * 100) : 0;
    return (
        <div className="mt-3 flex gap-3">
            <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex justify-between text-[10px] uppercase tracking-wide text-slate-500">
                    <span>A</span>
                    <span className="tabular-nums text-slate-400">{valA !== null ? valA : '—'}</span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-slate-800/90">
                    <div className={`h-full rounded transition-all ${colorA}`} style={{ width: `${pctA}%` }} />
                </div>
            </div>
            <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex justify-between text-[10px] uppercase tracking-wide text-slate-500">
                    <span>B</span>
                    <span className="tabular-nums text-slate-400">{valB !== null ? valB : '—'}</span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-slate-800/90">
                    <div className={`h-full rounded transition-all ${colorB}`} style={{ width: `${pctB}%` }} />
                </div>
            </div>
        </div>
    );
}

function MetricBlock({
    label,
    unit,
    strA,
    strB,
    percentDecimals,
    colorA,
    colorB,
}: {
    label: string;
    unit: string;
    strA: string;
    strB: string;
    percentDecimals: number;
    colorA: string;
    colorB: string;
}) {
    const na = parseMetricNumber(strA);
    const nb = parseMetricNumber(strB);
    const pct = formatPercentChange(na, nb, percentDecimals);
    let variant: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (pct !== null && pct !== '0%') {
        const d = (nb ?? 0) - (na ?? 0);
        variant = d > 0 ? 'positive' : 'negative';
    }

    return (
        <div className="rounded-xl border border-slate-700/50 bg-slate-950/30 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
                    <p className="text-[10px] text-slate-600">{unit}</p>
                </div>
                {pct !== null && <ChangePill variant={variant}>{pct}</ChangePill>}
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-4">
                <div>
                    <p className="text-[10px] font-medium uppercase text-sky-400/90">A</p>
                    <p className="text-2xl font-semibold tabular-nums tracking-tight text-white">{strA}</p>
                </div>
                <div className="pb-1 text-slate-600">vs</div>
                <div>
                    <p className="text-[10px] font-medium uppercase text-amber-400/90">B</p>
                    <p className="text-2xl font-semibold tabular-nums tracking-tight text-white">{strB}</p>
                </div>
            </div>
            <DualBar a={na} b={nb} colorA={colorA} colorB={colorB} />
        </div>
    );
}

export function ComparisonSummaryStrip({
    shortLabelA,
    shortLabelB,
}: {
    shortLabelA: string;
    shortLabelB: string;
}) {
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-700/70 bg-slate-900/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Active comparison</p>
                <p className="mt-1 text-sm text-slate-400">Thresholds and charts use recalculated values from stored step data.</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-800/60 bg-sky-950/40 px-4 py-1.5 text-sm text-sky-100">
                    <span className="text-[10px] font-bold uppercase text-sky-400">A</span>
                    {shortLabelA}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-800/60 bg-amber-950/40 px-4 py-1.5 text-sm text-amber-100">
                    <span className="text-[10px] font-bold uppercase text-amber-400">B</span>
                    {shortLabelB}
                </span>
            </div>
        </div>
    );
}

export function ComparisonMetadataCards({
    sessionA,
    sessionB,
}: {
    sessionA: SavedTestSession;
    sessionB: SavedTestSession;
}) {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <MetadataCard title="Session A" accent="sky" session={sessionA} />
            <MetadataCard title="Session B" accent="amber" session={sessionB} />
        </div>
    );
}

function tableTypeLabel(t: TableType): string {
    if (t === 'hr') return 'HR based';
    if (t === 'speed') return 'Speed based';
    return 'Stroke rate based';
}

function MetadataCard({
    title,
    accent,
    session,
}: {
    title: string;
    accent: 'sky' | 'amber';
    session: SavedTestSession;
}) {
    const d: SessionDetails = session.sessionDetails;
    const ring = accent === 'sky' ? 'ring-sky-500/20' : 'ring-amber-500/20';
    const bar = accent === 'sky' ? 'bg-sky-500' : 'bg-amber-500';

    const sections: { heading: string; rows: [string, string][] }[] = [
        {
            heading: 'Test context',
            rows: [
                ['Athlete', d.athleteName || '—'],
                ['Test date', d.testDate || '—'],
                ['Boat class', d.boatClass || '—'],
                ['Protocol type', tableTypeLabel(session.tableType)],
                ['Protocol', d.protocol || '—'],
            ],
        },
        {
            heading: 'Environment',
            rows: [
                ['Temperature', d.temperature || '—'],
                ['Wind', d.windSpeed || '—'],
            ],
        },
        {
            heading: 'Record',
            rows: [['Saved', formatSavedAt(session.savedAt)]],
        },
    ];

    return (
        <div className={`relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/50 shadow-lg ring-1 ${ring}`}>
            <div className={`absolute left-0 top-0 h-full w-1 ${bar}`} aria-hidden />
            <div className="p-6 pl-7">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                {sections.map((sec) => (
                    <div key={sec.heading} className="mt-5 first:mt-4">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">{sec.heading}</p>
                        <dl className="space-y-2">
                            {sec.rows.map(([k, v]) => (
                                <div key={k} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                                    <dt className="shrink-0 text-xs text-slate-500 sm:w-28">{k}</dt>
                                    <dd className="min-w-0 text-sm font-medium text-slate-100">{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                ))}
                {(d.comments || '').trim() ? (
                    <div className="mt-5 border-t border-slate-800 pt-4">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Notes</p>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{d.comments}</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function formatSavedAt(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

export function ComparisonThresholdPanels({
    resultA,
    resultB,
    labelShortA,
    labelShortB,
}: {
    resultA: CalculationResult;
    resultB: CalculationResult;
    labelShortA: string;
    labelShortB: string;
}) {
    const lt = (name: 'lt1' | 'lt2') => ({
        hr: { a: resultA.displayThresholds[name].hr, b: resultB.displayThresholds[name].hr },
        lactate: { a: resultA.displayThresholds[name].lactate, b: resultB.displayThresholds[name].lactate },
        speed: { a: resultA.displayThresholds[name].speed, b: resultB.displayThresholds[name].speed },
    });

    return (
        <section className="space-y-6">
            <header>
                <h2 className="text-lg font-semibold tracking-tight text-white">Lactate thresholds</h2>
                <p className="mt-1 text-sm text-slate-400">
                    LT1 and LT2 derived values for heart rate, blood lactate, and boat speed ({labelShortA} vs {labelShortB}).
                </p>
            </header>

            <ThresholdCard
                title="LT1 — first lactate threshold"
                subtitle="Lowest lactate + 0.4 mmol/L method"
                t={lt('lt1')}
            />
            <ThresholdCard
                title="LT2 — second lactate threshold"
                subtitle="Modified DMax"
                t={lt('lt2')}
            />
        </section>
    );
}

function ThresholdCard({
    title,
    subtitle,
    t,
}: {
    title: string;
    subtitle: string;
    t: { hr: { a: string; b: string }; lactate: { a: string; b: string }; speed: { a: string; b: string } };
}) {
    return (
        <div className="rounded-2xl border border-slate-700/70 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-6 shadow-xl">
            <div className="mb-5 border-b border-slate-800 pb-4">
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <MetricBlock
                    label="Heart rate"
                    unit="bpm"
                    strA={t.hr.a}
                    strB={t.hr.b}
                    percentDecimals={1}
                    colorA="bg-sky-500"
                    colorB="bg-amber-500"
                />
                <MetricBlock
                    label="Blood lactate"
                    unit="mmol/L"
                    strA={t.lactate.a}
                    strB={t.lactate.b}
                    percentDecimals={1}
                    colorA="bg-sky-500"
                    colorB="bg-amber-500"
                />
                <MetricBlock
                    label="Speed"
                    unit="m/s"
                    strA={t.speed.a}
                    strB={t.speed.b}
                    percentDecimals={1}
                    colorA="bg-sky-500"
                    colorB="bg-amber-500"
                />
            </div>
        </div>
    );
}

export function ComparisonFixedLactateGrid({
    resultA,
    resultB,
}: {
    resultA: CalculationResult;
    resultB: CalculationResult;
}) {
    const levels = [2, 4, 6] as const;

    return (
        <section className="space-y-4">
            <header>
                <h2 className="text-lg font-semibold tracking-tight text-white">Fixed lactate interpolation</h2>
                <p className="mt-1 text-sm text-slate-400">
                    Modelled HR and speed at 2, 4, and 6 mmol/L (polynomial lactate curve, same as calculator).
                </p>
            </header>
            <div className="grid gap-4 md:grid-cols-3">
                {levels.map((mmol) => {
                    const pa = resultA.fixedLactatePoints[mmol];
                    const pb = resultB.fixedLactatePoints[mmol];
                    return (
                        <div
                            key={mmol}
                            className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-5 shadow-lg ring-1 ring-slate-800/40"
                        >
                            <p className="text-sm font-semibold text-white">{mmol}.0 mmol/L</p>
                            <div className="mt-3 space-y-1">
                                <DualMetricRowCompact
                                    label="Heart rate"
                                    unit="bpm"
                                    strA={pa?.hr ?? '—'}
                                    strB={pb?.hr ?? '—'}
                                    percentDecimals={1}
                                    colorA="bg-sky-500"
                                    colorB="bg-amber-500"
                                />
                                <DualMetricRowCompact
                                    label="Speed"
                                    unit="m/s"
                                    strA={pa?.speed ?? '—'}
                                    strB={pb?.speed ?? '—'}
                                    percentDecimals={1}
                                    colorA="bg-sky-500"
                                    colorB="bg-amber-500"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
