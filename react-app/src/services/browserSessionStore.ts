import type { SavedTestSession } from '../types';

const DB_NAME = 'csl-step-test-calculator';
const STORE = 'saved_sessions';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE, { keyPath: 'id' });
            }
        };
    });
}

export async function idbListSessions(): Promise<SavedTestSession[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const os = tx.objectStore(STORE);
        const req = os.getAll();
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
            const rows = (req.result as SavedTestSession[]) ?? [];
            rows.sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
            resolve(rows);
        };
    });
}

export async function idbPutSession(session: SavedTestSession): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.objectStore(STORE).put(session);
    });
}

export async function idbDeleteSession(id: string): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.objectStore(STORE).delete(id);
    });
}

export async function idbImportSessions(sessions: SavedTestSession[]): Promise<number> {
    const db = await openDb();
    let count = 0;
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        const os = tx.objectStore(STORE);
        for (const s of sessions) {
            os.put(s);
            count += 1;
        }
    });
    return count;
}
