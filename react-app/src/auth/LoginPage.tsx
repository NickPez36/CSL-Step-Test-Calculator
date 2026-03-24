import { useState } from 'react';

type Props = {
    onSubmit: (username: string, password: string) => Promise<void>;
    error: string | null;
    submitting: boolean;
};

function EyeIcon({ open }: { open: boolean }) {
    if (open) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
            </svg>
        );
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" x2="22" y1="2" y2="22" />
        </svg>
    );
}

export function LoginPage({ onSubmit, error, submitting }: Props) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void onSubmit(username.trim(), password);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-600/60 bg-slate-900/90 shadow-xl p-8">
                <h1 className="text-xl font-semibold text-white text-center mb-1">
                    CSL Step Test Calculator
                </h1>
                <p className="text-sm text-slate-400 text-center mb-8">Sign in to continue</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="login-username" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                            Username or email
                        </label>
                        <input
                            id="login-username"
                            type="text"
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full rounded-lg border border-slate-600 bg-slate-950/50 px-3 py-2.5 text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            placeholder="admin or viewer (or full email)"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg border border-slate-600 bg-slate-950/50 py-2.5 pl-3 pr-11 text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-0 top-0 flex h-full items-center justify-center rounded-r-lg px-3 text-slate-400 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                <EyeIcon open={!showPassword} />
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-400" role="alert">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                    >
                        {submitting ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>
            </div>
        </div>
    );
}
