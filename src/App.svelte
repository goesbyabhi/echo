<script lang="ts">
  import { onMount } from 'svelte'
  import ChatView from './lib/components/ChatView.svelte'
  import RightPanel from './lib/components/RightPanel.svelte'
  import SessionsSidebar from './lib/components/SessionsSidebar.svelte'
  import SettingsModal from './lib/components/SettingsModal.svelte'
  import Toasts from './lib/components/Toasts.svelte'
  import TopBar from './lib/components/TopBar.svelte'
  import { startEventStream } from './lib/events'
  import { connection } from './lib/stores/connection.svelte'
  import { models } from './lib/stores/models.svelte'
  import { sessions } from './lib/stores/sessions.svelte'
  import { status } from './lib/stores/status.svelte'
  import { ui } from './lib/stores/ui.svelte'

  onMount(() => {
    ui.applyTheme()
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

<div class="shell">
  <TopBar />

  <div class="main">
    {#if ui.sidebarOpen}
      <div class="col sidebar-col panel">
        <SessionsSidebar />
      </div>
    {/if}

    <div class="col chat-col panel">
      <ChatView />
    </div>

    {#if ui.panelOpen}
      <div class="col right-col panel">
        <RightPanel />
      </div>
    {/if}
  </div>
</div>

{#if ui.settingsOpen}
  <SettingsModal />
{/if}

<Toasts />

<style>
  .shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
    height: 100dvh;
    min-height: 0;
  }
  .main {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: 12px;
    padding: 12px;
  }
  .col {
    min-height: 0;
    overflow: hidden;
    display: flex;
  }
  .sidebar-col {
    width: 288px;
    flex-shrink: 0;
    flex-direction: column;
  }
  .chat-col {
    flex: 1;
    min-width: 0;
    flex-direction: column;
  }
  .right-col {
    width: 400px;
    flex-shrink: 0;
    flex-direction: column;
  }

  @media (max-width: 1180px) {
    .right-col {
      width: 340px;
    }
  }

  @media (max-width: 980px) {
    .right-col {
      display: none;
    }
  }

  @media (max-width: 760px) {
    .sidebar-col {
      display: none;
    }
    .main {
      padding: 8px;
      gap: 8px;
    }
  }
</style>
