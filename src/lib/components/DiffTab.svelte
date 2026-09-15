<script lang="ts">
  import { ui } from '../stores/ui.svelte'
  import DiffBlock from './DiffBlock.svelte'
  import Icon from './Icon.svelte'

  const view = $derived(ui.diffView)
</script>

<div class="tab">
  {#if view}
    <div class="head">
      <Icon name="file-diff" size={14} />
      <span class="file" title={view.title}>{view.title}</span>
      <span class="spacer"></span>
      <button class="ghost mini" title="Close diff" onclick={() => (ui.diffView = null)}>
        <Icon name="x" size={14} />
      </button>
    </div>
    <div class="body">
      <DiffBlock before={view.before} after={view.after} fileName={view.title} />
    </div>
  {:else}
    <div class="empty">
      <Icon name="file-diff" size={20} />
      Open a change from the chat to inspect its diff
    </div>
  {/if}
</div>

<style>
  .tab {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
    gap: 8px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    color: var(--text-muted);
    font-size: 0.78rem;
  }
  .file {
    font-family: var(--mono);
    font-size: 0.76rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .spacer {
    flex: 1;
  }
  .body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 0 12px 12px;
    animation: fade-in 0.22s ease;
  }
  .mini {
    height: 26px;
    min-width: 26px;
    padding: 0;
  }
</style>
