<script lang="ts">
  import { permissions } from '../stores/permissions.svelte'
  import { ui, type PanelTab } from '../stores/ui.svelte'
  import ChangesTab from './ChangesTab.svelte'
  import FilesTab from './FilesTab.svelte'
  import Icon from './Icon.svelte'
  import PermissionsTab from './PermissionsTab.svelte'
  import StatusTab from './StatusTab.svelte'
  import TodosTab from './TodosTab.svelte'

  const tabs: { id: PanelTab; label: string; icon: string }[] = [
    { id: 'files', label: 'Files', icon: 'folder' },
    { id: 'changes', label: 'Changes', icon: 'file-diff' },
    { id: 'todos', label: 'Todos', icon: 'list' },
    { id: 'status', label: 'Status', icon: 'activity' },
    { id: 'permissions', label: 'Access', icon: 'shield' },
  ]

  const pendingCount = $derived(permissions.pending.length)
</script>

<aside class="panel-wrap">
  <div class="tabs">
    {#each tabs as tab (tab.id)}
      <button
        class="tab"
        class:active={ui.panelTab === tab.id}
        title={tab.label}
        onclick={() => (ui.panelTab = tab.id)}
      >
        <Icon name={tab.icon} size={15} />
        {#if tab.id === 'permissions' && pendingCount > 0}
          <span class="badge">{pendingCount}</span>
        {/if}
      </button>
    {/each}
    <span class="spacer"></span>
    <button class="tab" title="Hide panel" onclick={() => (ui.panelOpen = false)}>
      <Icon name="panel-right" size={15} />
    </button>
  </div>

  <div class="content">
    {#if ui.panelTab === 'files'}
      <FilesTab />
    {:else if ui.panelTab === 'changes'}
      <ChangesTab />
    {:else if ui.panelTab === 'todos'}
      <TodosTab />
    {:else if ui.panelTab === 'status'}
      <StatusTab />
    {:else}
      <PermissionsTab />
    {/if}
  </div>
</aside>

<style>
  .panel-wrap {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    padding: 14px 0;
    gap: 10px;
  }
  .tabs {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 0 10px;
  }
  .tab {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    color: var(--text-faint);
  }
  .tab:hover {
    background: rgb(255 255 255 / 0.07);
    color: var(--text);
  }
  .tab.active {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 15%, transparent);
  }
  .badge {
    position: absolute;
    top: 2px;
    right: 2px;
    min-width: 14px;
    height: 14px;
    padding: 0 3px;
    border-radius: 999px;
    background: var(--warning);
    color: #191200;
    font-size: 0.6rem;
    font-weight: 700;
    display: grid;
    place-items: center;
  }
  .spacer {
    flex: 1;
  }
  .content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
</style>
