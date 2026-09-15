<script lang="ts">
  import { connection } from '../stores/connection.svelte'
  import { status } from '../stores/status.svelte'
  import { ui } from '../stores/ui.svelte'
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

  <div class="brand">
    <span class="mark"><Icon name="sparkles" size={15} /></span>
    <span class="name">opencode</span>
  </div>

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

  <button
    class="ghost"
    title={ui.panelOpen ? 'Hide panel' : 'Show panel'}
    onclick={() => (ui.panelOpen = !ui.panelOpen)}
  >
    <Icon name="panel-right" size={16} />
  </button>

  <button class="ghost" title="Settings" onclick={() => (ui.settingsOpen = true)}>
    <Icon name="settings" size={16} />
  </button>
</header>

<style>
  .topbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .mark {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 8px;
    background: linear-gradient(140deg, var(--accent), color-mix(in srgb, var(--accent) 40%, var(--bg-3)));
    color: #0a0d1a;
  }
  .name {
    font-weight: 650;
    letter-spacing: -0.01em;
    font-size: 0.9rem;
  }
  .spacer {
    flex: 1;
  }
  .chip-button {
    display: inline-flex;
  }
</style>
