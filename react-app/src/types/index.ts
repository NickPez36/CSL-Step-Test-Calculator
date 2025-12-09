// Data point from step test
export interface StepData {
    step: number;
    hrPlanned: number | null;
    hrAchieved: number;
    speed: number;
    lactate: number;
    strokeRate: number | null;
}

// Parsed/validated data point for calculations
export interface ParsedDataPoint {
    hr: number;
    speed: number;
    lactate: number;
    sr: number;
}

// Threshold result
export interface Threshold {
    hr: string;
    speed: string;
    lactate: string;
}

// Thresholds container
export interface Thresholds {
    lt1: Threshold;
    lt2: Threshold;
}

// Fixed lactate point result
export interface FixedLactatePoint {
    hr: string;
    speed: string;
}

export interface FixedLactateResults {
    [mmol: number]: FixedLactatePoint;
}

// Efficiency data point
export interface EfficiencyDataPoint {
    step: number;
    efficiency: number;
    percentChange?: number;
}

// Regression result (from regression-js library)
export interface RegressionResult {
    predict: (x: number) => [number, number];
    equation: number[];
    r2: number;
    string: string;
}

// All regressions from calculation
export interface Regressions {
    lactate: RegressionResult;
    hr: RegressionResult;
    sr: RegressionResult | null;
}

// ModDMax line points
export interface LinePoint {
    x: number;
    y: number;
}

// Full calculation result
export interface CalculationResult {
    parsedData: ParsedDataPoint[];
    efficiencyData: EfficiencyDataPoint[] | null;
    regressions: Regressions;
    thresholds: {
        lt1: { speed: number; lactate: number };
        lt2: { speed: number; lactate: number };
        modDmaxLine: { start: LinePoint; end: LinePoint };
    };
    displayThresholds: Thresholds;
    fixedLactatePoints: FixedLactateResults;
    trainingZones: TrainingZones;
}

// Training zone data
export interface TrainingZones {
    maxHr: number;
    lt1Hr: number;
    lt2Hr: number;
    maxSpeed: number;
    lt1Speed: number;
    lt2Speed: number;
}

// Athlete session details
export interface SessionDetails {
    athleteName: string;
    testDate: string;
    boatClass: string;
    protocol: string;
    comments: string;
}

// Table configuration types
export type TableType = 'hr' | 'speed' | 'sr';

export interface TableConfig {
    headers: string[];
    classes: string[];
}

export const TABLE_CONFIGS: Record<TableType, TableConfig> = {
    hr: {
        headers: ['Step', 'HR Planned (BPM)', 'HR Achieved (BPM)', 'Speed (m/s)', 'Lactate (mmol)', 'Stroke Rate (spm)'],
        classes: ['', '', 'hr', 'speed', 'lactate', 'sr']
    },
    speed: {
        headers: ['Step', 'Speed Planned (m/s)', 'Speed Achieved (m/s)', 'Heart Rate (BPM)', 'Lactate (mmol)', 'Stroke Rate (spm)'],
        classes: ['', '', 'speed', 'hr', 'lactate', 'sr']
    },
    sr: {
        headers: ['Step', 'SR Planned (spm)', 'SR Achieved (spm)', 'Speed (m/s)', 'Lactate (mmol)', 'Heart Rate (BPM)'],
        classes: ['', '', 'sr', 'speed', 'lactate', 'hr']
    }
};

// Boat class options
export const BOAT_CLASSES = [
    'K1 Men',
    'K1 Women',
    'C1 Men',
    'C1 Women',
    'Kayak Cross Men',
    'Kayak Cross Women',
    'Other'
] as const;

export type BoatClass = typeof BOAT_CLASSES[number];
