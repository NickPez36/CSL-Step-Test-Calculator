import {
    collection,
    doc,
    getDocs,
    runTransaction,
    writeBatch,
    type DocumentData,
    type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebaseConfig';
import type { SavedTestSession } from '../types';

/** Full session data (admin only in rules). */
export const SESSIONS_COLLECTION = 'saved_test_sessions';

/** Redacted copies for viewer role (no real athlete names in Firestore). */
export const SESSIONS_VIEWER_COLLECTION = 'saved_test_sessions_viewer';

export const ATHLETE_REGISTRY_COLLECTION = 'athlete_registry';
export const META_COLLECTION = 'meta';
export const ATHLETE_COUNTER_DOC = 'athlete_counter';

export function normalizeAthleteKey(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildViewerSession(session: SavedTestSession, displayIndex: number): SavedTestSession {
    return {
        ...session,
        sessionDetails: {
            ...session.sessionDetails,
            athleteName: `Athlete ${displayIndex}`,
        },
    };
}

function parseSessionDoc(d: QueryDocumentSnapshot<DocumentData>): SavedTestSession | null {
    const data = d.data() as Partial<SavedTestSession>;
    if (data.sessionDetails && data.inputData && data.tableType && data.savedAt) {
        return {
            id: data.id ?? d.id,
            savedAt: data.savedAt,
            sessionDetails: data.sessionDetails,
            tableType: data.tableType,
            inputData: data.inputData,
            summary: data.summary ?? null,
        };
    }
    return null;
}

export async function firestoreListSessionsAdmin(): Promise<SavedTestSession[]> {
    const db = getFirebaseDb();
    const snap = await getDocs(collection(db, SESSIONS_COLLECTION));
    const rows: SavedTestSession[] = [];
    snap.forEach((d) => {
        const s = parseSessionDoc(d);
        if (s) rows.push(s);
    });
    rows.sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
    return rows;
}

export async function firestoreListSessionsViewer(): Promise<SavedTestSession[]> {
    const db = getFirebaseDb();
    const snap = await getDocs(collection(db, SESSIONS_VIEWER_COLLECTION));
    const rows: SavedTestSession[] = [];
    snap.forEach((d) => {
        const s = parseSessionDoc(d);
        if (s) rows.push(s);
    });
    rows.sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
    return rows;
}

/**
 * Admin save: full session + registry + viewer mirror in one transaction.
 */
export async function firestoreSaveSession(session: SavedTestSession): Promise<void> {
    const db = getFirebaseDb();
    const key = normalizeAthleteKey(session.sessionDetails.athleteName);
    if (!key) {
        throw new Error('Athlete name is required to save.');
    }

    await runTransaction(db, async (transaction) => {
        const regRef = doc(db, ATHLETE_REGISTRY_COLLECTION, key);
        const regSnap = await transaction.get(regRef);
        let displayIndex: number;
        if (regSnap.exists()) {
            displayIndex = (regSnap.data() as { displayIndex: number }).displayIndex;
        } else {
            const counterRef = doc(db, META_COLLECTION, ATHLETE_COUNTER_DOC);
            const cSnap = await transaction.get(counterRef);
            const next = cSnap.exists() ? ((cSnap.data() as { next?: number }).next ?? 1) : 1;
            displayIndex = next;
            transaction.set(regRef, { displayIndex });
            transaction.set(counterRef, { next: next + 1 }, { merge: true });
        }

        const viewerSession = buildViewerSession(session, displayIndex);
        transaction.set(doc(db, SESSIONS_COLLECTION, session.id), session);
        transaction.set(doc(db, SESSIONS_VIEWER_COLLECTION, session.id), viewerSession);
    });
}

/**
 * Ensures viewer mirror + registry for an existing admin doc (migration / repair).
 */
export async function syncViewerMirrorFromAdminSession(session: SavedTestSession): Promise<void> {
    const db = getFirebaseDb();
    const key = normalizeAthleteKey(session.sessionDetails.athleteName);
    if (!key) return;

    await runTransaction(db, async (transaction) => {
        const regRef = doc(db, ATHLETE_REGISTRY_COLLECTION, key);
        const regSnap = await transaction.get(regRef);
        let displayIndex: number;
        if (regSnap.exists()) {
            displayIndex = (regSnap.data() as { displayIndex: number }).displayIndex;
        } else {
            const counterRef = doc(db, META_COLLECTION, ATHLETE_COUNTER_DOC);
            const cSnap = await transaction.get(counterRef);
            const next = cSnap.exists() ? ((cSnap.data() as { next?: number }).next ?? 1) : 1;
            displayIndex = next;
            transaction.set(regRef, { displayIndex });
            transaction.set(counterRef, { next: next + 1 }, { merge: true });
        }

        const viewerSession = buildViewerSession(session, displayIndex);
        transaction.set(doc(db, SESSIONS_VIEWER_COLLECTION, session.id), viewerSession);
    });
}

const MIRROR_MIGRATE_KEY = 'csl_viewer_mirror_v1';

export async function migrateLegacySessionsToViewerMirrorIfNeeded(): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    if (localStorage.getItem(MIRROR_MIGRATE_KEY)) return;

    const adminSessions = await firestoreListSessionsAdmin();
    for (const s of adminSessions) {
        await syncViewerMirrorFromAdminSession(s);
    }
    localStorage.setItem(MIRROR_MIGRATE_KEY, '1');
}

export async function firestoreDeleteSession(id: string): Promise<void> {
    const db = getFirebaseDb();
    await runTransaction(db, async (transaction) => {
        transaction.delete(doc(db, SESSIONS_COLLECTION, id));
        transaction.delete(doc(db, SESSIONS_VIEWER_COLLECTION, id));
    });
}

/** Upsert many sessions (import / demo). Admin only. */
export async function firestoreMergeSessions(sessions: SavedTestSession[]): Promise<void> {
    const db = getFirebaseDb();
    const chunkSize = 400;
    for (let i = 0; i < sessions.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = sessions.slice(i, i + chunkSize);
        for (const s of chunk) {
            batch.set(doc(db, SESSIONS_COLLECTION, s.id), s);
        }
        await batch.commit();
    }
    for (const s of sessions) {
        await syncViewerMirrorFromAdminSession(s);
    }
}
