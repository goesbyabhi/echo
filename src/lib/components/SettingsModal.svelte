<script lang="ts">
  import { connection } from '../stores/connection.svelte'
  import { ui, type BackgroundKind } from '../stores/ui.svelte'
  import Icon from './Icon.svelte'

  let baseUrl = $state(connection.settings.baseUrl)
  let username = $state(connection.settings.username)
  let password = $state(connection.settings.password)
  let directory = $state(connection.settings.directory)
  let testing = $state(false)

  const kinds: { id: BackgroundKind; label: string }[] = [
    { id: 'aurora', label: 'Aurora' },
    { id: 'mesh', label: 'Mesh' },
    { id: 'gradient', label: 'Gradient' },
    { id: 'solid', label: 'Solid' },
    { id: 'image', label: 'Image' },
  ]

  const presets: { label: string; color1: string; color2: string; color3: string; accent: string }[] = [
    { label: 'Graphite', color1: '#0a0a0b', color2: '#101012', color3: '#17171b', accent: '#3b82f6' },
    { label: 'Slate', color1: '#0b0f14', color2: '#111820', color3: '#1a222c', accent: '#58a6ff' },
    { label: 'Plum', color1: '#120a16', color2: '#1c1024', color3: '#291636', accent: '#a78bfa' },
    { label: 'Forest', color1: '#0a120e', color2: '#101c16', color3: '#16281f', accent: '#4ade80' },
    { label: 'Ember', color1: '#140d0a', color2: '#20130d', color3: '#2e1b12', accent: '#f59e0b' },
  ]

  $effect(() => {
    if (!ui.settingsOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function saveConnection(): void {
    connection.update({ baseUrl, username, password, directory })
  }

  async function test(): Promise<void> {
    saveConnection()
    testing = true
    await connection.refresh()
    testing = false
    ui.toast(
      connection.status === 'online' ? 'Connected to opencode server' : connection.error || 'Connection failed',
      connection.status === 'online' ? 'success' : 'error',
    )
  }

  function close(): void {
    saveConnection()
    ui.settingsOpen = false
  }
</script>

<div
  class="overlay"
  role="presentation"
  onclick={(event) => {
    if (event.target === event.currentTarget) close()
  }}
>
  <div class="modal panel">
    <header>
      <Icon name="settings" size={17} />
      <h2>Settings</h2>
      <span class="spacer"></span>
      <button class="ghost" onclick={close}><Icon name="x" size={16} /></button>
    </header>

    <div class="body">
      <section>
        <h3>Connection</h3>
        <div class="grid">
          <label class="field span2">
            <span>Server URL</span>
            <input bind:value={baseUrl} placeholder="http://127.0.0.1:4096" onchange={saveConnection} />
          </label>
          <label class="field">
            <span>Directory (optional)</span>
            <input bind:value={directory} placeholder="/path/to/project" onchange={saveConnection} />
          </label>
          <label class="field">
            <span>Username</span>
            <input bind:value={username} placeholder="opencode" onchange={saveConnection} />
          </label>
          <label class="field">
            <span>Password</span>
            <input type="password" bind:value={password} placeholder="server password" onchange={saveConnection} />
          </label>
        </div>

        <div class="hint-row">
          <span class="hint">
            Start the server with <code>opencode serve --port 4096 --cors {window.location.origin}</code>
          </span>
        </div>

        <div class="test-row">
          <button class="btn" onclick={test} disabled={testing}>
            {#if testing}<Icon name="loader" size={14} class="spin" />{/if}
            Test connection
          </button>
          {#if connection.status === 'online'}
            <span class="chip ok">online · v{connection.version}</span>
          {:else if connection.status === 'connecting'}
            <span class="chip warn">connecting…</span>
          {:else if connection.lastChecked > 0}
            <span class="chip err">{connection.error || 'offline'}</span>
          {/if}
        </div>
      </section>

      <section>
        <h3>Appearance</h3>

        <div class="field">
          <span>Background style</span>
          <div class="segmented">
            {#each kinds as kind (kind.id)}
              <button
                class:active={ui.theme.kind === kind.id}
                onclick={() => ui.updateTheme({ kind: kind.id })}
              >
                {kind.label}
              </button>
            {/each}
          </div>
        </div>

        <div class="field">
          <span>Presets</span>
          <div class="presets">
            {#each presets as preset (preset.label)}
              <button
                class="preset"
                title={preset.label}
                style="--p1:{preset.color1};--p2:{preset.color2};--p3:{preset.color3};--pa:{preset.accent}"
                onclick={() =>
                  ui.updateTheme({
                    color1: preset.color1,
                    color2: preset.color2,
                    color3: preset.color3,
                    accent: preset.accent,
                  })}
              >
                <span class="swatch"></span>
                {preset.label}
              </button>
            {/each}
          </div>
        </div>

        <div class="grid">
          <label class="field">
            <span>Base color</span>
            <input
              type="color"
              value={ui.theme.color1}
              oninput={(event) => ui.updateTheme({ color1: (event.currentTarget as HTMLInputElement).value })}
            />
          </label>
          <label class="field">
            <span>Accent color</span>
            <input
              type="color"
              value={ui.theme.accent}
              oninput={(event) => ui.updateTheme({ accent: (event.currentTarget as HTMLInputElement).value })}
            />
          </label>
          {#if ui.theme.kind === 'aurora' || ui.theme.kind === 'mesh' || ui.theme.kind === 'gradient'}
            <label class="field">
              <span>Color 2</span>
              <input
                type="color"
                value={ui.theme.color2}
                oninput={(event) => ui.updateTheme({ color2: (event.currentTarget as HTMLInputElement).value })}
              />
            </label>
            <label class="field">
              <span>Color 3</span>
              <input
                type="color"
                value={ui.theme.color3}
                oninput={(event) => ui.updateTheme({ color3: (event.currentTarget as HTMLInputElement).value })}
              />
            </label>
          {/if}
        </div>

        {#if ui.theme.kind === 'image'}
          <label class="field">
            <span>Image URL</span>
            <input
              placeholder="https://… or /wallpaper.jpg"
              value={ui.theme.imageUrl}
              oninput={(event) => ui.updateTheme({ imageUrl: (event.currentTarget as HTMLInputElement).value })}
            />
          </label>
          <label class="field">
            <span>Image blur — {ui.theme.blur}px</span>
            <input
              type="range"
              min="0"
              max="40"
              value={ui.theme.blur}
              oninput={(event) => ui.updateTheme({ blur: Number((event.currentTarget as HTMLInputElement).value) })}
            />
          </label>
        {/if}

        <label class="field">
          <span>Background dim — {Math.round(ui.theme.dim * 100)}%</span>
          <input
            type="range"
            min="0"
            max="0.9"
            step="0.05"
            value={ui.theme.dim}
            oninput={(event) => ui.updateTheme({ dim: Number((event.currentTarget as HTMLInputElement).value) })}
          />
        </label>

        <label class="field">
          <span>Panel opacity — {Math.round(ui.theme.panelOpacity * 100)}%</span>
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.02"
            value={ui.theme.panelOpacity}
            oninput={(event) =>
              ui.updateTheme({ panelOpacity: Number((event.currentTarget as HTMLInputElement).value) })}
          />
        </label>
      </section>
    </div>

    <footer>
      <button class="btn" onclick={() => ui.updateTheme({
        kind: 'aurora',
        color1: '#0b1026',
        color2: '#131a3a',
        color3: '#2a1a4a',
        accent: '#7c8cff',
        blur: 0,
        dim: 0.35,
        panelOpacity: 0.72,
        imageUrl: '',
      })}>
        Reset appearance
      </button>
      <span class="spacer"></span>
      <button class="btn primary" onclick={close}>Done</button>
    </footer>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgb(17 17 17 / 0.28);
  }
  .modal {
    width: min(680px, 100%);
    max-height: min(86vh, 900px);
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-lg);
  }
  header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 18px;
    border-bottom: 1px solid var(--border);
    color: var(--accent);
  }
  header h2 {
    margin: 0;
    font-size: 0.98rem;
    color: var(--text);
  }
  .spacer {
    flex: 1;
  }
  .body {
    overflow-y: auto;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  h3 {
    margin: 0;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.11em;
    color: var(--text-faint);
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .span2 {
    grid-column: 1 / -1;
  }
  .hint-row {
    font-size: 0.75rem;
    color: var(--text-faint);
  }
  code {
    font-family: var(--mono);
    background: var(--hover-strong);
    padding: 1px 5px;
    border-radius: 5px;
  }
  .test-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .segmented {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .segmented button {
    flex: 1;
    min-width: 78px;
    height: 32px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text-muted);
    font-size: 0.8rem;
  }
  .segmented button:hover {
    background: var(--hover-strong);
    color: var(--text);
  }
  .segmented button.active {
    border-color: color-mix(in srgb, var(--accent) 50%, transparent);
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    color: var(--text);
  }
  .presets {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .preset {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 5px 10px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    font-size: 0.78rem;
    color: var(--text-muted);
  }
  .preset:hover {
    color: var(--text);
    border-color: var(--border-strong);
  }
  .swatch {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--p1), var(--p2) 55%, var(--p3));
    box-shadow: inset 0 0 0 1px var(--border-strong), 0 0 0 2px var(--pa);
  }
  input[type='range'] {
    width: 100%;
    accent-color: var(--accent);
  }
  input[type='color'] {
    height: 34px;
    padding: 2px;
    cursor: pointer;
  }
  footer {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 18px;
    border-top: 1px solid var(--border);
  }
</style>
