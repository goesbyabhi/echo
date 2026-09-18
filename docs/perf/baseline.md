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