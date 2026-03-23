/**
 * Read/write sessions.json via GitHub Contents API (repo file stays the source of truth).
 * Requires GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO. Optional: GITHUB_BRANCH, GITHUB_SESSIONS_PATH.
 * The token must NEVER be shipped to the browser or committed to git.
 */

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const PATH = process.env.GITHUB_SESSIONS_PATH || 'server/data/sessions.json';
const TOKEN = process.env.GITHUB_TOKEN;
const BRANCH = process.env.GITHUB_BRANCH || 'main';

const headers = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
};

function apiUrl() {
    const path = PATH.split('/').map(encodeURIComponent).join('/');
    return `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
}

/** @returns {{ sha: string, parsed: object } | null} null if file missing */
async function fetchFileMeta() {
    const url = `${apiUrl()}?ref=${encodeURIComponent(BRANCH)}`;
    const res = await fetch(url, { headers });
    if (res.status === 404) return null;
    if (!res.ok) {
        const t = await res.text();
        throw new Error(`GitHub GET ${PATH}: ${res.status} ${t}`);
    }
    const data = await res.json();
    if (!data.content || !data.sha) {
        throw new Error('GitHub response missing content or sha');
    }
    const text = Buffer.from(data.content, 'base64').toString('utf8');
    const parsed = JSON.parse(text);
    return { sha: data.sha, parsed };
}

export function isGithubBackendConfigured() {
    return Boolean(TOKEN && OWNER && REPO);
}

export async function readStoreFromGithub() {
    const meta = await fetchFileMeta();
    if (!meta) {
        return { version: 1, sessions: [] };
    }
    const store = meta.parsed;
    if (!Array.isArray(store.sessions)) store.sessions = [];
    return store;
}

/**
 * Writes full store JSON; retries on concurrent update (409/422 sha mismatch).
 */
export async function writeStoreToGithub(store, commitMessage = 'Update sessions.json') {
    const bodyJson = `${JSON.stringify(store, null, 2)}\n`;
    const content = Buffer.from(bodyJson, 'utf8').toString('base64');

    for (let attempt = 0; attempt < 6; attempt += 1) {
        const meta = await fetchFileMeta();
        const payload = {
            message: commitMessage,
            content,
            branch: BRANCH,
        };
        if (meta?.sha) {
            payload.sha = meta.sha;
        }

        const res = await fetch(apiUrl(), {
            method: 'PUT',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            return;
        }

        const errText = await res.text();
        if (res.status === 409 || res.status === 422) {
            await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
            continue;
        }
        throw new Error(`GitHub PUT ${PATH}: ${res.status} ${errText}`);
    }
    throw new Error('GitHub PUT failed after retries (concurrent updates).');
}
