<script lang="ts">
  import { fileToDataUrl } from '../image'
  import { connection } from '../stores/connection.svelte'
  import { ui, defaultTheme, type BackgroundKind } from '../stores/ui.svelte'
  import Icon from './Icon.svelte'
  import WallpaperPicker from './WallpaperPicker.svelte'

  let baseUrl = $state(connection.settings.baseUrl)
  let username = $state(connection.settings.username)
  let password = $state(connection.settings.password)
  let directory = $state(connection.settings.directory)
  let testing = $state(false)
  let importing = $state(false)
  let fileInput = $state<HTMLInputElement | undefined>()

  async function onChooseFile(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    importing = true
    try {
      const dataUrl = await fileToDataUrl(file)
      ui.updateTheme({ kind: 'image', imageUrl: dataUrl })
      ui.toast('Wallpaper updated', 'success')
    } catch (error) {
      ui.toast(error instanceof Error ? error.message : 'Could not load image', 'error')
    } finally {
      importing = false
    }
  }

  const kinds: { id: BackgroundKind; label: string }[] = [
    { id: 'aurora', label: 'Aurora' },
    { id: 'mesh', label: 'Mesh' },
    { id: 'gradient', label: 'Gradient' },
    { id: 'solid', label: 'Solid' },
    { id: 'image', label: 'Image' },
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
          <WallpaperPicker />
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
          <div class="wallpaper">
            <div
              class="wp-preview"
              style={ui.theme.imageUrl ? `background-image:url("${ui.theme.imageUrl}")` : ''}
            ></div>
            <div class="wp-info">
              <span class="wp-label">Wallpaper</span>
              <span class="wp-sub">Local images are embedded in browser storage</span>
            </div>
            <span class="spacer"></span>
            <button class="btn" disabled={importing} onclick={() => fileInput?.click()}>
              {importing ? 'Importing…' : 'Choose image…'}
            </button>
            <button class="btn" onclick={() => ui.updateTheme({ imageUrl: '/wallpaper.svg' })}>
              Reset
            </button>
          </div>
          <input
            bind:this={fileInput}
            class="hidden-file"
            type="file"
            accept="image/*"
            onchange={onChooseFile}
          />
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
              max="60"
              step="1"
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
            max="1"
            step="0.01"
            value={ui.theme.dim}
            oninput={(event) => ui.updateTheme({ dim: Number((event.currentTarget as HTMLInputElement).value) })}
          />
        </label>

        <label class="field">
          <span>Panel opacity — {Math.round(ui.theme.panelOpacity * 100)}%</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={ui.theme.panelOpacity}
            oninput={(event) =>
              ui.updateTheme({ panelOpacity: Number((event.currentTarget as HTMLInputElement).value) })}
          />
        </label>

        <div class="subsection">Effects</div>

        <label class="field">
          <span>Bottom fade — {Math.round(ui.theme.fade * 100)}%</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={ui.theme.fade}
            oninput={(event) => ui.updateTheme({ fade: Number((event.currentTarget as HTMLInputElement).value) })}
          />
        </label>

        <label class="field">
          <span>Vignette — {Math.round(ui.theme.vignette * 100)}%</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={ui.theme.vignette}
            oninput={(event) =>
              ui.updateTheme({ vignette: Number((event.currentTarget as HTMLInputElement).value) })}
          />
        </label>

        <label class="field">
          <span>Top bloom — {Math.round(ui.theme.bloom * 100)}%</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={ui.theme.bloom}
            oninput={(event) => ui.updateTheme({ bloom: Number((event.currentTarget as HTMLInputElement).value) })}
          />
        </label>

        <label class="field">
          <span>Film grain — {Math.round(ui.theme.grain * 100)}%</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={ui.theme.grain}
            oninput={(event) => ui.updateTheme({ grain: Number((event.currentTarget as HTMLInputElement).value) })}
          />
        </label>

        <label class="field">
          <span>Dithering — {Math.round(ui.theme.dither * 100)}%</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={ui.theme.dither}
            oninput={(event) => ui.updateTheme({ dither: Number((event.currentTarget as HTMLInputElement).value) })}
          />
        </label>

        <label class="field">
          <span>Scanlines — {Math.round(ui.theme.scanline * 100)}%</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={ui.theme.scanline}
            oninput={(event) => ui.updateTheme({ scanline: Number((event.currentTarget as HTMLInputElement).value) })}
          />
        </label>

        <label class="toggle">
          <input
            type="checkbox"
            checked={ui.theme.drift}
            onchange={(event) =>
              ui.updateTheme({ drift: (event.currentTarget as HTMLInputElement).checked })}
          />
          <span>Ambient drift</span>
        </label>
      </section>
    </div>

    <footer>
      <button class="btn" onclick={() => ui.updateTheme({ ...defaultTheme })}>
        Reset appearance
      </button>
      <span class="spacer"></span>
      <button class="btn primary" onclick={close}>Done</button>
    </footer>
  </div>
</div>

<style>
  .subsection {
    margin-top: 6px;
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-faint);
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.82rem;
    color: var(--text-muted);
    cursor: pointer;
  }
  .toggle input {
    accent-color: var(--accent);
  }
  .wallpaper {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .wp-preview {
    width: 56px;
    height: 56px;
    flex-shrink: 0;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background-color: var(--surface-3);
    background-size: cover;
    background-position: center;
  }
  .wp-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .wp-label {
    font-size: 0.85rem;
    color: var(--text);
  }
  .wp-sub {
    font-size: 0.7rem;
    color: var(--text-faint);
  }
  .hidden-file {
    display: none;
  }
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
