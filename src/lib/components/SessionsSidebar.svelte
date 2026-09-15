<script lang="ts">
  import { connection } from '../stores/connection.svelte'
  import { permissions } from '../stores/permissions.svelte'
  import { sessions } from '../stores/sessions.svelte'
  import { ui } from '../stores/ui.svelte'
  import { relativeTime } from '../format'
  import Icon from './Icon.svelte'

  let query = $state('')
  let editingId = $state('')
  let editValue = $state('')

  const filtered = $derived(
    sessions.roots.filter((session) =>
      session.title.toLowerCase().includes(query.trim().toLowerCase()),
    ),
  )

  function startRename(id: string, title: string): void {
    editingId = id
    editValue = title
  }

  async function commitRename(): Promise<void> {
    const id = editingId
    const value = editValue.trim()
    editingId = ''
    if (id && value) await sessions.rename(id, value)
  }

  async function remove(id: string): Promise<void> {
    if (!confirm('Delete this session permanently?')) return
    await sessions.remove(id)
  }
</script>

<aside class="sidebar">
  <div class="top">
    <button class="btn primary new" onclick={() => sessions.create()}>
      <Icon name="plus" size={15} />
      New session
    </button>
  </div>

  <div class="search">
    <Icon name="search" size={14} />
    <input placeholder="Search sessions" bind:value={query} />
  </div>

  <div class="list">
    {#if filtered.length === 0}
      <div class="empty">
        {sessions.loading ? 'Loading…' : query ? 'No matches' : 'No sessions yet'}
      </div>
    {/if}

    {#each filtered as session (session.id)}
      {@const statusType = sessions.status(session.id)?.type ?? 'idle'}
      {@const count = permissions.forSession(session.id).length}
      <div class="item" class:active={sessions.current === session.id}>
        {#if editingId === session.id}
          <input
            class="rename"
            bind:value={editValue}
            onblur={commitRename}
            onkeydown={(event) => {
              if (event.key === 'Enter') void commitRename()
              if (event.key === 'Escape') editingId = ''
            }}
          />
        {:else}
          <button class="item-main" onclick={() => sessions.select(session.id)}>
            <span class="dot {statusType}"></span>
            <span class="text">
              <span class="name">{session.title}</span>
              <span class="sub">
                {relativeTime(session.time.updated)}
                {#if session.summary}· {session.summary.files} files{/if}
              </span>
            </span>
            {#if count > 0}
              <span class="badge"><Icon name="shield" size={11} />{count}</span>
            {/if}
          </button>
          <div class="actions">
            <button
              class="ghost mini"
              title="Rename"
              onclick={() => startRename(session.id, session.title)}
            >
              <Icon name="settings" size={13} stroke={1.5} />
            </button>
            <button class="ghost mini danger" title="Delete" onclick={() => remove(session.id)}>
              <Icon name="trash" size={13} />
            </button>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="foot">
    <button class="status" onclick={() => connection.refresh()}>
      <span class="dot {connection.status === 'online' ? 'idle' : connection.status === 'connecting' ? 'retry' : 'busy'}"></span>
      <span class="status-text">
        {connection.status === 'online'
          ? `connected${connection.version ? ` · v${connection.version}` : ''}`
          : connection.status === 'connecting'
            ? 'connecting…'
            : 'offline'}
      </span>
      <Icon name="refresh" size={13} />
    </button>
    <button class="ghost mini" title="Settings" onclick={() => (ui.settingsOpen = true)}>
      <Icon name="settings" size={15} />
    </button>
  </div>
</aside>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    min-height: 0;
    width: 100%;
    padding: 14px 12px;
    gap: 12px;
  }
  .new {
    width: 100%;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: rgb(0 0 0 / 0.22);
    color: var(--text-faint);
  }
  .search input {
    flex: 1;
    min-width: 0;
    background: none;
    border: none;
    outline: none;
    font-size: 0.84rem;
  }
  .list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-height: 0;
    margin: 0 -4px;
    padding: 0 4px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 2px;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
  }
  .item:hover {
    background: rgb(255 255 255 / 0.05);
  }
  .item.active {
    background: color-mix(in srgb, var(--accent) 15%, transparent);
    border-color: color-mix(in srgb, var(--accent) 30%, transparent);
  }
  .item-main {
    display: flex;
    align-items: center;
    gap: 9px;
    flex: 1;
    min-width: 0;
    padding: 9px 8px;
    text-align: left;
  }
  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--text-faint);
  }
  .dot.busy {
    background: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent);
    animation: pulse 1.4s ease-in-out infinite;
  }
  .dot.retry {
    background: var(--warning);
  }
  .dot.idle {
    background: var(--success);
    opacity: 0.5;
  }
  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 1px;
  }
  .name {
    font-size: 0.84rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sub {
    font-size: 0.7rem;
    color: var(--text-faint);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 0.68rem;
    color: var(--warning);
    background: color-mix(in srgb, var(--warning) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--warning) 32%, transparent);
    border-radius: 999px;
    padding: 1px 6px;
  }
  .actions {
    display: flex;
    gap: 1px;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
  .item:hover .actions {
    opacity: 1;
  }
  .mini {
    height: 26px;
    min-width: 26px;
    padding: 0;
  }
  .mini.danger:hover {
    color: var(--error);
  }
  .rename {
    width: 100%;
    margin: 4px;
    padding: 7px 9px;
    background: rgb(0 0 0 / 0.35);
    border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
    border-radius: var(--radius-sm);
    outline: none;
    font-size: 0.84rem;
  }
  .foot {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
  }
  .status {
    display: flex;
    align-items: center;
    gap: 7px;
    flex: 1;
    min-width: 0;
    padding: 6px 6px;
    border-radius: var(--radius-sm);
    color: var(--text-faint);
    font-size: 0.76rem;
  }
  .status:hover {
    background: rgb(255 255 255 / 0.05);
    color: var(--text-muted);
  }
  .status-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
