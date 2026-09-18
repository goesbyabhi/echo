# Perf baseline — echo v0.0.0

Captured 2026-09-18 before the Phase 1 optimization pass. Every Phase 1 step is
measured against this file and the table updated.

## How to measure

- **Build/bundle:** `npm run build:stats` (emits `dist/stats.html` treemap) —
  or plain `npm run build`, which prints per-chunk sizes.
- **Runtime:** dev server + `opencode serve`, then a cold-load profile in a
  real Chromium-family browser (long tasks, DOM nodes, paint timings).

## Bundle baseline (production build, gzip)

| Chunk | Raw | gzip | Notes |
| --- | --- | --- | --- |
| `index` | 300.16 kB | 76.92 kB | contains the eagerly-imported markdown pipeline today |
| `highlight` | 154.86 kB | 52.92 kB | `highlight.js/lib/common` (37 langs) — **eager today** |
| `markdown` | 71.11 kB | 23.69 kB | `marked` + `dompurify` — **eager today** |
| `sdk` | 18.54 kB | 5.18 kB | `@opencode-ai/sdk/client` |
| `diff` | 9.57 kB | 3.57 kB | `diff` lib |
| `index` CSS | 48.44 kB | 9.55 kB | app.css (effects, dashboard, etc.) |
| `fonts` CSS | 3.30 kB | 0.65 kB | Geist variable declarations |

**Initial JS+CSS payload: ~172 kB gzip.** Of that, `markdown` + `highlight`
(~76.6 kB, 44% of JS) are the lazy-load target — they load even when the user
never looks at a message.

**Fonts (woff2, western locale):** latin 29.4 kB + latin-ext 16.5 kB + mono
latin 23.1 kB + mono latin-ext 14.7 kB + mono symbols 5.8 kB ≈ **~90 kB**
actually fetched. cyrillic/vietnamese subsets ship but are only downloaded when
needed. Monospace-style usage aside, the whole font set is eagerly referenced.

## Eager load graph (key finding)

On the **home screen** — zero messages, zero code blocks, zero diffs rendered —
the initial request still fetches every chunk:

```
index-Cqmym935.js   300 kB   canonical app
sdk-saBBHL3n.js      18 kB
markdown-….js        71 kB   marked + dompurify   ← never used on home
highlight-….js      155 kB   hljs/lib/common      ← never used on home
diff-….js            10 kB   diff lib             ← never used on home
```

~236 kB raw / ~80 kB gzip of the initial request graph is only needed once a
message becomes visible. This is the Phase 1 lazy-load target.

## Runtime baseline (production build, Helium, 1912×962)

First-ever load in a fresh profile (`vite preview`, cache-cold-ish):

| View | domReady | loadEnd | FCP | DOM nodes | Long tasks | total/longest |
| --- | --- | --- | --- | --- | --- | --- |
| home | 414 ms | 1194 ms | 248 ms | 116 | 2 | 327 ms / 245 ms |
| chat (25 msg restored) | 264 ms | 597 ms | 156 ms | 1507 | 4 | 380 ms / 149 ms |

Cache-warm reload (home): domReady 343 ms, loadEnd 419 ms, FCP 320 ms,
DOM 116, 1 long task @ 82 ms, JS heap 16 MB.

> Note: browser-control blocks cache clearing, so byte figures are from the
> build table above; runtime figures are load-ordering/timing evidence. Long
> tasks recorded only after navigation (observer installed pre-nav).

Figures to beat:

- **Home never downloads the markdown/highlight/diff chunks.**
- **Chat view** keeps DOM nodes ≈ current (1507 @ 25 messages) while streaming
  renders raw text (no per-token `marked`/`highlight` main-thread work).

---

## Phase 1 — measured after the lazy-load pass (same day)

### What changed

- **`markdown.ts` is now a lazy loader.** `renderMarkdown`/`highlightWithin`
  dynamically `import()` `markdown-engine.ts` (marked + dompurify +
  `highlight.js/core` with 11 registered languages + aliases) behind a cached
  module promise. `plainText`/`whenVisible` stayed engine-free.
- **`Markdown.svelte` streams cheaply**: while `streaming`, it renders raw
  pre-wrapped text; the final `renderMarkdown` runs once the message completes;
  mid-stream it debounces by 250 ms and discards stale renders. Rendering and
  highlighting only start once the element scrolls within 600 px.
- **The six right-panel tabs load on demand** (`#await import()` per tab), which
  dragged `diff` off the eager graph and out of `index`.
- **`highlight.js/common` (37 langs) → `core` + 11 langs**, still lazy.
- Icon map pruned 50 → 40 Phosphor icons; added the previously silent-fallback
  `code` icon; memory caps (500 msgs/session, 200 orphan-parts) in chat store;
  `updateTheme` debounces `applyTheme` 60 ms so slider drags don't re-run
  `analyzeImage` per tick.

### Bundle after (gzip)

| Chunk | raw | gzip | status |
| --- | --- | --- | --- |
| `index` | 68.06 kB | 20.84 kB | eager — was 300.16 / 76.92 |
| `Icon` | 178.17 kB | 44.63 kB | eager, now cacheable independently |
| `sdk` | 18.54 kB | 5.18 kB | eager |
| `connection` / `ui` | 6.38 kB | 2.58 kB | eager |
| `index` CSS | 37.34 kB | 7.88 kB | eager |
| `fonts` CSS | 3.30 kB | 0.65 kB | eager |
| `markdown` | 71.11 kB | 23.69 kB | **lazy** (was eager) |
| `highlight` | 69.76 kB | 23.68 kB | **lazy**, core only (was 154.86 eager) |
| `diff` + `DiffBlock` | 12.26 kB | 4.79 kB | **lazy** (was eager) |
| 6 × tab chunks | ~27 kB | ~10.8 kB | **lazy** |

**Initial JS+CSS payload: ~172 kB → ~82 kB gzip.** Fonts untouched: the
`@fontsource` CSS uses `unicode-range`, so cyrillic/vietnamese woff2s already
never download for latin text; nothing to trim there.

Home-screen request graph is now exactly:

```
index                    index…js       21 kB
Icon (Phosphor map)      Icon-….js      45 kB
sdk + connection + ui    …js            9 kB
```

`markdown`, `highlight`, `diff`, and every tab are **not fetched** until a
message is visible or a panel opens.

### Runtime after (production build, Helium, cold port)

| View | domReady | FCP | DOM nodes | Long tasks | TBT | JS transferred |
| --- | --- | --- | --- | --- | --- | --- |
| home | 552 ms | 528 ms | 188 | 0 | 0 ms | 74 kB (was 172) |
| chat (seeded) | 309 ms | 492 ms | 1710 | 0 | 0 ms | — |

Wins are structural: transfer halved, main-thread jank eliminated (home was
2 × 327 ms of long tasks; chat was 4 × 380 ms). Paint timings on a cold port
run noisy; the 4173 warm reload is the stable comparative.

### Deferred (measured, not worth it)

- **Font subsetting**: already lazy via `unicode-range`; no runtime cost.
- **Shrinking `Icon` further**: the remaining 40 icons are all in active use.

---

## Phase 1.5 — wallpaper feature (welcome + bundled presets)

The wallpaper system is the launch wedge, so the home screen now showcases it:

- **`src/lib/wallpapers.ts`** — 8 curated full-theme presets (Midnight/Orbit/
  Contour image wallpapers, Ember aurora, Graphite/Slate mesh, Nebula gradient,
  Obsidian solid), replacing the old color-swatch-only presets.
- **Two new bundled SVGs** (`public/wallpaper-orbit.svg`, `wallpaper-contour.svg`,
  ~2.5–3 kB each, pure vector, same dark-geometric family as the existing
  `wallpaper.svg`).
- **`WallpaperPicker.svelte`** — reusable gallery whose previews reuse the real
  `[data-bg]` artwork by nesting `.app-bg` with preset CSS vars, so previews are
  pixel-accurate to what you get. Active state = match on all patch fields.
- **Welcome screen** shows the strip below the composer with a drop-hint;
  **Settings** swaps the old swatches for the same picker. `data-view='home'`
  effects still apply, so the gallery sits on the full artwork.

Home screen after: 229 DOM nodes (was 188 — the 8 preview cards), 0 long tasks,
0 lazy chunks; ~9 kB of small SVGs are the only new bytes. No regression:
domReady 253 ms in-session.

Capture: `wallpaper-section` + modal picker + apply/persist/active — verified in
Helium with zero console errors; screenshots at
`…\AppData\Local\Temp\opencode\phase1.5-welcome.png`.