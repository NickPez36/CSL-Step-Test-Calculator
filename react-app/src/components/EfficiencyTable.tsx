import type { EfficiencyDataPoint } from '../types';

interface Props {
    data: EfficiencyDataPoint[];
}

export function EfficiencyTable({ data }: Props) {
    if (!data || data.length < 1) return null;

    const maxAbsChange = Math.max(1, ...data.map(d => Math.abs(d.percentChange || 0)));

    const getPositiveGradientColor = (value: number, max: number) => {
        const percentage = max === 0 ? 1 : value / max;
        const hue = 160 + percentage * 50; // From teal (160) to bright blue (210)
        return `hsl(${hue}, 70%, 50%)`;
    };

    const getNegativeGradientColor = (value: number, max: number) => {
        const percentage = max === 0 ? 1 : value / max;
        const hue = 60 - percentage * 60; // From yellow (60) to red (0)
        return `hsl(${hue}, 70%, 50%)`;
    };

    return (
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-white">5. Step Efficiency</h2>
            <p className="text-sm text-gray-400 mb-4">Calculated as (velocity³) / (stroke rate / 60).</p>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="p-2 font-semibold text-gray-300 w-1/12 text-center">Step</th>
                            <th className="p-2 font-semibold text-gray-300 w-2/12 text-center">Score</th>
                            <th className="p-2 font-semibold text-gray-300 w-2/12 text-center">% Change</th>
                            <th className="p-2 font-semibold text-gray-300 w-7/12 text-center">Comparison to Step 1</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => {
                            const percentChange = item.percentChange || 0;
                            const barWidth = maxAbsChange > 0 ? (Math.abs(percentChange) / maxAbsChange) * 100 : 0;
                            const displayChange = percentChange.toFixed(1);
                            const barColor = percentChange >= 0
                                ? getPositiveGradientColor(percentChange, maxAbsChange)
                                : getNegativeGradientColor(Math.abs(percentChange), maxAbsChange);

                            return (
                                <tr key={item.step} className="border-b border-gray-700 last:border-b-0">
                                    <td className="p-3 font-medium text-center text-white">{item.step}</td>
                                    <td className="p-3 font-mono text-center text-white">{item.efficiency.toFixed(3)}</td>
                                    <td className={`p-3 font-mono text-center ${percentChange > 0 ? 'text-teal-400' : percentChange < 0 ? 'text-red-400' : 'text-white'}`}>
                                        {percentChange >= 0 ? '+' : ''}{displayChange}%
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center" title={`Change from Step 1: ${displayChange}%`}>
                                            {percentChange >= 0 ? (
                                                <>
                                                    <div className="w-1/2 flex justify-end"></div>
                                                    <div className="w-px h-6 bg-gray-500"></div>
                                                    <div className="w-1/2 flex justify-start">
                                                        <div
                                                            className="h-4 rounded-r-full"
                                                            style={{ width: `${barWidth}%`, backgroundColor: barColor }}
                                                        ></div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-1/2 flex justify-end">
                                                        <div
                                                            className="h-4 rounded-l-full"
                                                            style={{ width: `${barWidth}%`, backgroundColor: barColor }}
                                                        ></div>
                                                    </div>
                                                    <div className="w-px h-6 bg-gray-500"></div>
                                                    <div className="w-1/2 flex justify-start"></div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
