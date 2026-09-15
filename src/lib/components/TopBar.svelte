<script lang="ts">
  import { connection } from '../stores/connection.svelte'
  import { sessions } from '../stores/sessions.svelte'
  import { status } from '../stores/status.svelte'
  import { ui } from '../stores/ui.svelte'
  import BrandMark from './BrandMark.svelte'
  import Icon from './Icon.svelte'

  const statusChip = $derived.by(() => {
    if (connection.status === 'online') return { cls: 'ok', text: 'online' }
    if (connection.status === 'connecting') return { cls: 'warn', text: 'connecting' }
    return { cls: 'err', text: 'offline' }
  })
</script>

<header class="topbar">
  <button
    class="ghost"
    title={ui.sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
    onclick={() => (ui.sidebarOpen = !ui.sidebarOpen)}
  >
    <Icon name="panel-left" size={16} />
  </button>

  <button class="brand" title="Home" onclick={() => sessions.select('')}>
    <span class="mark"><BrandMark size={16} /></span>
    <span class="name">echo</span>
  </button>

  {#if status.vcs?.branch}
    <span class="chip"><Icon name="git-branch" size={12} />{status.vcs.branch}</span>
  {/if}

  <span class="spacer"></span>

  <button class="chip-button" onclick={() => connection.refresh()}>
    <span class="chip {statusChip.cls}">
      <span class="pulse-dot {connection.status === 'connecting' ? 'busy' : ''}"></span>
      {statusChip.text}
    </span>
  </button>

  {#if sessions.current}
    <button
      class="ghost"
      title={ui.panelOpen ? 'Hide panel' : 'Show panel'}
      onclick={() => (ui.panelOpen = !ui.panelOpen)}
    >
      <Icon name="panel-right" size={16} />
    </button>
  {/if}

  <button class="ghost" title="Settings" onclick={() => (ui.settingsOpen = true)}>
    <Icon name="settings" size={16} />
  </button>
</header>

<style>
  .topbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    flex-shrink: 0;
    position: relative;
    z-index: 2;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 6px 4px 2px;
    border-radius: var(--radius-sm);
    transition: background 0.16s ease;
  }
  .brand:hover {
    background: var(--hover);
  }
  .mark {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    color: var(--text-strong);
  }
  .name {
    font-weight: 600;
    letter-spacing: -0.02em;
    font-size: 0.9rem;
  }
  .spacer {
    flex: 1;
  }
  .chip-button {
    display: inline-flex;
  }
</style>
