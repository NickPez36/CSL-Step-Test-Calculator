import { useCallback, useEffect, useMemo, useState } from 'react';
import { calculateThresholds, parseTableData } from '../services/calculations';
import { invalidateBackendCache, listSavedSessions } from '../services/sessionLibrary';
import type { CalculationResult, SavedTestSession } from '../types';
import { ComparisonCharts } from './ComparisonCharts';
import { ComparisonSessionSelectors } from './ComparisonSessionSelectors';
import {
    ComparisonFixedLactateGrid,
    ComparisonMetadataCards,
    ComparisonSummaryStrip,
    ComparisonThresholdPanels,
} from './ComparisonMetricsPanels';

interface ComparisonViewProps {
    showToast: (message: string, variant: 'success' | 'error' | 'info') => void;
}

export function ComparisonView({ showToast }: ComparisonViewProps) {
    const [sessions, setSessions] = useState<SavedTestSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [athleteKeyA, setAthleteKeyA] = useState('');
    const [athleteKeyB, setAthleteKeyB] = useState('');
    const [idA, setIdA] = useState('');
    const [idB, setIdB] = useState('');
    const [errorA, setErrorA] = useState<string | null>(null);
    const [errorB, setErrorB] = useState<string | null>(null);
    const [resultA, setResultA] = useState<CalculationResult | null>(null);
    const [resultB, setResultB] = useState<CalculationResult | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            invalidateBackendCache();
            const rows = await listSavedSessions();
            setSessions(rows);
        } catch (e) {
            showToast((e as Error).message, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    useEffect(() => {
        if (idA && !sessions.some((s) => s.id === idA)) setIdA('');
    }, [sessions, idA]);

    useEffect(() => {
        if (idB && !sessions.some((s) => s.id === idB)) setIdB('');
    }, [sessions, idB]);

    const sessionA = useMemo(() => sessions.find((s) => s.id === idA), [sessions, idA]);
    const sessionB = useMemo(() => sessions.find((s) => s.id === idB), [sessions, idB]);

    useEffect(() => {
        if (!sessionA) {
            setResultA(null);
            setErrorA(null);
            return;
        }
        try {
            const parsed = parseTableData(sessionA.inputData, sessionA.tableType);
            setResultA(calculateThresholds(parsed));
            setErrorA(null);
        } catch (e) {
            setErrorA((e as Error).message);
            setResultA(null);
        }
    }, [sessionA]);

    useEffect(() => {
        if (!sessionB) {
            setResultB(null);
            setErrorB(null);
            return;
        }
        try {
            const parsed = parseTableData(sessionB.inputData, sessionB.tableType);
            setResultB(calculateThresholds(parsed));
            setErrorB(null);
        } catch (e) {
            setErrorB((e as Error).message);
            setResultB(null);
        }
    }, [sessionB]);

    const labelA = sessionA
        ? `${sessionA.sessionDetails.athleteName.trim() || 'A'} (${sessionA.sessionDetails.testDate || '—'})`
        : 'Session A';
    const labelB = sessionB
        ? `${sessionB.sessionDetails.athleteName.trim() || 'B'} (${sessionB.sessionDetails.testDate || '—'})`
        : 'Session B';

    const shortLabelA = sessionA
        ? `${sessionA.sessionDetails.athleteName.trim() || 'Athlete'} · ${sessionA.sessionDetails.testDate || '—'}`
        : '';
    const shortLabelB = sessionB
        ? `${sessionB.sessionDetails.athleteName.trim() || 'Athlete'} · ${sessionB.sessionDetails.testDate || '—'}`
        : '';

    const canStrokeRate = !!resultA?.regressions.sr && !!resultB?.regressions.sr;
    const canEfficiency = !!resultA?.efficiencyData && !!resultB?.efficiencyData;

    const handleAthleteA = (key: string) => {
        setAthleteKeyA(key);
        setIdA('');
    };

    const handleAthleteB = (key: string) => {
        setAthleteKeyB(key);
        setIdB('');
    };

    return (
        <div className="space-y-10">
            <ComparisonSessionSelectors
                sessions={sessions}
                loading={loading}
                athleteKeyA={athleteKeyA}
                athleteKeyB={athleteKeyB}
                idA={idA}
                idB={idB}
                onAthleteAChange={handleAthleteA}
                onAthleteBChange={handleAthleteB}
                onSessionAChange={setIdA}
                onSessionBChange={setIdB}
                onRefresh={() => void refresh()}
            />

            {(errorA || errorB) && (
                <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
                    {errorA && (
                        <p>
                            <span className="font-semibold text-rose-100">Session A:</span> {errorA}
                        </p>
                    )}
                    {errorB && (
                        <p className={errorA ? 'mt-2' : ''}>
                            <span className="font-semibold text-rose-100">Session B:</span> {errorB}
                        </p>
                    )}
                </div>
            )}

            {sessionA && sessionB && resultA && resultB && (
                <>
                    <ComparisonSummaryStrip shortLabelA={shortLabelA} shortLabelB={shortLabelB} />

                    <ComparisonMetadataCards sessionA={sessionA} sessionB={sessionB} />

                    <ComparisonThresholdPanels
                        resultA={resultA}
                        resultB={resultB}
                        labelShortA={shortLabelA}
                        labelShortB={shortLabelB}
                    />

                    <ComparisonFixedLactateGrid resultA={resultA} resultB={resultB} />

                    <ComparisonCharts
                        resultA={resultA}
                        resultB={resultB}
                        labelA={labelA}
                        labelB={labelB}
                        canStrokeRate={canStrokeRate}
                        canEfficiency={canEfficiency}
                    />
                </>
            )}
        </div>
    );
}
