import { useState } from 'react';
import App from '../App';
import { isFirebaseConfigured } from '../services/firebaseConfig';
import { LoginPage } from './LoginPage';
import { useAuth } from './useAuth';

export function AuthGate() {
    const { user, loading, signInUsernamePassword } = useAuth();
    const [loginError, setLoginError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    if (!isFirebaseConfigured()) {
        return <App />;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-400">
                Loading…
            </div>
        );
    }

    if (!user) {
        const handleLogin = async (username: string, password: string) => {
            setLoginError(null);
            setSubmitting(true);
            try {
                await signInUsernamePassword(username, password);
            } catch (e) {
                const msg = e instanceof Error ? e.message : '';
                if (msg.includes('Use username')) {
                    setLoginError(msg);
                } else {
                    setLoginError('Invalid username or password.');
                }
            } finally {
                setSubmitting(false);
            }
        };

        return <LoginPage onSubmit={handleLogin} error={loginError} submitting={submitting} />;
    }

    return <App />;
}
