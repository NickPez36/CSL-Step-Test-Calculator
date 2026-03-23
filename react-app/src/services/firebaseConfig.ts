import { initializeApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

let db: Firestore | null = null;

/**
 * True when all standard web app config keys from the Firebase console are present.
 * Set these as Vite env vars (VITE_FIREBASE_*) — they are safe to expose in the client bundle.
 */
export function isFirebaseConfigured(): boolean {
    const keys = [
        import.meta.env.VITE_FIREBASE_API_KEY,
        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        import.meta.env.VITE_FIREBASE_PROJECT_ID,
        import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        import.meta.env.VITE_FIREBASE_APP_ID,
    ] as const;
    return keys.every((k) => typeof k === 'string' && k.trim().length > 0);
}

export function getFirebaseDb(): Firestore {
    if (db) return db;
    if (!isFirebaseConfigured()) {
        throw new Error(
            'Firebase is not configured. Add VITE_FIREBASE_* variables from your Firebase project settings.'
        );
    }
    const config = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
    const firebaseApp = initializeApp(config);
    db = getFirestore(firebaseApp);
    return db;
}
