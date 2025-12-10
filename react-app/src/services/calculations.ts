import regression from 'regression';
import type {
    ParsedDataPoint,
    CalculationResult,
    EfficiencyDataPoint,
    FixedLactateResults,
    RegressionResult,
    LinePoint,
    StepData,
    TableType
} from '../types';

// Calculate perpendicular distance from point to line
function perpendicularDistance(
    p: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number }
): number {
    const { x, y } = p;
    const { x: x1, y: y1 } = a;
    const { x: x2, y: y2 } = b;
    const A = y2 - y1;
    const B = x1 - x2;
    const C = -A * x1 - B * y1;
    return Math.abs(A * x + B * y + C) / Math.sqrt(A * A + B * B);
}

// Parse table data based on table type
export function parseTableData(data: StepData[], tableType: TableType): ParsedDataPoint[] {
    const parsed: ParsedDataPoint[] = [];

    for (const row of data) {
        let hr: number, speed: number, lactate: number, sr: number;

        // Map fields based on table type
        switch (tableType) {
            case 'hr':
                hr = row.hrAchieved;
                speed = row.speed;
                lactate = row.lactate;
                sr = row.strokeRate ?? 0;
                break;
            case 'speed':
                speed = row.hrAchieved; // In speed mode, "achieved" column is speed
                hr = row.speed; // The "Speed" column in this mode is actually HR
                lactate = row.lactate;
                sr = row.strokeRate ?? 0;
                break;
            case 'sr':
                sr = row.hrAchieved; // In SR mode, "achieved" column is SR
                speed = row.speed;
                lactate = row.lactate;
                hr = row.strokeRate ?? 0; // The "SR" column in this mode is actually HR
                break;
        }

        if (!isNaN(hr) && !isNaN(speed) && !isNaN(lactate) && hr > 0 && speed > 0 && lactate > 0) {
            parsed.push({ hr, speed, lactate, sr });
        }
    }

    return parsed.sort((a, b) => a.speed - b.speed);
}

// Main calculation function
export function calculateThresholds(parsedData: ParsedDataPoint[]): CalculationResult {
    if (parsedData.length < 5) {
        throw new Error('Not enough valid data points. A minimum of 5 points are required for this analysis.');
    }

    const hasSrData = parsedData.every(d => d.sr > 0);

    // Create regressions
    const speedLactateRegression = regression.polynomial(
        parsedData.map(d => [d.speed, d.lactate]),
        { order: 3 }
    ) as unknown as RegressionResult;

    const speedHrRegression = regression.polynomial(
        parsedData.map(d => [d.speed, d.hr]),
        { order: 3 }
    ) as unknown as RegressionResult;

    let speedSrRegression: RegressionResult | null = null;
    if (hasSrData) {
        speedSrRegression = regression.polynomial(
            parsedData.map(d => [d.speed, d.sr]),
            { order: 3 }
        ) as unknown as RegressionResult;
    }

    // Calculate LT1 (Lowest Lactate + 0.4 method)
    const minLactatePoint = parsedData.reduce(
        (min, p) => (p.lactate < min.lactate ? p : min),
        parsedData[0]
    );
    const lt1Lactate = minLactatePoint.lactate + 0.4;
    const searchStartSpeedForLt1 = minLactatePoint.speed;

    let lt1Speed = 0;
    let minSpeedDiff = Infinity;
    const speedRange = parsedData[parsedData.length - 1].speed - parsedData[0].speed;

    for (let s = searchStartSpeedForLt1; s <= parsedData[parsedData.length - 1].speed; s += speedRange / 1000) {
        const predictedLactate = speedLactateRegression.predict(s)[1];
        const diff = Math.abs(predictedLactate - lt1Lactate);
        if (diff < minSpeedDiff) {
            minSpeedDiff = diff;
            lt1Speed = s;
        }
    }
    const lt1Hr = speedHrRegression.predict(lt1Speed)[1];

    // Calculate LT2 (Modified DMax method)
    let modDmaxStartDataPoint = parsedData[0];
    for (let i = 1; i < parsedData.length; i++) {
        if (parsedData[i].lactate - parsedData[i - 1].lactate > 0.4) {
            modDmaxStartDataPoint = parsedData[i - 1];
            break;
        }
    }

    const endPointDataPoint = parsedData[parsedData.length - 1];
    const modStartPoint: LinePoint = { x: modDmaxStartDataPoint.speed, y: modDmaxStartDataPoint.lactate };
    const endPoint: LinePoint = { x: endPointDataPoint.speed, y: endPointDataPoint.lactate };

    let maxDistance = 0;
    let lt2Point = { speed: 0, lactate: 0 };

    for (let s = modStartPoint.x; s <= endPoint.x; s += speedRange / 1000) {
        const curveLactate = speedLactateRegression.predict(s)[1];
        const distance = perpendicularDistance({ x: s, y: curveLactate }, modStartPoint, endPoint);
        if (distance > maxDistance) {
            maxDistance = distance;
            lt2Point = { speed: s, lactate: curveLactate };
        }
    }
    const lt2Hr = speedHrRegression.predict(lt2Point.speed)[1];

    // Calculate fixed lactate points (2, 4, 6 mmol/L)
    const fixedLactateTargets = [2, 4, 6];
    const fixedLactateResults: FixedLactateResults = {};

    fixedLactateTargets.forEach(targetLactate => {
        let bestSpeed = 0;
        let minDiff = Infinity;

        for (let s = parsedData[0].speed; s <= parsedData[parsedData.length - 1].speed; s += speedRange / 1000) {
            const predictedLactate = speedLactateRegression.predict(s)[1];
            const diff = Math.abs(predictedLactate - targetLactate);
            if (diff < minDiff) {
                minDiff = diff;
                bestSpeed = s;
            }
        }

        fixedLactateResults[targetLactate] = {
            hr: speedHrRegression.predict(bestSpeed)[1].toFixed(0),
            speed: bestSpeed.toFixed(1)
        };
    });

    // Calculate efficiency data
    let efficiencyData: EfficiencyDataPoint[] | null = null;
    if (hasSrData) {
        efficiencyData = parsedData.map((d, i) => ({
            step: i + 1,
            efficiency: (d.speed ** 3) / (d.sr / 60)
        }));

        const baselineEfficiency = efficiencyData[0].efficiency;
        efficiencyData = efficiencyData.map((item, index) => ({
            ...item,
            percentChange: index === 0 ? 0 : ((item.efficiency - baselineEfficiency) / baselineEfficiency) * 100
        }));
    }

    // Calculate training zones
    const maxHr = parsedData[parsedData.length - 1].hr;
    const maxSpeed = parsedData[parsedData.length - 1].speed;

    return {
        parsedData,
        efficiencyData,
        regressions: {
            lactate: speedLactateRegression,
            hr: speedHrRegression,
            sr: speedSrRegression
        },
        thresholds: {
            lt1: { speed: lt1Speed, lactate: lt1Lactate },
            lt2: lt2Point,
            modDmaxLine: { start: modStartPoint, end: endPoint }
        },
        displayThresholds: {
            lt1: {
                hr: lt1Hr.toFixed(0),
                speed: lt1Speed.toFixed(1),
                lactate: lt1Lactate.toFixed(1)
            },
            lt2: {
                hr: lt2Hr.toFixed(0),
                speed: lt2Point.speed.toFixed(1),
                lactate: lt2Point.lactate.toFixed(1)
            }
        },
        fixedLactatePoints: fixedLactateResults,
        trainingZones: {
            maxHr,
            lt1Hr,
            lt2Hr,
            maxSpeed,
            lt1Speed,
            lt2Speed: lt2Point.speed
        }
    };
}
