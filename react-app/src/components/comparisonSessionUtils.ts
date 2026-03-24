import type { SavedTestSession } from '../types';

export function normalizeAthleteKey(name: string): string {
    return name.trim().toLowerCase();
}

/** Unique athletes (non-empty names), sorted by display name. Key is normalized; display is first occurrence's trimmed string. */
export function buildAthleteOptions(sessions: SavedTestSession[]): { key: string; displayName: string }[] {
    const seen = new Map<string, string>();
    for (const s of sessions) {
        const raw = s.sessionDetails.athleteName?.trim() ?? '';
        if (!raw) continue;
        const key = normalizeAthleteKey(raw);
        if (!seen.has(key)) seen.set(key, raw);
    }
    return Array.from(seen.entries())
        .map(([key, displayName]) => ({ key, displayName }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }));
}

export function sessionsForAthlete(sessions: SavedTestSession[], athleteKey: string): SavedTestSession[] {
    if (!athleteKey) return [];
    return sessions.filter((s) => normalizeAthleteKey(s.sessionDetails.athleteName ?? '') === athleteKey);
}

export function sortSessionsForPicker(list: SavedTestSession[]): SavedTestSession[] {
    return [...list].sort((a, b) => {
        const da = a.sessionDetails.testDate?.trim() ?? '';
        const db = b.sessionDetails.testDate?.trim() ?? '';
        if (da !== db) return db.localeCompare(da);
        return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    });
}

export function formatSavedAtShort(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
        return iso;
    }
}

/**
 * Label for a session in the date dropdown. If multiple sessions for this athlete share the same testDate, append savedAt.
 */
export function sessionDateLabel(s: SavedTestSession, athleteSessions: SavedTestSession[]): string {
    const date = s.sessionDetails.testDate?.trim() || '—';
    const dup = athleteSessions.filter(
        (x) => (x.sessionDetails.testDate?.trim() ?? '') === (s.sessionDetails.testDate?.trim() ?? '')
    ).length;
    if (dup > 1) {
        return `${date} · saved ${formatSavedAtShort(s.savedAt)}`;
    }
    return date;
}
