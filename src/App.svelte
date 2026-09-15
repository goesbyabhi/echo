<script lang="ts">
  import { onMount } from 'svelte'
  import ChatView from './lib/components/ChatView.svelte'
  import Icon from './lib/components/Icon.svelte'
  import RightPanel from './lib/components/RightPanel.svelte'
  import SessionsSidebar from './lib/components/SessionsSidebar.svelte'
  import SettingsModal from './lib/components/SettingsModal.svelte'
  import Toasts from './lib/components/Toasts.svelte'
  import TopBar from './lib/components/TopBar.svelte'
  import { startEventStream } from './lib/events'
  import { fileToDataUrl } from './lib/image'
  import { connection } from './lib/stores/connection.svelte'
  import { models } from './lib/stores/models.svelte'
  import { sessions } from './lib/stores/sessions.svelte'
  import { status } from './lib/stores/status.svelte'
  import { ui } from './lib/stores/ui.svelte'

  onMount(() => {
    ui.applyTheme()
  })

  let dragDepth = $state(0)
  const dragging = $derived(dragDepth > 0)

  function hasFiles(event: DragEvent): boolean {
    return Boolean(event.dataTransfer?.types.includes('Files'))
  }

  function onDragEnter(event: DragEvent): void {
    if (!hasFiles(event)) return
    event.preventDefault()
    dragDepth++
  }

  function onDragOver(event: DragEvent): void {
    if (!hasFiles(event)) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  }

  function onDragLeave(event: DragEvent): void {
    if (!hasFiles(event)) return
    dragDepth = Math.max(0, dragDepth - 1)
  }

  async function onDrop(event: DragEvent): Promise<void> {
    if (!hasFiles(event)) return
    event.preventDefault()
    dragDepth = 0
    const file = event.dataTransfer?.files?.[0]
    if (!file) return
    try {
      const dataUrl = await fileToDataUrl(file)
      ui.updateTheme({ kind: 'image', imageUrl: dataUrl })
      ui.toast('Wallpaper updated', 'success')
    } catch (error) {
      ui.toast(error instanceof Error ? error.message : 'Could not load image', 'error')
    }
  }

  $effect(() => {
    if (typeof window === 'undefined') return
    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
  })

  $effect(() => {
    ui.persistLayout()
  })

  $effect(() => {
    const id = sessions.current
    if (!id || typeof localStorage === 'undefined') return
    try {
      localStorage.setItem('opencode-ui:session', id)
    } catch {
      /* ignore */
    }
  })

  $effect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.dataset.view = sessions.current ? 'chat' : 'home'
  })

  $effect(() => {
    const client = connection.client
    const controller = new AbortController()
    let cancelled = false

    void (async () => {
      const healthy = await connection.refresh()
      if (cancelled) return
      void startEventStream(client, controller.signal)
      if (!healthy) return
      await Promise.all([models.load(), sessions.refresh(), status.refresh()])
      sessions.restoreLast()
      if (!cancelled) await sessions.refreshStatuses()
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
  })

  $effect(() => {
    const timer = setInterval(() => {
      if (connection.status === 'online') void sessions.refreshStatuses()
    }, 15000)
    return () => clearInterval(timer)
  })
</script>

<div class="app-bg"></div>
<div class="fx fx-bloom"></div>
<div class="fx fx-dither"></div>
<div class="fx fx-scanlines"></div>
<div class="fx fx-grain"></div>
<div class="fx fx-vignette"></div>
<div class="fx fx-fade"></div>

<div class="shell">
  {#if ui.sidebarOpen}
    <div class="sidebar-col">
      <SessionsSidebar />
    </div>
  {/if}

  <main class="main">
    <div class="tone tone-top"></div>
    <div class="tone tone-bottom"></div>

    <TopBar />

    <div class="content">
      <div class="chat-col">
        <ChatView />
      </div>

      {#if ui.panelOpen && sessions.current}
        <div class="right-col panel" class:wide={ui.panelTab === 'diff'}>
          <RightPanel />
        </div>
      {/if}
    </div>
  </main>
</div>

{#if dragging}
  <div class="dropzone">
    <div class="dropzone-card">
      <Icon name="image" size={22} />
      <span>Drop an image to set your wallpaper</span>
    </div>
  </div>
{/if}

{#if ui.settingsOpen}
  <SettingsModal />
{/if}

<Toasts />

<style>
  .shell {
    display: flex;
    height: 100vh;
    height: 100dvh;
  }
  .sidebar-col {
    width: 260px;
    flex-shrink: 0;
    height: 100%;
    min-height: 0;
    display: flex;
    background: #000000;
    border-right: 1px solid var(--border);
  }
  .main {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .tone {
    position: absolute;
    left: 0;
    right: 0;
    pointer-events: none;
    z-index: 1;
  }
  .tone-top {
    top: 0;
    height: 170px;
    background: linear-gradient(to bottom, rgb(0 0 0 / 0.75), rgb(0 0 0 / 0.25) 55%, transparent);
    opacity: var(--tone-top, 0);
    transition: opacity 0.4s ease;
  }
  .tone-bottom {
    bottom: 0;
    height: 300px;
    background: linear-gradient(to top, rgb(0 0 0 / 0.85), rgb(0 0 0 / 0.3) 55%, transparent);
    opacity: var(--tone-bottom, 0);
    transition: opacity 0.4s ease;
  }
  .content {
    position: relative;
    z-index: 2;
  }
  .dropzone {
    position: fixed;
    inset: 10px;
    z-index: 200;
    display: grid;
    place-items: center;
    border: 2px dashed color-mix(in srgb, var(--accent) 60%, transparent);
    border-radius: var(--radius-lg);
    background: rgb(0 0 0 / 0.55);
    backdrop-filter: blur(6px);
    pointer-events: none;
    animation: fade-in 0.15s ease;
  }
  .dropzone-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    border-radius: var(--radius);
    background: var(--surface-1);
    border: 1px solid var(--border-strong);
    color: var(--text);
    font-size: 0.9rem;
    box-shadow: var(--shadow-lg);
  }
  .content {
    flex: 1;
    min-height: 0;
    display: flex;
  }
  .chat-col {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
  }
  .right-col {
    width: 360px;
    flex-shrink: 0;
    margin: 10px 10px 10px 0;
    min-height: 0;
    overflow: hidden;
    transition: width 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .right-col.wide {
    width: min(720px, 52vw);
  }

  @media (max-width: 1180px) {
    .right-col {
      width: 320px;
    }
    .right-col.wide {
      width: min(560px, 58vw);
    }
  }

  @media (max-width: 980px) {
    .right-col {
      display: none;
    }
    .right-col.wide {
      display: block;
      width: min(520px, 72vw);
    }
  }

  @media (max-width: 760px) {
    .sidebar-col {
      display: none;
    }
  }
</style>
