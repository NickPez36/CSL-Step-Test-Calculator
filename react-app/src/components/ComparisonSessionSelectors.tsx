import { useMemo } from 'react';
import type { SavedTestSession } from '../types';
import {
    buildAthleteOptions,
    sessionsForAthlete,
    sortSessionsForPicker,
    sessionDateLabel,
} from './comparisonSessionUtils';

const selectClass =
    'w-full bg-slate-800/90 text-slate-100 border border-slate-600/90 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-sky-500/80 focus:border-sky-500/50 focus:outline-none transition-colors';

interface Props {
    sessions: SavedTestSession[];
    loading: boolean;
    athleteKeyA: string;
    athleteKeyB: string;
    idA: string;
    idB: string;
    onAthleteAChange: (key: string) => void;
    onAthleteBChange: (key: string) => void;
    onSessionAChange: (id: string) => void;
    onSessionBChange: (id: string) => void;
    onRefresh: () => void;
}

export function ComparisonSessionSelectors({
    sessions,
    loading,
    athleteKeyA,
    athleteKeyB,
    idA,
    idB,
    onAthleteAChange,
    onAthleteBChange,
    onSessionAChange,
    onSessionBChange,
    onRefresh,
}: Props) {
    const athletes = useMemo(() => buildAthleteOptions(sessions), [sessions]);
    const listA = useMemo(
        () => sortSessionsForPicker(sessionsForAthlete(sessions, athleteKeyA)),
        [sessions, athleteKeyA]
    );
    const listB = useMemo(
        () => sortSessionsForPicker(sessionsForAthlete(sessions, athleteKeyB)),
        [sessions, athleteKeyB]
    );

    return (
        <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900/60 to-slate-900/90 p-6 shadow-xl shadow-black/20">
            <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight text-white">Session selection</h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Choose an athlete, then the test date. Compare any two saved step tests.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => onRefresh()}
                    className="mt-3 shrink-0 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 sm:mt-0"
                    disabled={loading}
                >
                    {loading ? 'Loading…' : 'Refresh library'}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <SelectorColumn
                    title="Baseline"
                    badge="A"
                    badgeClass="bg-sky-600/90 text-white"
                    athletes={athletes}
                    athleteKey={athleteKeyA}
                    sessionList={listA}
                    sessionId={idA}
                    otherSelectedId={idB}
                    loading={loading}
                    onAthleteChange={onAthleteAChange}
                    onSessionChange={onSessionAChange}
                />
                <SelectorColumn
                    title="Comparison"
                    badge="B"
                    badgeClass="bg-amber-600/90 text-white"
                    athletes={athletes}
                    athleteKey={athleteKeyB}
                    sessionList={listB}
                    sessionId={idB}
                    otherSelectedId={idA}
                    loading={loading}
                    onAthleteChange={onAthleteBChange}
                    onSessionChange={onSessionBChange}
                />
            </div>

            {sessions.length === 0 && !loading && (
                <p className="mt-6 rounded-lg border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-100/90">
                    No saved sessions yet. Save tests from the Calculator tab to compare them here.
                </p>
            )}
        </div>
    );
}

function SelectorColumn({
    title,
    badge,
    badgeClass,
    athletes,
    athleteKey,
    sessionList,
    sessionId,
    otherSelectedId,
    loading,
    onAthleteChange,
    onSessionChange,
}: {
    title: string;
    badge: string;
    badgeClass: string;
    athletes: { key: string; displayName: string }[];
    athleteKey: string;
    sessionList: SavedTestSession[];
    sessionId: string;
    otherSelectedId: string;
    loading: boolean;
    onAthleteChange: (key: string) => void;
    onSessionChange: (id: string) => void;
}) {
    return (
        <div className="rounded-xl border border-slate-700/60 bg-slate-950/40 p-5">
            <div className="mb-4 flex items-center gap-2">
                <span className={`inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-md px-2 text-xs font-bold ${badgeClass}`}>
                    {badge}
                </span>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Athlete</label>
                    <select
                        value={athleteKey}
                        onChange={(e) => onAthleteChange(e.target.value)}
                        className={selectClass}
                        disabled={loading}
                    >
                        <option value="">Select athlete…</option>
                        {athletes.map((a) => (
                            <option key={a.key} value={a.key}>
                                {a.displayName}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Test date</label>
                    <select
                        value={sessionId}
                        onChange={(e) => onSessionChange(e.target.value)}
                        className={selectClass}
                        disabled={loading || !athleteKey}
                    >
                        <option value="">{athleteKey ? 'Select test…' : '—'}</option>
                        {sessionList.map((s) => (
                            <option key={s.id} value={s.id} disabled={s.id === otherSelectedId}>
                                {sessionDateLabel(s, sessionList)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
