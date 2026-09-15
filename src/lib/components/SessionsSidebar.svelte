<script lang="ts">
  import type { Session } from '@opencode-ai/sdk/client'
  import { connection } from '../stores/connection.svelte'
  import { permissions } from '../stores/permissions.svelte'
  import { sessions } from '../stores/sessions.svelte'
  import { ui } from '../stores/ui.svelte'
  import { relativeTime } from '../format'
  import Icon from './Icon.svelte'

  type Row = {
    session: Session
    depth: number
    hasChildren: boolean
    expanded: boolean
  }

  let query = $state('')
  let editingId = $state('')
  let editValue = $state('')
  let collapsed = $state<Record<string, boolean>>({})

  const rows = $derived.by<Row[]>(() => {
    const q = query.trim().toLowerCase()
    const out: Row[] = []
    for (const root of sessions.roots) {
      const kids = sessions.children(root.id)
      const rootMatch = !q || root.title.toLowerCase().includes(q)
      const matchedKids = kids.filter((kid) => !q || kid.title.toLowerCase().includes(q))
      const expanded = !collapsed[root.id]
      if (rootMatch) {
        out.push({ session: root, depth: 0, hasChildren: kids.length > 0, expanded })
        if (expanded) {
          for (const kid of q ? matchedKids : kids) {
            out.push({ session: kid, depth: 1, hasChildren: false, expanded: false })
          }
        }
      } else {
        for (const kid of matchedKids) {
          out.push({ session: kid, depth: 1, hasChildren: false, expanded: false })
        }
      }
    }
    return out
  })

  function toggle(id: string): void {
    collapsed = { ...collapsed, [id]: !collapsed[id] }
  }

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
  <button
    class="nav-row new"
    class:active={sessions.current === ''}
    onclick={() => sessions.select('')}
    title="New thread"
  >
    <Icon name="plus" size={15} />
    <span>New thread</span>
  </button>

  <div class="search">
    <Icon name="search" size={14} />
    <input placeholder="Search sessions" bind:value={query} />
  </div>

  <div class="section">
    <span class="section-label">Sessions</span>
    <span class="section-count">{rows.length}</span>
  </div>

  <div class="list">
    {#if rows.length === 0}
      <div class="empty">
        {sessions.loading ? 'Loading…' : query ? 'No matches' : 'No sessions yet'}
      </div>
    {/if}

    {#each rows as row (row.session.id)}
      {@const statusType = sessions.status(row.session.id)?.type ?? 'idle'}
      {@const count = permissions.forSession(row.session.id).length}
      <div
        class="item"
        class:active={sessions.current === row.session.id}
        class:child={row.depth > 0}
      >
        {#if editingId === row.session.id}
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
          {#if row.hasChildren}
            <button
              class="twist"
              title={row.expanded ? 'Collapse' : 'Expand'}
              onclick={() => toggle(row.session.id)}
            >
              <Icon name={row.expanded ? 'chevron-down' : 'chevron-right'} size={12} />
            </button>
          {:else}
            <span class="twist"></span>
          {/if}
          <button class="item-main" onclick={() => sessions.select(row.session.id)}>
            {#if row.depth === 0}
              <span class="dot {statusType}"></span>
            {:else}
              <span class="branch"><Icon name="git-branch" size={12} /></span>
            {/if}
            <span class="text">
              <span class="name">{row.session.title}</span>
              <span class="sub">
                {relativeTime(row.session.time.updated)}
                {#if row.session.summary}· {row.session.summary.files} files{/if}
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
              onclick={() => startRename(row.session.id, row.session.title)}
            >
              <Icon name="pencil" size={13} />
            </button>
            <button class="ghost mini danger" title="Delete" onclick={() => remove(row.session.id)}>
              <Icon name="trash" size={13} />
            </button>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="foot">
    <span class="avatar" class:offline={connection.status !== 'online'}>oc</span>
    <button class="status" onclick={() => connection.refresh()} title="Reconnect">
      <span class="status-text">
        {connection.status === 'online'
          ? 'opencode'
          : connection.status === 'connecting'
            ? 'connecting…'
            : 'offline'}
      </span>
      <span class="status-sub">
        {connection.status === 'online' && connection.version
          ? `v${connection.version}`
          : 'tap to retry'}
      </span>
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
    padding: 10px;
    gap: 8px;
    color: var(--text);
  }
  .nav-row {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 34px;
    padding: 0 10px;
    border-radius: var(--radius-sm);
    color: var(--text);
    font-size: 0.85rem;
    font-weight: 500;
    text-align: left;
    transition: background 0.16s ease, border-color 0.16s ease;
  }
  .new {
    background: rgb(255 255 255 / 0.06);
    border: 1px solid var(--border);
  }
  .new:hover {
    background: rgb(255 255 255 / 0.1);
    border-color: var(--border-strong);
  }
  .new.active {
    background: rgb(255 255 255 / 0.1);
    border-color: var(--border-strong);
  }
  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 32px;
    padding: 0 9px;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-faint);
    transition: background 0.16s ease, border-color 0.16s ease;
  }
  .search:hover {
    background: var(--hover);
  }
  .search:focus-within {
    border-color: var(--border-strong);
    background: var(--hover);
  }
  .search input {
    flex: 1;
    min-width: 0;
    background: none;
    border: none;
    outline: none;
    font-size: 0.82rem;
  }
  .section {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px 2px;
  }
  .section-label {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-faint);
  }
  .section-count {
    font-size: 0.7rem;
    color: var(--text-faint);
    font-variant-numeric: tabular-nums;
  }
  .list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-height: 0;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 2px;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    transition: background 0.16s ease;
  }
  .item:hover {
    background: var(--hover);
  }
  .item.active {
    background: rgb(255 255 255 / 0.07);
  }
  .item.child {
    margin-left: 16px;
    border-left: 1px solid var(--border);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }
  .twist {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 26px;
    flex-shrink: 0;
    color: var(--text-faint);
  }
  button.twist:hover {
    color: var(--text);
  }
  .branch {
    display: inline-flex;
    color: var(--text-faint);
    flex-shrink: 0;
  }
  .item-main {
    display: flex;
    align-items: center;
    gap: 9px;
    flex: 1;
    min-width: 0;
    padding: 8px;
    text-align: left;
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--text-faint);
  }
  .dot.busy {
    background: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent);
    animation: pulse 1.4s ease-in-out infinite;
  }
  .dot.retry {
    background: var(--warning);
  }
  .dot.idle {
    background: var(--success);
    opacity: 0.55;
  }
  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 1px;
  }
  .name {
    font-size: 0.83rem;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sub {
    font-size: 0.7rem;
    color: var(--text-faint);
    font-variant-numeric: tabular-nums;
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
    background: var(--warning-bg);
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
    padding: 6px 9px;
    background: var(--input-bg);
    border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
    border-radius: var(--radius-sm);
    outline: none;
    font-size: 0.83rem;
  }
  .foot {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px 4px 2px;
    border-top: 1px solid var(--border);
  }
  .avatar {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    border-radius: 8px;
    background: linear-gradient(150deg, #6d5bd0, #b4457a);
    color: #ffffff;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .avatar.offline {
    background: var(--surface-3);
    color: var(--text-faint);
  }
  .status {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
    flex: 1;
    min-width: 0;
    text-align: left;
  }
  .status-text {
    font-size: 0.82rem;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .status-sub {
    font-size: 0.68rem;
    color: var(--text-faint);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
