import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { getAuthAdminEmail, getAuthViewerEmail, getFirebaseAuth, isFirebaseConfigured } from '../services/firebaseConfig';
import { resolveRoleFromUser, setSessionAuthRole, type AppAuthRole } from '../services/sessionAuth';
import { AuthContext, type AuthContextValue } from './authContextBase';

/** Maps login field to Firebase email. Accepts short names or the full configured emails. */
function usernameToEmail(username: string): string {
    const u = username.trim().toLowerCase();
    const viewer = getAuthViewerEmail().toLowerCase();
    const admin = getAuthAdminEmail().toLowerCase();
    if (u === 'viewer' || u === viewer) return getAuthViewerEmail();
    if (u === 'admin' || u === admin) return getAuthAdminEmail();
    throw new Error('Use username "viewer" or "admin", or the full email for that account.');
}

function initialLoading(): boolean {
    return isFirebaseConfigured();
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<AppAuthRole | null>(null);
    const [loading, setLoading] = useState(initialLoading);

    useEffect(() => {
        if (!isFirebaseConfigured()) {
            return;
        }

        const auth = getFirebaseAuth();
        const unsub = onAuthStateChanged(auth, (nextUser) => {
            setUser(nextUser);
            if (!nextUser) {
                setSessionAuthRole(null);
                setRole(null);
            } else {
                const r = resolveRoleFromUser(nextUser);
                setSessionAuthRole(r);
                setRole(r);
                if (r === null) {
                    void signOut(auth);
                }
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const signInUsernamePassword = useCallback(async (username: string, password: string) => {
        const email = usernameToEmail(username);
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    }, []);

    const signOutApp = useCallback(async () => {
        await signOut(getFirebaseAuth());
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            role,
            loading,
            signInUsernamePassword,
            signOutApp,
        }),
        [user, role, loading, signInUsernamePassword, signOutApp]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
