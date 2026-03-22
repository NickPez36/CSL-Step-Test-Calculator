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

## Related files (quick map)

- React app entry: [`react-app/src/main.tsx`](react-app/src/main.tsx), [`react-app/src/App.tsx`](react-app/src/App.tsx)
- Types and table configs: [`react-app/src/types/index.ts`](react-app/src/types/index.ts)
- Vanilla snapshot: [`index.html`](index.html)
