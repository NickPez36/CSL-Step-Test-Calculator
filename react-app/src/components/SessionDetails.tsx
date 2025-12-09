import type { SessionDetails as SessionDetailsType } from '../types';
import { BOAT_CLASSES } from '../types';

interface Props {
    details: SessionDetailsType;
    onChange: (details: SessionDetailsType) => void;
}

export function SessionDetails({ details, onChange }: Props) {
    const handleChange = (field: keyof SessionDetailsType, value: string) => {
        onChange({ ...details, [field]: value });
    };

    return (
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">Athlete & Session Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Athlete Name</label>
                    <input
                        type="text"
                        value={details.athleteName}
                        onChange={(e) => handleChange('athleteName', e.target.value)}
                        className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:outline-none focus:border-blue-500"
                        placeholder="e.g. John Doe"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                    <input
                        type="date"
                        value={details.testDate}
                        onChange={(e) => handleChange('testDate', e.target.value)}
                        className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:outline-none focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Boat Class</label>
                    <select
                        value={details.boatClass}
                        onChange={(e) => handleChange('boatClass', e.target.value)}
                        className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:outline-none focus:border-blue-500"
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
                        onChange={(e) => handleChange('protocol', e.target.value)}
                        className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:outline-none focus:border-blue-500"
                        placeholder="e.g. 6x4min Step Test"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Comments</label>
                <textarea
                    rows={3}
                    value={details.comments}
                    onChange={(e) => handleChange('comments', e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:outline-none focus:border-blue-500"
                    placeholder="Notes on conditions, athlete state, etc."
                />
            </div>
        </div>
    );
}
