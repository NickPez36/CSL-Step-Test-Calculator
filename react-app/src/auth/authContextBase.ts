import { createContext } from 'react';
import type { User } from 'firebase/auth';
import type { AppAuthRole } from '../services/sessionAuth';

export type AuthContextValue = {
    user: User | null;
    role: AppAuthRole | null;
    loading: boolean;
    signInUsernamePassword: (username: string, password: string) => Promise<void>;
    signOutApp: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
