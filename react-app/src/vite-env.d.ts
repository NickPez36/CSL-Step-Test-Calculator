/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Subpath for GitHub Pages; omit or `/` for Firebase Hosting at domain root */
    readonly VITE_BASE_PATH?: string;
    readonly VITE_SESSIONS_API_BASE?: string;
    readonly VITE_FIREBASE_API_KEY?: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
    readonly VITE_FIREBASE_PROJECT_ID?: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
    readonly VITE_FIREBASE_APP_ID?: string;
    /** Must match Firebase Auth user emails and firestore.rules (viewer account). */
    readonly VITE_AUTH_VIEWER_EMAIL?: string;
    /** Must match Firebase Auth user emails and firestore.rules (admin account). */
    readonly VITE_AUTH_ADMIN_EMAIL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
