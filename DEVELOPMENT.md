# CSL Step Test Calculator — development notes

## Which version is maintained?

**The maintained product is the React + Vite app in [`react-app/`](react-app/).**

You can recognize it by the **Athlete & Session Details** form including **Temperature** and **Wind speed** text fields ([`SessionDetails.tsx`](react-app/src/components/SessionDetails.tsx)). Those fields are part of the current session model and PDF/report metadata; they are **not** present in the standalone [`index.html`](index.html).

| | Maintained | Legacy |
|---|------------|--------|
| Location | [`react-app/`](react-app/) | [`index.html`](index.html) at repo root |
| Session fields | Full, including Temperature and Wind speed | Older subset (no temp/wind) |
| How to run | `cd react-app && npm install && npm run dev` | Open `index.html` in a browser (no build) |

**Policy:** All new features, bug fixes, and formula changes should be implemented in **`react-app`** first. [`react-app/src/services/calculations.ts`](react-app/src/services/calculations.ts) remains the reference for threshold math unless code is reorganized.

The standalone `index.html` is **not** kept in automatic parity. It remains as an optional zero-build snapshot; update it only if you deliberately need an offline single-file copy aligned with React.

---

## Parity reference (if you ever update `index.html` deliberately)

Use this when porting or comparing stacks.

### Session and metadata

| Item | `react-app` | `index.html` |
|------|-------------|--------------|
| Athlete name, date, boat class, protocol, comments | [`SessionDetails.tsx`](react-app/src/components/SessionDetails.tsx) | Form fields in page header |
| **Temperature** | Yes | No |
| **Wind speed** | Yes | No |

### Data table

| Item | Notes |
|------|--------|
| Protocol types HR / Speed / Stroke rate | Both support; headers via `TABLE_CONFIGS` in React ([`types/index.ts`](react-app/src/types/index.ts)), `tableConfigs` in vanilla |
| Row add/remove, paste from spreadsheet | Both |
| Changing protocol type resets rows | React: [`App.tsx`](react-app/src/App.tsx) |

### Calculations

| Item | Notes |
|------|--------|
| `parseTableData` + `calculateThresholds` | React: [`calculations.ts`](react-app/src/services/calculations.ts). Vanilla: inline script in `index.html` |

### UI / UX

| Item | `react-app` | `index.html` |
|------|-------------|--------------|
| Charts and results visibility | After successful calculate ([`App.tsx`](react-app/src/App.tsx)) | Chart canvases always in DOM; `#results` hidden until calculate |
| PDF | **Export PDF** ([`PDFDocument.tsx`](react-app/src/components/PDFDocument.tsx)) | **Preview & Export PDF** via **html2pdf.js** |

### PDF pipeline

| | `react-app` | `index.html` |
|---|-------------|--------------|
| Library | `@react-pdf/renderer` | **html2pdf.js** |
| Charts in PDF | PNGs from [`Charts.tsx`](react-app/src/components/Charts.tsx) `getChartImages()` | Print charts + html2canvas path |

---

## Test session library (save / load)

The React app includes a **Test session library** panel ([`SessionLibraryPanel.tsx`](react-app/src/components/SessionLibraryPanel.tsx)):

- **Save** stores athlete metadata, protocol type, table rows, and (when available) LT summary from the last calculation.
- **Load** restores a session and **re-runs** threshold calculations.
- **Delete** removes a record (with confirmation). **Search** filters by athlete, date, class, protocol, and notes.
- **Load sample athletes** merges the bundled reference file [`react-app/public/demo-sessions.json`](react-app/public/demo-sessions.json) (Jordan Blake, Sam Rivers) — works on **GitHub Pages** (IndexedDB) or with the **local API** (see below).

**Local API + GitHub Actions**

- A tiny **Express** service in [`server/index.mjs`](server/index.mjs) persists to [`server/data/sessions.json`](server/data/sessions.json) and exposes `GET/POST/DELETE` under `/api/sessions`, plus `POST /api/sessions/merge` for idempotent imports.
- From the **repository root**: `npm install` then `npm run dev:all` — runs the API on port **8787** and the Vite dev server with **`/api` proxied** to it ([`react-app/vite.config.ts`](react-app/vite.config.ts)).
- The existing **Deploy React App to GitHub Pages** workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) continues to ship **only the static** `react-app` build; the API is **not** hosted on Pages. Deploy the server separately (e.g. Railway, Fly.io) if you need the API in production, and set `VITE_SESSIONS_API_BASE` for that origin.

**GitHub-backed `server/data/sessions.json` (shared worldwide)**

The API can persist directly to the file in this repository using the [GitHub Contents API](https://docs.github.com/en/rest/repos/contents), so everyone using the **hosted API** reads the same data and commits appear on `main` for `server/data/sessions.json`.

- **Never** put a Personal Access Token (PAT) in the React app, in git, or in client-side code. Anyone could steal it. If a token was pasted into chat, a ticket, or a public repo, **revoke it immediately** in GitHub and create a new one.
- Configure the token **only** as a server environment variable on the machine that runs [`server/index.mjs`](server/index.mjs) (e.g. `GITHUB_TOKEN`). See [`.env.example`](.env.example) for local development (`GITHUB_OWNER`, `GITHUB_REPO`, optional `GITHUB_BRANCH`, `GITHUB_SESSIONS_PATH`).
- Use a **fine-grained PAT** limited to this repository with **Contents: Read and write** (or classic `repo` scope for private repos).
- `GET /api/health` returns `"storage": "github"` when GitHub mode is active, or `"filesystem"` when using the local `server/data/sessions.json` file only.
- After deploying the API, build the static app with `VITE_SESSIONS_API_BASE` pointing at that API’s public URL so GitHub Pages (or any host) loads/saves through the server, not only IndexedDB.

**CI:** [`.github/workflows/validate-sessions.yml`](.github/workflows/validate-sessions.yml) checks that both seed JSON files parse and contain a `sessions` array.

## Related files (quick map)

- React app entry: [`react-app/src/main.tsx`](react-app/src/main.tsx), [`react-app/src/App.tsx`](react-app/src/App.tsx)
- Types and table configs: [`react-app/src/types/index.ts`](react-app/src/types/index.ts)
- Vanilla snapshot: [`index.html`](index.html)
