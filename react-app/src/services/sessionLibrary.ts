import type { CalculationResult, SavedSessionSummary, SavedTestSession, SessionDetails, StepData, TableType } from '../types';
import * as idb from './browserSessionStore';
import * as api from './sessionsApi';

export type SessionBackend = 'api' | 'browser';

let cachedBackend: SessionBackend | null = null;

export async function detectBackend(): Promise<SessionBackend> {
    if (cachedBackend) return cachedBackend;
    const ok = await api.apiHealthCheck();
    cachedBackend = ok ? 'api' : 'browser';
    return cachedBackend;
}

export function invalidateBackendCache(): void {
    cachedBackend = null;
}

export function summaryFromCalculation(result: CalculationResult): SavedSessionSummary {
    return {
        lt1Speed: result.displayThresholds.lt1.speed,
        lt2Speed: result.displayThresholds.lt2.speed,
        lt1Hr: result.displayThresholds.lt1.hr,
        lt2Hr: result.displayThresholds.lt2.hr,
    };
}

export async function listSavedSessions(): Promise<SavedTestSession[]> {
    const backend = await detectBackend();
    if (backend === 'api') {
        const rows = await api.apiListSessions();
        return [...rows].sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
    }
    return idb.idbListSessions();
}

export async function saveTestSession(payload: {
    sessionDetails: SessionDetails;
    tableType: TableType;
    inputData: StepData[];
    summary: SavedSessionSummary | null;
}): Promise<SavedTestSession> {
    const backend = await detectBackend();
    if (backend === 'api') {
        return api.apiCreateSession(payload);
    }
    const id = crypto.randomUUID();
    const savedAt = new Date().toISOString();
    const session: SavedTestSession = {
        id,
        savedAt,
        sessionDetails: payload.sessionDetails,
        tableType: payload.tableType,
        inputData: payload.inputData,
        summary: payload.summary,
    };
    await idb.idbPutSession(session);
    return session;
}

export async function deleteSavedSession(id: string): Promise<void> {
    const backend = await detectBackend();
    if (backend === 'api') {
        await api.apiDeleteSession(id);
        return;
    }
    await idb.idbDeleteSession(id);
}

export async function fetchDemoSessionsFile(url: string): Promise<SavedTestSession[]> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not load demo file (${res.status})`);
    const data = (await res.json()) as { sessions?: SavedTestSession[] };
    if (!Array.isArray(data.sessions)) throw new Error('Invalid demo sessions file');
    return data.sessions;
}

export async function importSessionsIntoBrowser(sessions: SavedTestSession[]): Promise<number> {
    return idb.idbImportSessions(sessions);
}

/** Load bundled `demo-sessions.json` into the active backend (merge by session id). */
export async function importDemoSessions(demoFileUrl: string): Promise<{ count: number }> {
    const sessions = await fetchDemoSessionsFile(demoFileUrl);
    const backend = await detectBackend();
    if (backend === 'api') {
        await api.apiMergeSessions(sessions);
        return { count: sessions.length };
    }
    const n = await idb.idbImportSessions(sessions);
    return { count: n };
}
