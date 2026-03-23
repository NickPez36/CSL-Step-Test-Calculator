import type { CalculationResult, SavedSessionSummary, SavedTestSession, SessionDetails, StepData, TableType } from '../types';
import { isFirebaseConfigured } from './firebaseConfig';
import * as idb from './browserSessionStore';
import * as api from './sessionsApi';
import * as firestore from './firestoreSessionStore';

export type SessionBackend = 'firestore' | 'api' | 'browser';

let cachedBackend: SessionBackend | null = null;

/**
 * Priority: Firestore (if VITE_FIREBASE_* set) → sessions API (if reachable) → IndexedDB.
 */
export async function detectBackend(): Promise<SessionBackend> {
    if (cachedBackend) return cachedBackend;
    if (isFirebaseConfigured()) {
        cachedBackend = 'firestore';
        return cachedBackend;
    }
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
    if (backend === 'firestore') {
        return firestore.firestoreListSessions();
    }
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

    if (backend === 'firestore') {
        await firestore.firestoreSaveSession(session);
        return session;
    }
    if (backend === 'api') {
        return api.apiCreateSession(payload);
    }
    await idb.idbPutSession(session);
    return session;
}

export async function deleteSavedSession(id: string): Promise<void> {
    const backend = await detectBackend();
    if (backend === 'firestore') {
        await firestore.firestoreDeleteSession(id);
        return;
    }
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

/** Merge imported JSON sessions into the active backend. */
export async function mergeImportedSessions(sessions: SavedTestSession[]): Promise<void> {
    const backend = await detectBackend();
    if (backend === 'firestore') {
        await firestore.firestoreMergeSessions(sessions);
        return;
    }
    if (backend === 'api') {
        await api.apiMergeSessions(sessions);
        return;
    }
    await idb.idbImportSessions(sessions);
}

/** Load bundled `demo-sessions.json` into the active backend (merge by session id). */
export async function importDemoSessions(demoFileUrl: string): Promise<{ count: number }> {
    const sessions = await fetchDemoSessionsFile(demoFileUrl);
    const backend = await detectBackend();
    if (backend === 'firestore') {
        await firestore.firestoreMergeSessions(sessions);
        return { count: sessions.length };
    }
    if (backend === 'api') {
        await api.apiMergeSessions(sessions);
        return { count: sessions.length };
    }
    const n = await idb.idbImportSessions(sessions);
    return { count: n };
}
