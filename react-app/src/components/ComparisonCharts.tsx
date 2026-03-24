import { useEffect, useMemo, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    LineController,
    BarController,
    ScatterController,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import type { ChartOptions, LegendItem } from 'chart.js';
import { Scatter, Bar } from 'react-chartjs-2';
import regression from 'regression';
import type { CalculationResult } from '../types';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    LineController,
    BarController,
    ScatterController,
    Title,
    Tooltip,
    Legend
);

export type ComparisonChartKind = 'lactate' | 'hr' | 'strokeRate' | 'efficiency';

const SESSION_A = {
    point: 'rgba(96, 165, 250, 0.95)',
    curve: 'rgba(59, 130, 246, 1)',
    modLine: 'rgba(167, 139, 250, 0.85)',
    lt1: 'rgba(45, 212, 191, 1)',
    lt2: 'rgba(248, 113, 113, 1)',
};

const SESSION_B = {
    point: 'rgba(251, 191, 36, 0.95)',
    curve: 'rgba(245, 158, 11, 1)',
    modLine: 'rgba(192, 132, 252, 0.85)',
    lt1: 'rgba(52, 211, 153, 1)',
    lt2: 'rgba(251, 113, 133, 1)',
};

/** Linear trend lines: distinct from each other and from polynomial curves. */
const LINEAR_A = 'rgba(34, 211, 238, 1)';
const LINEAR_B = 'rgba(244, 114, 182, 1)';

const LEGEND_TEXT = '#ffffff';

function getScatterOptions(yAxisLabel: string, sessionLabelA: string, sessionLabelB: string): ChartOptions<'scatter'> {
    const tickColor = 'rgba(255, 255, 255, 0.3)';
    const labelColor = 'rgba(255, 255, 255, 0.7)';
    const gridColor = 'rgba(255, 255, 255, 0.1)';
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                title: { display: true, text: 'Speed (m/s)', font: { size: 14 }, color: labelColor },
                ticks: { color: tickColor },
                grid: { color: gridColor },
            },
            y: {
                title: { display: true, text: yAxisLabel, font: { size: 14 }, color: labelColor },
                ticks: { color: tickColor },
                grid: { color: gridColor },
            },
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: LEGEND_TEXT,
                    generateLabels: (chart): LegendItem[] => {
                        const c = chart as InstanceType<typeof ChartJS>;
                        return [
                            {
                                text: sessionLabelA,
                                fillStyle: SESSION_A.point,
                                strokeStyle: SESSION_A.point,
                                fontColor: LEGEND_TEXT,
                                lineWidth: 0,
                                hidden: !c.isDatasetVisible(0),
                                datasetIndex: 0,
                            },
                            {
                                text: sessionLabelB,
                                fillStyle: SESSION_B.point,
                                strokeStyle: SESSION_B.point,
                                fontColor: LEGEND_TEXT,
                                lineWidth: 0,
                                hidden: !c.isDatasetVisible(1),
                                datasetIndex: 1,
                            },
                        ];
                    },
                },
                onClick: (_e, legendItem, legend) => {
                    const i = legendItem.datasetIndex;
                    if (i !== 0 && i !== 1) return;
                    const c = legend.chart;
                    c.setDatasetVisibility(i, !c.isDatasetVisible(i));
                    c.update();
                },
            },
        },
    };
}

function curveRange(parsed: CalculationResult['parsedData']): { min: number; max: number; points: number[] } {
    const minSpeed = parsed[0].speed;
    const maxSpeed = parsed[parsed.length - 1].speed;
    const speedRange = maxSpeed - minSpeed;
    const curvePoints = Array.from({ length: 101 }, (_, i) => minSpeed + (i * speedRange) / 100);
    return { min: minSpeed, max: maxSpeed, points: curvePoints };
}

function padExtent(min: number, max: number, ratio = 0.06): { min: number; max: number } {
    const span = max - min || 1e-6;
    const p = span * ratio;
    return { min: min - p, max: max + p };
}

function getLactateYExtent(a: CalculationResult, b: CalculationResult, includeModDmax: boolean): { min: number; max: number } {
    const ys: number[] = [];
    [...a.parsedData, ...b.parsedData].forEach((d) => ys.push(d.lactate));
    ys.push(a.thresholds.lt1.lactate, a.thresholds.lt2.lactate, b.thresholds.lt1.lactate, b.thresholds.lt2.lactate);
    const crA = curveRange(a.parsedData);
    const crB = curveRange(b.parsedData);
    crA.points.forEach((s) => ys.push(a.regressions.lactate.predict(s)[1]));
    crB.points.forEach((s) => ys.push(b.regressions.lactate.predict(s)[1]));
    if (includeModDmax) {
        ys.push(
            a.thresholds.modDmaxLine.start.y,
            a.thresholds.modDmaxLine.end.y,
            b.thresholds.modDmaxLine.start.y,
            b.thresholds.modDmaxLine.end.y
        );
    }
    return padExtent(Math.min(...ys), Math.max(...ys));
}

function getHrYExtent(
    a: CalculationResult,
    b: CalculationResult,
    includeLinear: boolean,
    hrLinA: ReturnType<typeof regression.linear>,
    hrLinB: ReturnType<typeof regression.linear>
): { min: number; max: number } {
    const ys: number[] = [];
    [...a.parsedData, ...b.parsedData].forEach((d) => ys.push(d.hr));
    ys.push(
        a.regressions.hr.predict(a.thresholds.lt1.speed)[1],
        a.regressions.hr.predict(a.thresholds.lt2.speed)[1],
        b.regressions.hr.predict(b.thresholds.lt1.speed)[1],
        b.regressions.hr.predict(b.thresholds.lt2.speed)[1]
    );
    const crA = curveRange(a.parsedData);
    const crB = curveRange(b.parsedData);
    crA.points.forEach((s) => ys.push(a.regressions.hr.predict(s)[1]));
    crB.points.forEach((s) => ys.push(b.regressions.hr.predict(s)[1]));
    if (includeLinear) {
        crA.points.forEach((s) => ys.push(hrLinA.predict(s)[1]));
        crB.points.forEach((s) => ys.push(hrLinB.predict(s)[1]));
    }
    return padExtent(Math.min(...ys), Math.max(...ys));
}

function getSrYExtent(a: CalculationResult, b: CalculationResult): { min: number; max: number } {
    const ys: number[] = [];
    [...a.parsedData, ...b.parsedData].forEach((d) => ys.push(d.sr));
    ys.push(
        a.regressions.sr!.predict(a.thresholds.lt1.speed)[1],
        a.regressions.sr!.predict(a.thresholds.lt2.speed)[1],
        b.regressions.sr!.predict(b.thresholds.lt1.speed)[1],
        b.regressions.sr!.predict(b.thresholds.lt2.speed)[1]
    );
    const crA = curveRange(a.parsedData);
    const crB = curveRange(b.parsedData);
    crA.points.forEach((s) => ys.push(a.regressions.sr!.predict(s)[1]));
    crB.points.forEach((s) => ys.push(b.regressions.sr!.predict(s)[1]));
    return padExtent(Math.min(...ys), Math.max(...ys));
}

function speedReferenceLine(label: string, speed: number, yMin: number, yMax: number, borderColor: string) {
    return {
        label,
        data: [
            { x: speed, y: yMin },
            { x: speed, y: yMax },
        ],
        type: 'line' as const,
        borderColor,
        borderDash: [4, 4],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0,
    };
}

interface Props {
    resultA: CalculationResult;
    resultB: CalculationResult;
    labelA: string;
    labelB: string;
    /** Both sessions must have SR regression for strokeRate; both must have efficiencyData for efficiency. */
    canStrokeRate: boolean;
    canEfficiency: boolean;
}

export function ComparisonCharts({ resultA, resultB, labelA, labelB, canStrokeRate, canEfficiency }: Props) {
    const [kind, setKind] = useState<ComparisonChartKind>('lactate');
    const [showModDmax, setShowModDmax] = useState(false);
    const [showLinearHr, setShowLinearHr] = useState(false);

    useEffect(() => {
        if (kind === 'strokeRate' && !canStrokeRate) setKind('lactate');
        if (kind === 'efficiency' && !canEfficiency) setKind('lactate');
    }, [kind, canStrokeRate, canEfficiency]);

    const lactateData = useMemo(() => {
        const a = resultA;
        const b = resultB;
        const crA = curveRange(a.parsedData);
        const crB = curveRange(b.parsedData);
        const yL = getLactateYExtent(a, b, showModDmax);

        const datasets: Record<string, unknown>[] = [
            {
                label: `${labelA} — data`,
                data: a.parsedData.map((d) => ({ x: d.speed, y: d.lactate })),
                backgroundColor: SESSION_A.point,
                pointRadius: 5,
            },
            {
                label: `${labelB} — data`,
                data: b.parsedData.map((d) => ({ x: d.speed, y: d.lactate })),
                backgroundColor: SESSION_B.point,
                pointRadius: 5,
            },
            {
                label: `${labelA} — lactate curve`,
                data: crA.points.map((s) => ({ x: s, y: a.regressions.lactate.predict(s)[1] })),
                type: 'line' as const,
                borderColor: SESSION_A.curve,
                borderWidth: 2,
                pointRadius: 0,
            },
            {
                label: `${labelB} — lactate curve`,
                data: crB.points.map((s) => ({ x: s, y: b.regressions.lactate.predict(s)[1] })),
                type: 'line' as const,
                borderColor: SESSION_B.curve,
                borderWidth: 2,
                pointRadius: 0,
            },
        ];

        if (showModDmax) {
            datasets.push(
                {
                    label: `${labelA} — ModDMax`,
                    data: [a.thresholds.modDmaxLine.start, a.thresholds.modDmaxLine.end],
                    type: 'line' as const,
                    borderColor: SESSION_A.modLine,
                    borderDash: [6, 4],
                    borderWidth: 2,
                    pointRadius: 0,
                },
                {
                    label: `${labelB} — ModDMax`,
                    data: [b.thresholds.modDmaxLine.start, b.thresholds.modDmaxLine.end],
                    type: 'line' as const,
                    borderColor: SESSION_B.modLine,
                    borderDash: [6, 4],
                    borderWidth: 2,
                    pointRadius: 0,
                }
            );
        }

        datasets.push(
            speedReferenceLine(`${labelA} — LT1`, a.thresholds.lt1.speed, yL.min, yL.max, SESSION_A.lt1),
            speedReferenceLine(`${labelA} — LT2`, a.thresholds.lt2.speed, yL.min, yL.max, SESSION_A.lt2),
            speedReferenceLine(`${labelB} — LT1`, b.thresholds.lt1.speed, yL.min, yL.max, SESSION_B.lt1),
            speedReferenceLine(`${labelB} — LT2`, b.thresholds.lt2.speed, yL.min, yL.max, SESSION_B.lt2),
            {
                label: `${labelA} — LT1 & LT2`,
                data: [
                    { x: a.thresholds.lt1.speed, y: a.thresholds.lt1.lactate },
                    { x: a.thresholds.lt2.speed, y: a.thresholds.lt2.lactate },
                ],
                pointBackgroundColor: [SESSION_A.lt1, SESSION_A.lt2],
                pointBorderColor: 'rgba(255,255,255,0.95)',
                pointBorderWidth: 2,
                pointRadius: 8,
                hoverRadius: 10,
            },
            {
                label: `${labelB} — LT1 & LT2`,
                data: [
                    { x: b.thresholds.lt1.speed, y: b.thresholds.lt1.lactate },
                    { x: b.thresholds.lt2.speed, y: b.thresholds.lt2.lactate },
                ],
                pointBackgroundColor: [SESSION_B.lt1, SESSION_B.lt2],
                pointBorderColor: 'rgba(255,255,255,0.95)',
                pointBorderWidth: 2,
                pointRadius: 8,
                hoverRadius: 10,
            }
        );

        return { datasets };
    }, [resultA, resultB, labelA, labelB, showModDmax]);

    const hrData = useMemo(() => {
        const a = resultA;
        const b = resultB;
        const crA = curveRange(a.parsedData);
        const crB = curveRange(b.parsedData);
        const hrLinA = regression.linear(a.parsedData.map((d) => [d.speed, d.hr] as [number, number]));
        const hrLinB = regression.linear(b.parsedData.map((d) => [d.speed, d.hr] as [number, number]));
        const yH = getHrYExtent(a, b, showLinearHr, hrLinA, hrLinB);

        const datasets: Record<string, unknown>[] = [
            {
                label: `${labelA} — data`,
                data: a.parsedData.map((d) => ({ x: d.speed, y: d.hr })),
                backgroundColor: SESSION_A.point,
                pointRadius: 5,
            },
            {
                label: `${labelB} — data`,
                data: b.parsedData.map((d) => ({ x: d.speed, y: d.hr })),
                backgroundColor: SESSION_B.point,
                pointRadius: 5,
            },
        ];

        if (showLinearHr) {
            datasets.push(
                {
                    label: `${labelA} — linear HR`,
                    data: crA.points.map((s) => ({ x: s, y: hrLinA.predict(s)[1] })),
                    type: 'line' as const,
                    borderColor: LINEAR_A,
                    borderWidth: 2,
                    pointRadius: 0,
                },
                {
                    label: `${labelB} — linear HR`,
                    data: crB.points.map((s) => ({ x: s, y: hrLinB.predict(s)[1] })),
                    type: 'line' as const,
                    borderColor: LINEAR_B,
                    borderWidth: 2,
                    pointRadius: 0,
                }
            );
        }

        datasets.push(
            {
                label: `${labelA} — polynomial HR`,
                data: crA.points.map((s) => ({ x: s, y: a.regressions.hr.predict(s)[1] })),
                type: 'line' as const,
                borderColor: SESSION_A.curve,
                borderDash: [5, 5],
                borderWidth: 2,
                pointRadius: 0,
            },
            {
                label: `${labelB} — polynomial HR`,
                data: crB.points.map((s) => ({ x: s, y: b.regressions.hr.predict(s)[1] })),
                type: 'line' as const,
                borderColor: SESSION_B.curve,
                borderDash: [5, 5],
                borderWidth: 2,
                pointRadius: 0,
            },
            speedReferenceLine(`${labelA} — LT1`, a.thresholds.lt1.speed, yH.min, yH.max, SESSION_A.lt1),
            speedReferenceLine(`${labelA} — LT2`, a.thresholds.lt2.speed, yH.min, yH.max, SESSION_A.lt2),
            speedReferenceLine(`${labelB} — LT1`, b.thresholds.lt1.speed, yH.min, yH.max, SESSION_B.lt1),
            speedReferenceLine(`${labelB} — LT2`, b.thresholds.lt2.speed, yH.min, yH.max, SESSION_B.lt2)
        );

        return { datasets };
    }, [resultA, resultB, labelA, labelB, showLinearHr]);

    const srData = useMemo(() => {
        const a = resultA;
        const b = resultB;
        if (!a.regressions.sr || !b.regressions.sr) {
            return { datasets: [] as Record<string, unknown>[] };
        }
        const crA = curveRange(a.parsedData);
        const crB = curveRange(b.parsedData);
        const yS = getSrYExtent(a, b);

        const datasets: Record<string, unknown>[] = [
            {
                label: `${labelA} — data`,
                data: a.parsedData.map((d) => ({ x: d.speed, y: d.sr })),
                backgroundColor: SESSION_A.point,
                pointRadius: 5,
            },
            {
                label: `${labelB} — data`,
                data: b.parsedData.map((d) => ({ x: d.speed, y: d.sr })),
                backgroundColor: SESSION_B.point,
                pointRadius: 5,
            },
            {
                label: `${labelA} — SR curve`,
                data: crA.points.map((s) => ({ x: s, y: a.regressions.sr!.predict(s)[1] })),
                type: 'line' as const,
                borderColor: SESSION_A.curve,
                borderWidth: 2,
                pointRadius: 0,
            },
            {
                label: `${labelB} — SR curve`,
                data: crB.points.map((s) => ({ x: s, y: b.regressions.sr!.predict(s)[1] })),
                type: 'line' as const,
                borderColor: SESSION_B.curve,
                borderWidth: 2,
                pointRadius: 0,
            },
            speedReferenceLine(`${labelA} — LT1`, a.thresholds.lt1.speed, yS.min, yS.max, SESSION_A.lt1),
            speedReferenceLine(`${labelA} — LT2`, a.thresholds.lt2.speed, yS.min, yS.max, SESSION_A.lt2),
            speedReferenceLine(`${labelB} — LT1`, b.thresholds.lt1.speed, yS.min, yS.max, SESSION_B.lt1),
            speedReferenceLine(`${labelB} — LT2`, b.thresholds.lt2.speed, yS.min, yS.max, SESSION_B.lt2),
        ];

        return { datasets };
    }, [resultA, resultB, labelA, labelB]);

    /** Grouped bars by step index (Step 1 … Step n) where n = min step counts — matches rows in order. */
    const efficiencyData = useMemo(() => {
        const edA = resultA.efficiencyData;
        const edB = resultB.efficiencyData;
        if (!edA || !edB) {
            return { labels: [] as string[], datasets: [] as { label: string; data: number[]; backgroundColor: string; borderColor: string; borderWidth: number }[] };
        }
        const n = Math.min(edA.length, edB.length);
        const labels = Array.from({ length: n }, (_, i) => `Step ${i + 1}`);
        return {
            labels,
            datasets: [
                {
                    label: `${labelA} — efficiency`,
                    data: edA.slice(0, n).map((d) => d.efficiency),
                    backgroundColor: 'rgba(59, 130, 246, 0.55)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                },
                {
                    label: `${labelB} — efficiency`,
                    data: edB.slice(0, n).map((d) => d.efficiency),
                    backgroundColor: 'rgba(245, 158, 11, 0.55)',
                    borderColor: 'rgba(245, 158, 11, 1)',
                    borderWidth: 1,
                },
            ],
        };
    }, [resultA, resultB, labelA, labelB]);

    const scatterOptionsLactate = useMemo(
        () => getScatterOptions('Blood Lactate (mmol/L)', labelA, labelB),
        [labelA, labelB]
    );
    const scatterOptionsHr = useMemo(() => getScatterOptions('Heart Rate (BPM)', labelA, labelB), [labelA, labelB]);
    const scatterOptionsSr = useMemo(() => getScatterOptions('Stroke Rate (spm)', labelA, labelB), [labelA, labelB]);

    const barOptions: ChartOptions<'bar'> = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: {
                    type: 'category',
                    title: {
                        display: true,
                        text: 'Test step (aligned by index)',
                        color: 'rgba(255, 255, 255, 0.7)',
                    },
                    ticks: { color: 'rgba(255, 255, 255, 0.3)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                },
                y: {
                    title: { display: true, text: 'Efficiency score', color: 'rgba(255, 255, 255, 0.7)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.3)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                },
            },
            plugins: {
                legend: {
                    labels: {
                        color: LEGEND_TEXT,
                        generateLabels: (chart): LegendItem[] => {
                            const c = chart as InstanceType<typeof ChartJS>;
                            return [
                                {
                                    text: labelA,
                                    fillStyle: 'rgba(59, 130, 246, 0.75)',
                                    strokeStyle: 'rgba(59, 130, 246, 1)',
                                    fontColor: LEGEND_TEXT,
                                    lineWidth: 1,
                                    hidden: !c.isDatasetVisible(0),
                                    datasetIndex: 0,
                                },
                                {
                                    text: labelB,
                                    fillStyle: 'rgba(245, 158, 11, 0.75)',
                                    strokeStyle: 'rgba(245, 158, 11, 1)',
                                    fontColor: LEGEND_TEXT,
                                    lineWidth: 1,
                                    hidden: !c.isDatasetVisible(1),
                                    datasetIndex: 1,
                                },
                            ];
                        },
                    },
                    onClick: (_e, legendItem, legend) => {
                        const i = legendItem.datasetIndex;
                        if (i !== 0 && i !== 1) return;
                        const ch = legend.chart;
                        ch.setDatasetVisibility(i, !ch.isDatasetVisible(i));
                        ch.update();
                    },
                },
            },
        }),
        [labelA, labelB]
    );

    const kinds: { id: ComparisonChartKind; label: string; disabled?: boolean; hint?: string }[] = [
        { id: 'lactate', label: 'Speed vs Lactate' },
        { id: 'hr', label: 'Speed vs Heart Rate' },
        {
            id: 'strokeRate',
            label: 'Speed vs Stroke Rate',
            disabled: !canStrokeRate,
            hint: !canStrokeRate ? 'Both sessions need stroke rate on every step.' : undefined,
        },
        {
            id: 'efficiency',
            label: 'Step efficiency',
            disabled: !canEfficiency,
            hint: !canEfficiency ? 'Both sessions need stroke rate for efficiency.' : undefined,
        },
    ];

    return (
        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900/70 to-slate-950/90 shadow-xl shadow-black/25 ring-1 ring-slate-800/40">
            <div className="border-b border-slate-800/90 px-6 py-5">
                <h2 className="text-lg font-semibold tracking-tight text-white">Overlay charts</h2>
                <p className="mt-1 text-sm text-slate-400">
                    Same chart types as the calculator. Select a view to compare both sessions on one set of axes.
                </p>
            </div>
            <div className="px-6 pb-5 pt-4">
            <div className="mb-4 flex flex-wrap gap-2">
                {kinds.map((k) => (
                    <button
                        key={k.id}
                        type="button"
                        disabled={k.disabled}
                        title={k.disabled ? k.hint : undefined}
                        onClick={() => setKind(k.id)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                            kind === k.id
                                ? 'bg-sky-600 text-white shadow-md ring-1 ring-sky-500/50'
                                : k.disabled
                                  ? 'cursor-not-allowed bg-slate-800/80 text-slate-600'
                                  : 'border border-slate-700 bg-slate-800/90 text-slate-200 hover:border-slate-600 hover:bg-slate-800'
                        }`}
                    >
                        {k.label}
                    </button>
                ))}
            </div>
            {kind === 'lactate' && (
                <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-slate-800/80 pb-4">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                        <input
                            type="checkbox"
                            checked={showModDmax}
                            onChange={(e) => setShowModDmax(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-600 focus:ring-sky-500"
                        />
                        <span>Show ModDMax line</span>
                    </label>
                    <span className="text-xs text-slate-500">
                        Lactate polynomial curves are always shown. Optional ModDMax construction line. LT1/LT2: vertical
                        guides plus hoverable points on the curve.
                    </span>
                </div>
            )}
            {kind === 'hr' && (
                <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-slate-800/80 pb-4">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                        <input
                            type="checkbox"
                            checked={showLinearHr}
                            onChange={(e) => setShowLinearHr(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-600 focus:ring-sky-500"
                        />
                        <span>Show linear HR trend</span>
                    </label>
                    <span className="text-xs text-slate-500">
                        Polynomial HR curves are always shown. Linear trends use cyan (A) and pink (B). LT1/LT2 speeds
                        shown as vertical dotted lines.
                    </span>
                </div>
            )}
            <div className="relative h-[380px]">
                {kind === 'lactate' && <Scatter data={lactateData as any} options={scatterOptionsLactate} />}
                {kind === 'hr' && <Scatter data={hrData as any} options={scatterOptionsHr} />}
                {kind === 'strokeRate' && canStrokeRate && <Scatter data={srData as any} options={scatterOptionsSr} />}
                {kind === 'efficiency' && canEfficiency && efficiencyData.labels.length > 0 && (
                    <Bar data={efficiencyData} options={barOptions} />
                )}
            </div>
            </div>
        </section>
    );
}
