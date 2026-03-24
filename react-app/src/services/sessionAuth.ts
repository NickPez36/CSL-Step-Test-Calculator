import type { User } from 'firebase/auth';
import { getAuthAdminEmail, getAuthViewerEmail, isFirebaseConfigured } from './firebaseConfig';

export type AppAuthRole = 'admin' | 'viewer';

let currentRole: AppAuthRole | null = null;

export function setSessionAuthRole(role: AppAuthRole | null): void {
    currentRole = role;
}

export function getSessionAuthRole(): AppAuthRole {
    if (!isFirebaseConfigured()) {
        return 'admin';
    }
    return currentRole ?? 'viewer';
}

export function resolveRoleFromUser(user: User | null): AppAuthRole | null {
    if (!user?.email) {
        return null;
    }
    const viewer = getAuthViewerEmail();
    const admin = getAuthAdminEmail();
    if (user.email === admin) return 'admin';
    if (user.email === viewer) return 'viewer';
    return null;
}
