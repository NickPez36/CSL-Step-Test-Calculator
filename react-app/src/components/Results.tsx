import type { Thresholds, FixedLactateResults } from '../types';

interface Props {
    thresholds: Thresholds;
    fixedPoints: FixedLactateResults;
}

export function Results({ thresholds, fixedPoints }: Props) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Calculated Thresholds */}
            <div>
                <h2 className="text-2xl font-semibold mb-4 text-white">2. Calculated Thresholds</h2>
                <div className="space-y-6">
                    <div className="bg-gray-800 p-4 border border-gray-700 rounded-xl">
                        <h3 className="font-bold text-lg text-teal-400">Lactate Threshold 1 (LT1)</h3>
                        <p className="text-sm text-gray-400 mb-2">
                            Calculated using the Lowest Lactate + 0.4 mmol/L method.
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                                <p className="text-sm font-medium text-gray-400">Heart Rate</p>
                                <p className="text-xl font-semibold text-white">{thresholds.lt1.hr}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Speed (m/s)</p>
                                <p className="text-xl font-semibold text-white">{thresholds.lt1.speed}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Lactate (mmol/L)</p>
                                <p className="text-xl font-semibold text-white">{thresholds.lt1.lactate}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 border border-gray-700 rounded-xl">
                        <h3 className="font-bold text-lg text-red-400">Lactate Threshold 2 (LT2)</h3>
                        <p className="text-sm text-gray-400 mb-2">
                            Calculated using the Modified DMax method (Bishop et al., 1998).
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                                <p className="text-sm font-medium text-gray-400">Heart Rate</p>
                                <p className="text-xl font-semibold text-white">{thresholds.lt2.hr}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Speed (m/s)</p>
                                <p className="text-xl font-semibold text-white">{thresholds.lt2.speed}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Lactate (mmol/L)</p>
                                <p className="text-xl font-semibold text-white">{thresholds.lt2.lactate}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Lactate Points */}
            <div>
                <h2 className="text-2xl font-semibold mb-4 text-white">3. Key Lactate Points</h2>
                <p className="text-sm text-gray-400 mb-4">
                    Speed and Heart Rate values interpolated from the curve at fixed lactate levels.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    {[2, 4, 6].map((mmol) => (
                        <div key={mmol} className="bg-gray-800 p-4 border border-gray-700 rounded-xl">
                            <h4 className="font-bold text-lg text-gray-300">{mmol}.0 mmol/L</h4>
                            <div className="mt-2">
                                <p className="text-sm font-medium text-gray-400">Heart Rate</p>
                                <p className="text-xl font-semibold text-white">{fixedPoints[mmol]?.hr || '-'}</p>
                            </div>
                            <div className="mt-2">
                                <p className="text-sm font-medium text-gray-400">Speed (m/s)</p>
                                <p className="text-xl font-semibold text-white">{fixedPoints[mmol]?.speed || '-'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
