import { useCallback, useEffect, useMemo, useState } from 'react';
import { parseTableData } from '../services/calculations';
import {
    deleteSavedSession,
    detectBackend,
    invalidateBackendCache,
    listSavedSessions,
    runViewerMirrorMigrationIfNeeded,
    saveTestSession,
    summaryFromCalculation,
} from '../services/sessionLibrary';
import type { CalculationResult, SavedTestSession, SessionDetails as SessionDetailsType, StepData, TableType } from '../types';

interface SessionLibraryPanelProps {
    sessionDetails: SessionDetailsType;
    tableType: TableType;
    inputData: StepData[];
    result: CalculationResult | null;
    loadedSessionId: string | null;
    onClearSessionId: () => void;
    onLoadSession: (session: SavedTestSession) => void;
    showToast: (message: string, variant: 'success' | 'error' | 'info') => void;
    /** When true, hide save/delete and list de-identified sessions only (Firestore viewer path). */
    viewerMode?: boolean;
}

function formatSavedAt(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch {
        return iso;
    }
}

function validateForSave(
    sessionDetails: SessionDetailsType,
    inputData: StepData[],
    tableType: TableType
): { ok: true } | { ok: false; message: string } {
    if (!sessionDetails.athleteName.trim()) {
        return { ok: false, message: 'Enter an athlete name before saving.' };
    }
    if (!sessionDetails.testDate.trim()) {
        return { ok: false, message: 'Select a test date before saving.' };
    }
    const parsed = parseTableData(inputData, tableType);
    if (parsed.length < 5) {
        return {
            ok: false,
            message: 'Need at least five valid steps (heart rate, speed, and lactate) before saving.',
        };
    }
    return { ok: true };
}

export function SessionLibraryPanel({
    sessionDetails,
    tableType,
    inputData,
    result,
    loadedSessionId,
    onClearSessionId,
    onLoadSession,
    showToast,
    viewerMode = false,
}: SessionLibraryPanelProps) {
    const [expanded, setExpanded] = useState(true);
    const [sessions, setSessions] = useState<SavedTestSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [backend, setBackend] = useState<'firestore' | 'api' | 'browser' | 'checking'>('checking');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            invalidateBackendCache();
            const b = await detectBackend();
            setBackend(b);
            if (b === 'firestore' && !viewerMode) {
                await runViewerMirrorMigrationIfNeeded();
            }
            const rows = await listSavedSessions();
            setSessions(rows);
        } catch (e) {
            showToast((e as Error).message, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast, viewerMode]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return sessions;
        return sessions.filter((s) => {
            const d = s.sessionDetails;
            const hay = [
                d.athleteName,
                d.testDate,
                d.boatClass,
                d.protocol,
                d.comments,
                d.temperature,
                d.windSpeed,
            ]
                .join(' ')
                .toLowerCase();
            return hay.includes(q);
        });
    }, [sessions, search]);

    const handleSave = async (idToSave?: string) => {
        if (viewerMode) return;
        const v = validateForSave(sessionDetails, inputData, tableType);
        if (!v.ok) {
            showToast(v.message, 'error');
            return;
        }
        setSaving(true);
        try {
            const summary = result ? summaryFromCalculation(result) : null;
            await saveTestSession({
                id: idToSave,
                sessionDetails,
                tableType,
                inputData,
                summary,
            });
            showToast(idToSave ? 'Session successfully updated.' : 'Test session saved to your library.', 'success');
            await refresh();
        } catch (e) {
            showToast((e as Error).message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleLoad = (s: SavedTestSession) => {
        try {
            const parsed = parseTableData(s.inputData, s.tableType);
            if (parsed.length < 5) {
                showToast('This saved session does not contain enough valid rows to analyse.', 'error');
                return;
            }
            onLoadSession(s);
            showToast(`Loaded session for ${s.sessionDetails.athleteName || 'athlete'}.`, 'success');
        } catch (e) {
            showToast((e as Error).message, 'error');
        }
    };

    const handleConfirmDelete = async () => {
        if (viewerMode || !deleteId) return;
        try {
            await deleteSavedSession(deleteId);
            showToast('Session removed from the library.', 'success');
            setDeleteId(null);
            await refresh();
        } catch (e) {
            showToast((e as Error).message, 'error');
        }
    };

    const backendLabel =
        backend === 'firestore'
            ? viewerMode
                ? 'Cloud library (viewer — de-identified)'
                : 'Cloud library (Firestore)'
            : backend === 'api'
              ? 'Server library (API)'
              : backend === 'browser'
                ? 'Browser library (IndexedDB)'
                : 'Detecting…';

    return (
        <section className="mb-8 rounded-2xl border border-slate-600/60 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 shadow-xl shadow-black/20">
            <div className="flex flex-col gap-4 border-b border-slate-600/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold tracking-tight text-white">Test session library</h2>
                        <span className="rounded-full border border-slate-500/50 bg-slate-800/80 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                            {backendLabel}
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setExpanded((e) => !e)}
                    className="shrink-0 rounded-lg border border-slate-500/50 bg-slate-800/60 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/60 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                >
                    {expanded ? 'Collapse' : 'Expand'}
                </button>
            </div>

            {expanded && (
                <div className="space-y-4 p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div className="flex flex-1 flex-col gap-2">
                            <label htmlFor="session-search" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Search library
                            </label>
                            <input
                                id="session-search"
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Athlete, date, boat class, protocol, notes…"
                                className="w-full rounded-lg border border-slate-600 bg-slate-950/50 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {!viewerMode && loadedSessionId ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleSave(loadedSessionId)}
                                        disabled={saving}
                                        className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                                    >
                                        {saving ? 'Updating…' : 'Update session'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSave(undefined)}
                                        disabled={saving}
                                        className="rounded-lg border border-sky-500/60 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-sky-300 hover:bg-sky-900/50 disabled:opacity-50"
                                    >
                                        {saving ? 'Saving…' : 'Save as new'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClearSessionId}
                                        className="rounded-lg border border-slate-500/60 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700/50"
                                    >
                                        Clear edit mode
                                    </button>
                                </>
                            ) : !viewerMode ? (
                                <button
                                    type="button"
                                    onClick={() => handleSave(undefined)}
                                    disabled={saving}
                                    className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                                >
                                    {saving ? 'Saving…' : 'Save current test'}
                                </button>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => void refresh()}
                                disabled={loading}
                                className="rounded-lg border border-slate-500/60 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700/50 disabled:opacity-50"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-600/50 bg-slate-950/30">
                        <div className="max-h-[min(420px,55vh)] overflow-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="sticky top-0 z-10 border-b border-slate-600/60 bg-slate-900/95 backdrop-blur">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-slate-300">Athlete</th>
                                        <th className="px-4 py-3 font-semibold text-slate-300">Date</th>
                                        <th className="px-4 py-3 font-semibold text-slate-300">Class</th>
                                        <th className="px-4 py-3 font-semibold text-slate-300">LT1 / LT2 (m/s)</th>
                                        <th className="px-4 py-3 font-semibold text-slate-300">Saved</th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/60">
                                    {loading && sessions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                                                Loading library…
                                            </td>
                                        </tr>
                                    ) : filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                                                No sessions match your search. Save a test to add it to your library.
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((s) => (
                                            <tr key={s.id} className="hover:bg-slate-800/40">
                                                <td className="px-4 py-3 font-medium text-white">
                                                    {s.sessionDetails.athleteName || '—'}
                                                </td>
                                                <td className="px-4 py-3 text-slate-300">{s.sessionDetails.testDate || '—'}</td>
                                                <td className="px-4 py-3 text-slate-300">{s.sessionDetails.boatClass}</td>
                                                <td className="px-4 py-3 font-mono text-xs text-slate-400">
                                                    {s.summary
                                                        ? `${s.summary.lt1Speed} → ${s.summary.lt2Speed}`
                                                        : '— (run calc after load)'}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-500">{formatSavedAt(s.savedAt)}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLoad(s)}
                                                            className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                                                        >
                                                            Load
                                                        </button>
                                                        {!viewerMode && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleteId(s.id)}
                                                                className="rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-950/40 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {deleteId && (
                <div
                    className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-session-title"
                >
                    <div className="w-full max-w-md rounded-2xl border border-slate-600 bg-slate-900 p-6 shadow-2xl">
                        <h3 id="delete-session-title" className="text-lg font-semibold text-white">
                            Remove this session?
                        </h3>
                        <p className="mt-2 text-sm text-slate-400">
                            This permanently deletes the saved test from your active library ({backendLabel}). This
                            cannot be undone.
                        </p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteId(null)}
                                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleConfirmDelete()}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
