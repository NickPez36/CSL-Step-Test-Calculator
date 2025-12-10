import { useCallback } from 'react';
import type { StepData, TableType } from '../types';
import { TABLE_CONFIGS } from '../types';

interface Props {
    tableType: TableType;
    onTableTypeChange: (type: TableType) => void;
    data: StepData[];
    onDataChange: (data: StepData[]) => void;
}

export function DataInputTable({ tableType, onTableTypeChange, data, onDataChange }: Props) {
    const config = TABLE_CONFIGS[tableType];

    const handleCellChange = useCallback((rowIndex: number, field: keyof StepData, value: string) => {
        const newData = [...data];
        const numValue = value === '' || value === 'Max' ? null : parseFloat(value);
        newData[rowIndex] = { ...newData[rowIndex], [field]: numValue };
        onDataChange(newData);
    }, [data, onDataChange]);

    const addRow = useCallback(() => {
        const newRow: StepData = {
            step: data.length + 1,
            hrPlanned: null,
            hrAchieved: 0,
            speed: 0,
            lactate: 0,
            strokeRate: null,
            time: null
        };
        onDataChange([...data, newRow]);
    }, [data, onDataChange]);

    const removeRow = useCallback(() => {
        if (data.length > 1) {
            onDataChange(data.slice(0, -1));
        }
    }, [data, onDataChange]);

    const handlePaste = useCallback((e: React.ClipboardEvent, startRow: number, startCol: number) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text');
        const rows = text.split(/\r?\n/).filter(row => row.length > 0);

        const newData = [...data];
        const fieldOrder: (keyof StepData)[] = ['step', 'hrPlanned', 'hrAchieved', 'speed', 'lactate', 'strokeRate', 'time'];

        rows.forEach((rowText, rowIndex) => {
            const cells = rowText.split('\t');
            const targetRowIndex = startRow + rowIndex;

            if (targetRowIndex < newData.length) {
                cells.forEach((cellText, cellIndex) => {
                    const targetColIndex = startCol + cellIndex;
                    if (targetColIndex < fieldOrder.length && targetColIndex > 0) {
                        const field = fieldOrder[targetColIndex];
                        const value = cellText === 'Max' ? null : parseFloat(cellText);
                        if (!isNaN(value as number) || cellText === 'Max') {
                            newData[targetRowIndex] = { ...newData[targetRowIndex], [field]: value };
                        }
                    }
                });
            }
        });

        onDataChange(newData);
    }, [data, onDataChange]);

    return (
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">
            <h2 className="text-2xl font-semibold mb-2 text-white">1. Input Data</h2>

            <div className="mb-4">
                <label className="font-semibold text-gray-300">Protocol Type:</label>
                <div className="mt-2 flex bg-gray-700 rounded-lg p-1 max-w-md">
                    {(['hr', 'speed', 'sr'] as TableType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => onTableTypeChange(type)}
                            className={`flex-1 py-1 px-2 text-sm rounded-md transition-all ${tableType === type
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {type === 'hr' ? 'HR Based' : type === 'speed' ? 'Speed Based' : 'Stroke Rate Based'}
                        </button>
                    ))}
                </div>
            </div>

            <p className="text-sm text-gray-400 mb-4">
                You can navigate the table with arrow keys and paste data from a spreadsheet.
            </p>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-700">
                        <tr>
                            {config.headers.map((header, i) => (
                                <th key={i} className="p-2 font-semibold text-gray-300">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                <td className="p-1">
                                    <input
                                        type="text"
                                        value={row.step}
                                        readOnly
                                        className="w-full p-2 border border-gray-600 rounded-md text-center bg-gray-600 text-gray-100"
                                    />
                                </td>
                                <td className="p-1">
                                    <input
                                        type={rowIndex === data.length - 1 ? 'text' : 'number'}
                                        value={rowIndex === data.length - 1 ? 'Max' : (row.hrPlanned ?? '')}
                                        readOnly={rowIndex === data.length - 1}
                                        onChange={(e) => handleCellChange(rowIndex, 'hrPlanned', e.target.value)}
                                        onPaste={(e) => handlePaste(e, rowIndex, 1)}
                                        className={`w-full p-2 border border-gray-600 rounded-md text-center bg-gray-700 text-gray-100 focus:outline-none focus:border-blue-500 ${rowIndex === data.length - 1 ? 'bg-gray-600' : ''
                                            }`}
                                        placeholder={config.headers[1].split(' ')[0]}
                                    />
                                </td>
                                <td className="p-1">
                                    <input
                                        type="number"
                                        step="any"
                                        value={row.hrAchieved || ''}
                                        onChange={(e) => handleCellChange(rowIndex, 'hrAchieved', e.target.value)}
                                        onPaste={(e) => handlePaste(e, rowIndex, 2)}
                                        className="w-full p-2 border border-gray-600 rounded-md text-center bg-gray-700 text-gray-100 focus:outline-none focus:border-blue-500"
                                        placeholder={config.headers[2].split(' ')[0]}
                                    />
                                </td>
                                <td className="p-1">
                                    <input
                                        type="number"
                                        step="any"
                                        value={row.speed || ''}
                                        onChange={(e) => handleCellChange(rowIndex, 'speed', e.target.value)}
                                        onPaste={(e) => handlePaste(e, rowIndex, 3)}
                                        className="w-full p-2 border border-gray-600 rounded-md text-center bg-gray-700 text-gray-100 focus:outline-none focus:border-blue-500"
                                        placeholder={config.headers[3].split(' ')[0]}
                                    />
                                </td>
                                <td className="p-1">
                                    <input
                                        type="number"
                                        step="any"
                                        value={row.lactate || ''}
                                        onChange={(e) => handleCellChange(rowIndex, 'lactate', e.target.value)}
                                        onPaste={(e) => handlePaste(e, rowIndex, 4)}
                                        className="w-full p-2 border border-gray-600 rounded-md text-center bg-gray-700 text-gray-100 focus:outline-none focus:border-blue-500"
                                        placeholder={config.headers[4].split(' ')[0]}
                                    />
                                </td>
                                <td className="p-1">
                                    <input
                                        type="number"
                                        step="any"
                                        value={row.strokeRate ?? ''}
                                        onChange={(e) => handleCellChange(rowIndex, 'strokeRate', e.target.value)}
                                        onPaste={(e) => handlePaste(e, rowIndex, 5)}
                                        className="w-full p-2 border border-gray-600 rounded-md text-center bg-gray-700 text-gray-100 focus:outline-none focus:border-blue-500"
                                        placeholder={config.headers[5].split(' ')[0]}
                                    />
                                </td>
                                <td className="p-1">
                                    <input
                                        type="number"
                                        step="any"
                                        value={row.time ?? ''}
                                        onChange={(e) => handleCellChange(rowIndex, 'time', e.target.value)}
                                        onPaste={(e) => handlePaste(e, rowIndex, 6)}
                                        className="w-full p-2 border border-gray-600 rounded-md text-center bg-gray-700 text-gray-100 focus:outline-none focus:border-blue-500"
                                        placeholder="Time"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex space-x-2 mt-4">
                <button
                    onClick={addRow}
                    className="bg-gray-600 text-gray-200 font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 transition-all duration-300 text-xs"
                >
                    Add Row
                </button>
                <button
                    onClick={removeRow}
                    className="bg-gray-600 text-gray-200 font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 transition-all duration-300 text-xs"
                >
                    Remove Last Row
                </button>
            </div>
        </div>
    );
}
