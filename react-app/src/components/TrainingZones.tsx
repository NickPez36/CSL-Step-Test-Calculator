import type { TrainingZones as TrainingZonesType } from '../types';

interface ZoneItem {
    zone: string;
    descriptor: string;
    hr: string;
    speed: string;
    vo2: string;
    rpe: string;
    duration: string;
    bgColor: string;
    textWhite?: boolean;
}

interface ZoneSection {
    domain: string;
    zones: ZoneItem[];
}

interface ThresholdSection {
    threshold: string;
}

type ZoneDataItem = ZoneSection | ThresholdSection;

interface Props {
    zones: TrainingZonesType;
}

export function TrainingZones({ zones }: Props) {
    const { maxHr, lt1Hr, lt2Hr, maxSpeed, lt1Speed, lt2Speed } = zones;

    // Calculate zone boundaries
    const r_max = Math.round(maxHr);
    const r_lt1 = Math.round(lt1Hr);
    const r_lt2 = Math.round(lt2Hr);
    const r_hr_midpoint = Math.round(lt1Hr + (lt2Hr - lt1Hr) / 2);

    const s_lt1 = lt1Speed;
    const s_lt2 = lt2Speed;
    const s_midpoint = s_lt1 + (s_lt2 - s_lt1) / 2;
    const s_75max = maxSpeed * 0.75;

    const zoneData: ZoneDataItem[] = [
        {
            domain: 'MODERATE',
            zones: [
                { zone: 'T1', descriptor: 'Light Aerobic', hr: `< ${Math.round(r_max * 0.7)}`, speed: `< ${s_75max.toFixed(2)}`, vo2: '50-60', rpe: 'Very Light - Light (1-2) [7-11]', duration: '1 - 6 h', bgColor: 'bg-lime-500' },
                { zone: 'T2', descriptor: 'Moderate Aerobic', hr: `${Math.round(r_max * 0.7)} - ${r_lt1}`, speed: `${s_75max.toFixed(2)} - ${s_lt1.toFixed(2)}`, vo2: '60-75', rpe: 'Light - Somewhat Hard (2-4) [11-13]', duration: '1 - 3 h', bgColor: 'bg-lime-400' },
            ]
        },
        { threshold: '1ST METABOLIC THRESHOLD MT1/LT1' },
        {
            domain: 'HEAVY',
            zones: [
                { zone: 'T3', descriptor: 'Heavy Aerobic', hr: `${r_lt1} - ${r_hr_midpoint}`, speed: `${s_lt1.toFixed(2)} - ${s_midpoint.toFixed(2)}`, vo2: '70-85', rpe: 'Somewhat Hard - Hard (4-5) [13-15]', duration: '45 - 90 min', bgColor: 'bg-yellow-400' },
                { zone: 'T4', descriptor: 'Threshold', hr: `${r_hr_midpoint} - ${r_lt2}`, speed: `${s_midpoint.toFixed(2)} - ${s_lt2.toFixed(2)}`, vo2: '80-90', rpe: 'Somewhat Hard - Very Hard (5-7) [15-17]', duration: '30 - 60 min', bgColor: 'bg-orange-400' },
            ]
        },
        { threshold: '2ND METABOLIC THRESHOLD MT2/LT2' },
        {
            domain: 'SEVERE*',
            zones: [
                { zone: 'T5', descriptor: 'Maximal Aerobic', hr: `> ${r_lt2}`, speed: `> ${s_lt2.toFixed(2)}`, vo2: '90-100', rpe: 'Very Hard - Maximal (7-10) [17-20]', duration: '12 - 30 min', bgColor: 'bg-orange-600', textWhite: true },
            ]
        },
        {
            domain: 'EXTREME*',
            zones: [
                { zone: 'T6', descriptor: 'Speed/Power Tolerance', hr: 'N/A', speed: 'N/A', vo2: 'N/A', rpe: 'Maximal (10) [20]', duration: '4 - 12 min', bgColor: 'bg-red-600', textWhite: true },
                { zone: 'T7', descriptor: 'Speed/Power Production', hr: 'N/A', speed: 'N/A', vo2: 'N/A', rpe: 'Maximal (10) [20]', duration: '2 - 6 min', bgColor: 'bg-red-800', textWhite: true },
                { zone: 'T8', descriptor: 'Neuro-muscular Power', hr: 'N/A', speed: 'N/A', vo2: 'N/A', rpe: 'Maximal (10) [20]', duration: '10 s - 2 min', bgColor: 'bg-rose-950', textWhite: true },
            ]
        }
    ];

    return (
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">4. Training Zones</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-center border-separate border-spacing-0 rounded-lg overflow-hidden">
                    <thead className="bg-gray-900 text-white">
                        <tr>
                            <th className="p-3 border border-gray-700 w-32">Domain</th>
                            <th className="p-3 border border-gray-700">Zone</th>
                            <th className="p-3 border border-gray-700">Descriptor</th>
                            <th className="p-3 border border-gray-700">Heart Rate (BPM)</th>
                            <th className="p-3 border border-gray-700">Speed (m/s)</th>
                            <th className="p-3 border border-gray-700">% VO2max</th>
                            <th className="p-3 border border-gray-700">Session RPE (1-10) [6-20]</th>
                            <th className="p-3 border border-gray-700">Work Duration</th>
                        </tr>
                    </thead>
                    <tbody className="font-bold text-gray-900">
                        {zoneData.map((section, idx) => {
                            if ('threshold' in section) {
                                return (
                                    <tr key={idx}>
                                        <td colSpan={8} className="bg-gray-700 text-white p-2 text-center font-bold tracking-wider text-xs border-y border-gray-600">
                                            {section.threshold}
                                        </td>
                                    </tr>
                                );
                            }

                            return section.zones.map((zone, zoneIdx) => (
                                <tr key={`${idx}-${zoneIdx}`}>
                                    {zoneIdx === 0 && (
                                        <td
                                            rowSpan={section.zones.length}
                                            className="bg-white border-b border-gray-300 p-2 align-middle font-black text-gray-900 tracking-wider text-center"
                                        >
                                            {section.domain}
                                        </td>
                                    )}
                                    <td className={`${zone.bgColor} p-3 border-b border-gray-800/20 ${zone.textWhite ? 'text-white' : ''}`}>{zone.zone}</td>
                                    <td className={`${zone.bgColor} p-3 border-b border-gray-800/20 text-left pl-4 ${zone.textWhite ? 'text-white' : ''}`}>{zone.descriptor}</td>
                                    <td className={`${zone.bgColor} p-3 border-b border-gray-800/20 ${zone.textWhite ? 'text-white' : ''}`}>{zone.hr}</td>
                                    <td className={`${zone.bgColor} p-3 border-b border-gray-800/20 ${zone.textWhite ? 'text-white' : ''}`}>{zone.speed}</td>
                                    <td className={`${zone.bgColor} p-3 border-b border-gray-800/20 ${zone.textWhite ? 'text-white' : ''}`}>{zone.vo2}</td>
                                    <td className={`${zone.bgColor} p-3 border-b border-gray-800/20 ${zone.textWhite ? 'text-white' : ''}`}>{zone.rpe}</td>
                                    <td className={`${zone.bgColor} p-3 border-b border-gray-800/20 ${zone.textWhite ? 'text-white' : ''}`}>{zone.duration}</td>
                                </tr>
                            ));
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
