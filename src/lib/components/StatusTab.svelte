<script lang="ts">
  import { connection } from '../stores/connection.svelte'
  import { models } from '../stores/models.svelte'
  import { status } from '../stores/status.svelte'
  import Icon from './Icon.svelte'

  function statusClass(value: string): string {
    if (value === 'connected') return 'ok'
    if (value === 'failed' || value === 'error') return 'err'
    return 'warn'
  }
</script>

<div class="tab">
  <div class="head">
    <span class="section-label">Server</span>
    <span class="spacer"></span>
    <button class="ghost mini" title="Refresh" onclick={() => status.refresh()} disabled={status.refreshing}>
      <Icon name="refresh" size={14} class={status.refreshing ? 'spin' : ''} />
    </button>
  </div>

  <div class="list">
    <div class="card">
      <div class="kv">
        <span class="k">Endpoint</span>
        <span class="v mono">{connection.settings.baseUrl}</span>
      </div>
      <div class="kv">
        <span class="k">Version</span>
        <span class="v">{connection.version || '—'}</span>
      </div>
      <div class="kv">
        <span class="k">Project</span>
        <span class="v mono">{status.project?.worktree ?? status.path?.directory ?? '—'}</span>
      </div>
      <div class="kv">
        <span class="k">Branch</span>
        <span class="v">{status.vcs?.branch ?? '—'}</span>
      </div>
      <div class="kv">
        <span class="k">Models</span>
        <span class="v">{models.modelOptions.length}</span>
      </div>
    </div>

    <div class="section">
      <span class="section-label">MCP servers</span>
      {#each Object.entries(status.mcp) as [name, value] (name)}
        <div class="row">
          <Icon name="plug" size={14} />
          <span class="row-name">{name}</span>
          <span class="chip {statusClass(value.status)}">{value.status}</span>
        </div>
      {:else}
        <div class="row muted"><Icon name="plug" size={14} /><span class="row-name">No MCP servers</span></div>
      {/each}
    </div>

    <div class="section">
      <span class="section-label">Language servers</span>
      {#each status.lsp as server (server.id)}
        <div class="row">
          <Icon name="code" size={14} />
          <span class="row-name">{server.name}</span>
          <span class="chip {statusClass(server.status)}">{server.status}</span>
        </div>
      {:else}
        <div class="row muted"><Icon name="code" size={14} /><span class="row-name">No language servers</span></div>
      {/each}
    </div>

    <div class="section">
      <span class="section-label">Formatters</span>
      {#each status.formatters as formatter (formatter.name)}
        <div class="row">
          <Icon name="settings" size={14} />
          <span class="row-name">{formatter.name}</span>
          <span class="chip {formatter.enabled ? 'ok' : 'warn'}">{formatter.enabled ? 'enabled' : 'disabled'}</span>
        </div>
      {:else}
        <div class="row muted"><Icon name="settings" size={14} /><span class="row-name">No formatters</span></div>
      {/each}
    </div>

    <div class="section">
      <span class="section-label">Agents</span>
      {#each models.primaryAgents as agent (agent.name)}
        <div class="row">
          <Icon name="sparkles" size={14} />
          <span class="row-name">{agent.name}</span>
          <span class="chip">{agent.mode}</span>
        </div>
      {/each}
    </div>

    <div class="section">
      <span class="section-label">Commands</span>
      {#each models.commands as command (command.name)}
        <div class="row">
          <Icon name="terminal" size={14} />
          <span class="row-name mono">/{command.name}</span>
          {#if command.description}
            <span class="row-desc">{command.description}</span>
          {/if}
        </div>
      {:else}
        <div class="row muted"><span class="row-name">No commands</span></div>
      {/each}
    </div>
  </div>
</div>

<style>
  .tab {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
  }
  .head {
    display: flex;
    align-items: center;
    padding: 0 12px 8px;
  }
  .spacer {
    flex: 1;
  }
  .list {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 0 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .section-label {
    display: block;
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-faint);
    margin-bottom: 6px;
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface-2);
  }
  .kv {
    display: flex;
    gap: 10px;
    font-size: 0.78rem;
  }
  .k {
    width: 68px;
    flex-shrink: 0;
    color: var(--text-faint);
  }
  .v {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mono {
    font-family: var(--mono);
    font-size: 0.74rem;
  }
  .section {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    color: var(--text-muted);
  }
  .row:hover {
    background: var(--surface-2);
  }
  .row.muted {
    color: var(--text-faint);
  }
  .row-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .row-desc {
    font-size: 0.72rem;
    color: var(--text-faint);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 45%;
  }
  .mini {
    height: 26px;
    min-width: 26px;
    padding: 0;
  }
</style>
