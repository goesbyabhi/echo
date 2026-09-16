# AGENTS.md

## Project

**echo** — a standalone Svelte 5 + Vite SPA that is a **client for a running
opencode server** (`opencode serve`, HTTP API via `@opencode-ai/sdk`). No backend
or server code lives in this repo — it talks to an opencode instance at
`http://127.0.0.1:4096` by default (configurable at runtime in the settings
modal). This is not the opencode TUI and not the official web app.

## Commands

- `npm run dev` — Vite dev server with HMR.
- `npm run build` — production build to `dist/`.
- `npm run preview` — serve the built `dist/`.
- `npm run check` — `svelte-check` + `tsc -p tsconfig.node.json`. **The only
  verification step; run it after changes.** There are no tests, no linter, no
  formatter, and no CI.

## Architecture

- `src/lib/api.ts` — builds the SDK client, basic-auth fetch wrapper, and the
  `/global/health` probe. The client is created from `connection.settings`.
- `src/lib/stores/*.svelte.ts` — **Svelte 5 rune-based singleton stores**: plain
  classes using `$state`/`$derived`, instantiated once and exported
  (`connection`, `chat`, `sessions`, `models`, `status`, `permissions`,
  `files`, `ui`). This is NOT the Svelte 4 `writable`/`readable` store API — do
  not add `.subscribe()` code.
- `src/lib/events.ts` — `handleEvent` is the single SSE reducer. Add new server
  event handling here, not in components.
- `src/App.svelte` — owns startup: health probe → `startEventStream` → loads
  models/sessions/status, plus a 15s status refresh interval.
- `src/lib/components/*.svelte` — presentational; components read/write stores
  directly instead of passing deep prop trees.

## Theming / background

Backgrounds are driven entirely by `ui.svelte.ts` `applyTheme()`, which writes
CSS custom properties (`--bg-1`, `--accent`, `--panel-opacity`, …) and a
`data-bg` attribute onto `document.documentElement`. The actual layer styles are
the `[data-bg='…']` rules in `src/app.css`. To add a background kind: extend
`BackgroundKind` + `defaultTheme`, set the vars/`data-bg` in `applyTheme()`, add
the `[data-bg]` rule in `app.css`, and expose it in `SettingsModal.svelte`.

## Conventions and gotchas

- Svelte 5 runes only (`$state`, `$derived`, `$effect`); legacy lifecycle/store
  APIs are not used.
- SDK imports use the subpath `@opencode-ai/sdk/client`; types (`Message`,
  `Part`, `Event`, `Agent`, …) come from there.
- SDK calls return `{ data, error }` — check `result.error` instead of relying
  on thrown exceptions (`chat.svelte.ts` is the reference).
- Settings/state persist to `localStorage` under `opencode-ui:settings`,
  `opencode-ui:theme:v7`, `opencode-ui:model`, `opencode-ui:agent`. No env vars.
  The `opencode-ui:` prefix is **legacy** (pre-rebrand) and must stay — changing
  it would wipe users' stored wallpaper/theme.
- Type is Geist, bundled via `@fontsource-variable/geist(-mono)` and imported in
  `src/main.ts`; the tokens are `--font` / `--mono` in `app.css`.
- Style: 2-space indent, single quotes, no semicolons.
- `README.md` documents the app for users; this file is the source of truth for
  how the code is wired.
- Commit at meaningful checkpoints; `npm run check` is the only gate that can fail.

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues in `goesbyabhi/echo`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles map to their default label strings (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
