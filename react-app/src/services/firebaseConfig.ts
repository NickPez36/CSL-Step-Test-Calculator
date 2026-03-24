import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

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

function getFirebaseApp(): FirebaseApp {
    if (app) return app;
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
    app = initializeApp(config);
    return app;
}

export function getFirebaseDb(): Firestore {
    if (db) return db;
    db = getFirestore(getFirebaseApp());
    return db;
}

export function getFirebaseAuth(): Auth {
    if (auth) return auth;
    auth = getAuth(getFirebaseApp());
    return auth;
}

/**
 * Defaults match project `firestore.rules`. Override with VITE_AUTH_* in .env.local
 * if you use different Firebase user emails (and update the rules to match).
 */
export const DEFAULT_AUTH_VIEWER_EMAIL = 'viewer@csl-step.local';
export const DEFAULT_AUTH_ADMIN_EMAIL = 'admin@csl-step.local';

export function getAuthViewerEmail(): string {
    const v = import.meta.env.VITE_AUTH_VIEWER_EMAIL;
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
    return DEFAULT_AUTH_VIEWER_EMAIL;
}

export function getAuthAdminEmail(): string {
    const a = import.meta.env.VITE_AUTH_ADMIN_EMAIL;
    if (typeof a === 'string' && a.trim().length > 0) return a.trim();
    return DEFAULT_AUTH_ADMIN_EMAIL;
}

