import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { isGithubBackendConfigured, readStoreFromGithub, writeStoreToGithub } from './githubStore.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, 'data', 'sessions.json');

async function readStore() {
    if (isGithubBackendConfigured()) {
        return readStoreFromGithub();
    }
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw);
}

async function writeStore(data) {
    if (isGithubBackendConfigured()) {
        await writeStoreToGithub(data, 'Update sessions.json (CSL Step Test Calculator)');
        return;
    }
    await fs.writeFile(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
    res.json({
        ok: true,
        service: 'csl-sessions-api',
        storage: isGithubBackendConfigured() ? 'github' : 'filesystem',
    });
});

app.get('/api/sessions', async (_req, res) => {
    try {
        const store = await readStore();
        if (!Array.isArray(store.sessions)) store.sessions = [];
        res.json(store);
    } catch (e) {
        res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
    }
});

app.post('/api/sessions', async (req, res) => {
    try {
        const { sessionDetails, tableType, inputData, summary } = req.body;
        if (!sessionDetails || typeof sessionDetails !== 'object') {
            return res.status(400).json({ error: 'sessionDetails is required' });
        }
        if (!tableType || !Array.isArray(inputData)) {
            return res.status(400).json({ error: 'tableType and inputData array are required' });
        }
        const store = await readStore();
        if (!Array.isArray(store.sessions)) store.sessions = [];

        const id = randomUUID();
        const savedAt = new Date().toISOString();
        const session = {
            id,
            savedAt,
            sessionDetails,
            tableType,
            inputData,
            summary: summary ?? null,
        };
        store.sessions.unshift(session);
        await writeStore(store);
        res.status(201).json({ session });
    } catch (e) {
        res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
    }
});

app.post('/api/sessions/merge', async (req, res) => {
    try {
        const incoming = req.body?.sessions;
        if (!Array.isArray(incoming)) {
            return res.status(400).json({ error: 'sessions array is required' });
        }
        const store = await readStore();
        if (!Array.isArray(store.sessions)) store.sessions = [];
        const byId = new Map(store.sessions.map((s) => [s.id, s]));
        for (const s of incoming) {
            if (!s || typeof s.id !== 'string' || !s.sessionDetails) continue;
            byId.set(s.id, {
                ...s,
                savedAt: typeof s.savedAt === 'string' ? s.savedAt : new Date().toISOString(),
            });
        }
        store.sessions = Array.from(byId.values()).sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
        await writeStore(store);
        res.json({ ok: true, count: store.sessions.length });
    } catch (e) {
        res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
    }
});

app.delete('/api/sessions/:id', async (req, res) => {
    try {
        const store = await readStore();
        if (!Array.isArray(store.sessions)) store.sessions = [];
        const before = store.sessions.length;
        store.sessions = store.sessions.filter((s) => s.id !== req.params.id);
        if (store.sessions.length === before) {
            return res.status(404).json({ error: 'Session not found' });
        }
        await writeStore(store);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
    }
});

const PORT = Number(process.env.PORT) || 8787;
app.listen(PORT, () => {
    console.log(`CSL sessions API listening on http://localhost:${PORT}`);
});
