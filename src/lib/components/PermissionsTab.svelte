<script lang="ts">
  import type { Permission } from '@opencode-ai/sdk/client'
  import { permissions, type PermissionResponse } from '../stores/permissions.svelte'
  import { sessions } from '../stores/sessions.svelte'
  import Icon from './Icon.svelte'

  const current = $derived(sessions.current)

  const list = $derived(
    [...permissions.pending].sort((a, b) => {
      const aCurrent = a.sessionID === current ? 0 : 1
      const bCurrent = b.sessionID === current ? 0 : 1
      return aCurrent - bCurrent || a.time.created - b.time.created
    }),
  )

  let openId = $state('')

  function patternText(permission: Permission): string {
    if (!permission.pattern) return ''
    return Array.isArray(permission.pattern) ? permission.pattern.join(', ') : permission.pattern
  }

  function respond(permission: Permission, response: PermissionResponse): void {
    void permissions.respond(permission, response)
  }
</script>

<div class="tab">
  <div class="head">
    <span class="section-label">Pending requests</span>
    <span class="spacer"></span>
    {#if list.length > 0}
      <span class="chip warn">{list.length}</span>
    {/if}
  </div>

  <div class="list">
    {#if list.length === 0}
      <div class="empty">
        <Icon name="shield" size={20} />
        No pending permissions
      </div>
    {/if}

    {#each list as permission (permission.id)}
      <div class="card">
        <div class="card-head">
          <span class="type">{permission.type}</span>
          <span class="title">{permission.title}</span>
          {#if permission.sessionID !== current}
            <span class="chip">other session</span>
          {/if}
        </div>

        {#if patternText(permission)}
          <div class="pattern"><Icon name="terminal" size={12} />{patternText(permission)}</div>
        {/if}

        {#if Object.keys(permission.metadata).length > 0}
          <button class="ghost detail" onclick={() => (openId = openId === permission.id ? '' : permission.id)}>
            <Icon name={openId === permission.id ? 'chevron-down' : 'chevron-right'} size={13} />
            Details
          </button>
          {#if openId === permission.id}
            <pre class="meta">{JSON.stringify(permission.metadata, null, 2)}</pre>
          {/if}
        {/if}

        <div class="actions">
          <button class="btn" onclick={() => respond(permission, 'reject')}>Reject</button>
          <button class="btn" onclick={() => respond(permission, 'always')}>Always allow</button>
          <button class="btn primary" onclick={() => respond(permission, 'once')}>Allow once</button>
        </div>
      </div>
    {/each}
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
  .section-label {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-faint);
  }
  .list {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 0 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    border: 1px solid color-mix(in srgb, var(--warning) 30%, var(--border));
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--warning) 8%, var(--surface-2));
  }
  .card-head {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .type {
    font-family: var(--mono);
    font-size: 0.72rem;
    color: var(--warning);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .title {
    font-size: 0.82rem;
    flex: 1;
    min-width: 0;
  }
  .pattern {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--mono);
    font-size: 0.74rem;
    color: var(--text-muted);
    background: var(--input-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 5px 8px;
    overflow-x: auto;
    white-space: nowrap;
  }
  .detail {
    align-self: flex-start;
    height: 26px;
    padding: 0 8px;
    font-size: 0.74rem;
  }
  .meta {
    margin: 0;
    padding: 8px;
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: var(--mono);
    font-size: 0.72rem;
    max-height: 220px;
    overflow: auto;
  }
  .actions {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
  .actions .btn {
    height: 30px;
    font-size: 0.78rem;
  }
</style>
