import type { SessionDetails as SessionDetailsType } from '../types';
import { BOAT_CLASSES } from '../types';

interface Props {
    details: SessionDetailsType;
    onChange: (details: SessionDetailsType) => void;
    readOnly?: boolean;
}

export function SessionDetails({ details, onChange, readOnly = false }: Props) {
    const handleChange = (field: keyof SessionDetailsType, value: string) => {
        if (readOnly) return;
        onChange({ ...details, [field]: value });
    };

    return (
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="text-2xl font-semibold text-white">Athlete & Session Details</h2>
                {readOnly && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-sky-400/90">
                        View only
                    </span>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Athlete Name</label>
                    <input
                        type="text"
                        value={details.athleteName}
                        readOnly={readOnly}
                        onChange={(e) => handleChange('athleteName', e.target.value)}
                        className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:outline-none focus:border-blue-500 read-only:opacity-80 read-only:cursor-not-allowed"
                        placeholder="e.g. John Doe"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                    <input
                        type="date"
                        value={details.testDate}
                        readOnly={readOnly}
                        onChange={(e) => handleChange('testDate', e.target.value)}
                        className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:outline-none focus:border-blue-500 read-only:opacity-80 read-only:cursor-not-allowed"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Boat Class</label>
                    <select
                        value={details.boatClass}
                        disabled={readOnly}
                        onChange={(e) => handleChange('boatClass', e.target.value)}
                        className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-80 disabled:cursor-not-allowed"
                    >
                        {BOAT_CLASSES.map((bc) => (
                            <option key={bc} value={bc}>{bc}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Testing Protocol</label>
                    <input
                        type="text"
                        value={details.protocol}
                        readOnly={readOnly}
                        onChange={(e) => handleChange('protocol', e.target.value)}
                        className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:outline-none focus:border-blue-500 read-only:opacity-80 read-only:cursor-not-allowed"
                        placeholder="e.g. 6x4min Step Test"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Temperature</label>
                    <input
                        type="text"
                        value={details.temperature}
                        readOnly={readOnly}
                        onChange={(e) => handleChange('temperature', e.target.value)}
                        className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:outline-none focus:border-blue-500 read-only:opacity-80 read-only:cursor-not-allowed"
                        placeholder="e.g. 22°C"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Wind Speed</label>
                    <input
                        type="text"
                        value={details.windSpeed}
                        readOnly={readOnly}
                        onChange={(e) => handleChange('windSpeed', e.target.value)}
                        className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:outline-none focus:border-blue-500 read-only:opacity-80 read-only:cursor-not-allowed"
                        placeholder="e.g. 10 km/h"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Comments</label>
                <textarea
                    rows={3}
                    value={details.comments}
                    readOnly={readOnly}
                    onChange={(e) => handleChange('comments', e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:outline-none focus:border-blue-500 read-only:opacity-80 read-only:cursor-not-allowed"
                    placeholder="Notes on conditions, athlete state, etc."
                />
            </div>
        </div>
    );
}
