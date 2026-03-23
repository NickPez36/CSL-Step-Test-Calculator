import type { SavedTestSession, SessionsStoreFile, SessionDetails, StepData, TableType, SavedSessionSummary } from '../types';

function apiPrefix(): string {
    const base = import.meta.env.VITE_SESSIONS_API_BASE;
    if (typeof base === 'string' && base.length > 0) {
        return base.replace(/\/$/, '');
    }
    return '';
}

export async function apiHealthCheck(): Promise<boolean> {
    try {
        const res = await fetch(`${apiPrefix()}/api/health`, { method: 'GET' });
        return res.ok;
    } catch {
        return false;
    }
}

export async function apiListSessions(): Promise<SavedTestSession[]> {
    const res = await fetch(`${apiPrefix()}/api/sessions`);
    if (!res.ok) throw new Error(`Failed to load sessions (${res.status})`);
    const data = (await res.json()) as SessionsStoreFile;
    return Array.isArray(data.sessions) ? data.sessions : [];
}

export async function apiCreateSession(payload: {
    sessionDetails: SessionDetails;
    tableType: TableType;
    inputData: StepData[];
    summary: SavedSessionSummary | null;
}): Promise<SavedTestSession> {
    const res = await fetch(`${apiPrefix()}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `Save failed (${res.status})`);
    }
    const data = (await res.json()) as { session: SavedTestSession };
    return data.session;
}

export async function apiMergeSessions(sessions: SavedTestSession[]): Promise<void> {
    const res = await fetch(`${apiPrefix()}/api/sessions/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `Merge failed (${res.status})`);
    }
}

export async function apiDeleteSession(id: string): Promise<void> {
    const res = await fetch(`${apiPrefix()}/api/sessions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
    if (!res.ok && res.status !== 404) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `Delete failed (${res.status})`);
    }
}
