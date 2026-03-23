import { collection, deleteDoc, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { getFirebaseDb } from './firebaseConfig';
import type { SavedTestSession } from '../types';

/** Collection name in Firestore (one document per saved test session). */
export const SESSIONS_COLLECTION = 'saved_test_sessions';

export async function firestoreListSessions(): Promise<SavedTestSession[]> {
    const db = getFirebaseDb();
    const snap = await getDocs(collection(db, SESSIONS_COLLECTION));
    const rows: SavedTestSession[] = [];
    snap.forEach((d) => {
        const data = d.data() as Partial<SavedTestSession>;
        if (data.sessionDetails && data.inputData && data.tableType && data.savedAt) {
            rows.push({
                id: data.id ?? d.id,
                savedAt: data.savedAt,
                sessionDetails: data.sessionDetails,
                tableType: data.tableType,
                inputData: data.inputData,
                summary: data.summary ?? null,
            });
        }
    });
    rows.sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
    return rows;
}

export async function firestoreSaveSession(session: SavedTestSession): Promise<void> {
    const db = getFirebaseDb();
    await setDoc(doc(db, SESSIONS_COLLECTION, session.id), session);
}

export async function firestoreDeleteSession(id: string): Promise<void> {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, SESSIONS_COLLECTION, id));
}

/** Upsert many sessions (import / demo). Chunks batches to stay under Firestore limits. */
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
}
