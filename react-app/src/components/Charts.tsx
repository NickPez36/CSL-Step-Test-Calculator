import { useRef, forwardRef, useImperativeHandle } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Scatter, Bar } from 'react-chartjs-2';
import type { CalculationResult } from '../types';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface ChartsProps {
    result: CalculationResult;
    darkMode?: boolean;
}

export interface ChartsRef {
    getChartImages: () => Promise<{ lactate: string; hr: string; sr: string; efficiency: string }>;
}

const getChartOptions = (yAxisLabel: string, darkMode: boolean): ChartOptions<'scatter'> => {
    const tickColor = darkMode ? 'rgba(255, 255, 255, 0.3)' : '#374151';
    const labelColor = darkMode ? 'rgba(255, 255, 255, 0.7)' : '#111827';
    const gridColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb';

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
                labels: {
                    color: labelColor,
                    filter: (item) => !item.text?.includes('Curve') && !item.text?.includes('Line'),
                },
            },
        },
    };
};

export const Charts = forwardRef<ChartsRef, ChartsProps>(({ result, darkMode = true }, ref) => {
    const lactateRef = useRef<ChartJS<'scatter'>>(null);
    const hrRef = useRef<ChartJS<'scatter'>>(null);
    const srRef = useRef<ChartJS<'scatter'>>(null);
    const efficiencyRef = useRef<ChartJS<'bar'>>(null);

    useImperativeHandle(ref, () => ({
        getChartImages: async () => {
            // Wait for charts to render
            await new Promise(resolve => setTimeout(resolve, 100));

            return {
                lactate: lactateRef.current?.toBase64Image() || '',
                hr: hrRef.current?.toBase64Image() || '',
                sr: srRef.current?.toBase64Image() || '',
                efficiency: efficiencyRef.current?.toBase64Image() || '',
            };
        },
    }));

    const { parsedData, regressions, thresholds, efficiencyData } = result;
    const minSpeed = parsedData[0].speed;
    const maxSpeed = parsedData[parsedData.length - 1].speed;
    const speedRange = maxSpeed - minSpeed;

    // Generate curve data
    const curvePoints = Array.from({ length: 101 }, (_, i) => minSpeed + (i * speedRange) / 100);

    // Lactate chart data
    const lactateData = {
        datasets: [
            {
                label: 'Athlete Data',
                data: parsedData.map(d => ({ x: d.speed, y: d.lactate })),
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'black',
                pointRadius: 6,
            },
            {
                label: 'Polynomial Curve',
                data: curvePoints.map(s => ({ x: s, y: regressions.lactate.predict(s)[1] })),
                type: 'line' as const,
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                pointRadius: 0,
            },
            {
                label: 'ModDMax Line',
                data: [thresholds.modDmaxLine.start, thresholds.modDmaxLine.end],
                type: 'line' as const,
                borderColor: 'rgba(192, 132, 252, 0.6)',
                borderDash: [5, 5],
                borderWidth: 2,
                pointRadius: 0,
            },
            {
                label: 'LT1',
                data: [{ x: thresholds.lt1.speed, y: thresholds.lt1.lactate }],
                backgroundColor: 'rgba(45, 212, 191, 1)',
                borderColor: 'white',
                borderWidth: 2,
                pointRadius: 8,
            },
            {
                label: 'LT2 (ModDMax)',
                data: [{ x: thresholds.lt2.speed, y: thresholds.lt2.lactate }],
                backgroundColor: 'rgba(248, 113, 113, 1)',
                borderColor: 'white',
                borderWidth: 2,
                pointRadius: 8,
            },
        ],
    };

    // HR chart data
    const hrData = {
        datasets: [
            {
                label: 'Athlete Data',
                data: parsedData.map(d => ({ x: d.speed, y: d.hr })),
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'black',
                pointRadius: 6,
            },
            {
                label: 'HR Curve',
                data: curvePoints.map(s => ({ x: s, y: regressions.hr.predict(s)[1] })),
                type: 'line' as const,
                borderColor: 'rgba(248, 113, 113, 1)',
                borderWidth: 2,
                pointRadius: 0,
            },
        ],
    };

    // SR chart data
    const srData = {
        datasets: regressions.sr
            ? [
                {
                    label: 'Athlete Data',
                    data: parsedData.map(d => ({ x: d.speed, y: d.sr })),
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'black',
                    pointRadius: 6,
                },
                {
                    label: 'SR Curve',
                    data: curvePoints.map(s => ({ x: s, y: regressions.sr!.predict(s)[1] })),
                    type: 'line' as const,
                    borderColor: 'rgba(45, 212, 191, 1)',
                    borderWidth: 2,
                    pointRadius: 0,
                },
            ]
            : [],
    };

    // Efficiency chart data
    const efficiencyChartData = {
        labels: parsedData.map(d => d.speed.toFixed(2)),
        datasets: efficiencyData
            ? [
                {
                    label: 'Efficiency',
                    data: efficiencyData.map(d => d.efficiency),
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                },
            ]
            : [],
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 text-white">Speed vs Lactate</h2>
                <div className="relative h-[350px]">
                    <Scatter
                        ref={lactateRef}
                        data={lactateData as any}
                        options={getChartOptions('Blood Lactate (mmol/L)', darkMode)}
                    />
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 text-white">Speed vs Heart Rate</h2>
                <div className="relative h-[350px]">
                    <Scatter
                        ref={hrRef}
                        data={hrData as any}
                        options={getChartOptions('Heart Rate (BPM)', darkMode)}
                    />
                </div>
            </div>

            {regressions.sr && (
                <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold mb-4 text-white">Speed vs Stroke Rate</h2>
                    <div className="relative h-[350px]">
                        <Scatter
                            ref={srRef}
                            data={srData as any}
                            options={getChartOptions('Stroke Rate (spm)', darkMode)}
                        />
                    </div>
                </div>
            )}

            {efficiencyData && (
                <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold mb-4 text-white">Step Efficiency Chart</h2>
                    <div className="relative h-[350px]">
                        <Bar
                            ref={efficiencyRef}
                            data={efficiencyChartData}
                            options={{
                                ...getChartOptions('Efficiency Score', darkMode),
                                scales: {
                                    ...getChartOptions('Efficiency Score', darkMode).scales,
                                    x: {
                                        type: 'category',
                                        title: { display: true, text: 'Speed (m/s)', color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#111827' },
                                        ticks: { color: darkMode ? 'rgba(255, 255, 255, 0.3)' : '#374151' },
                                    },
                                },
                            } as ChartOptions<'bar'>}
                        />
                    </div>
                </div>
            )}
        </div>
    );
});

Charts.displayName = 'Charts';
