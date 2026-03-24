import type { CalculationResult, SavedSessionSummary, SavedTestSession, SessionDetails, StepData, TableType } from '../types';
import { isFirebaseConfigured } from './firebaseConfig';
import { getSessionAuthRole } from './sessionAuth';
import * as idb from './browserSessionStore';
import * as firestore from './firestoreSessionStore';

export type SessionBackend = 'firestore' | 'browser';

let cachedBackend: SessionBackend | null = null;

/**
 * Priority: Firestore (if VITE_FIREBASE_* set) → IndexedDB fallback.
 */
export async function detectBackend(): Promise<SessionBackend> {
    if (cachedBackend) return cachedBackend;
    if (isFirebaseConfigured()) {
        cachedBackend = 'firestore';
        return cachedBackend;
    }
    cachedBackend = 'browser';
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
        const role = getSessionAuthRole();
        if (role === 'viewer') {
            return firestore.firestoreListSessionsViewer();
        }
        return firestore.firestoreListSessionsAdmin();
    }
    return idb.idbListSessions();
}

/** One-time migration: build viewer mirrors from legacy admin-only documents. */
export async function runViewerMirrorMigrationIfNeeded(): Promise<void> {
    if (getSessionAuthRole() !== 'admin') return;
    const backend = await detectBackend();
    if (backend !== 'firestore') return;
    await firestore.migrateLegacySessionsToViewerMirrorIfNeeded();
}

export async function saveTestSession(payload: {
    id?: string | null;
    sessionDetails: SessionDetails;
    tableType: TableType;
    inputData: StepData[];
    summary: SavedSessionSummary | null;
}): Promise<SavedTestSession> {
    if (getSessionAuthRole() === 'viewer') {
        throw new Error('You do not have permission to save sessions.');
    }

    const backend = await detectBackend();
    const id = payload.id || crypto.randomUUID();
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
    await idb.idbPutSession(session);
    return session;
}

export async function deleteSavedSession(id: string): Promise<void> {
    if (getSessionAuthRole() === 'viewer') {
        throw new Error('You do not have permission to delete sessions.');
    }

    const backend = await detectBackend();
    if (backend === 'firestore') {
        await firestore.firestoreDeleteSession(id);
        return;
    }
    await idb.idbDeleteSession(id);
}

