<script lang="ts">
  import type { FileDiff } from '@opencode-ai/sdk/client'
  import { countChanges } from '../diff'
  import { chat } from '../stores/chat.svelte'
  import { connection } from '../stores/connection.svelte'
  import { errorMessage } from '../stores/models.svelte'
  import { sessions } from '../stores/sessions.svelte'
  import { ui } from '../stores/ui.svelte'
  import DiffBlock from './DiffBlock.svelte'
  import Icon from './Icon.svelte'

  const sessionID = $derived(sessions.current)

  let serverDiffs = $state<FileDiff[]>([])
  let loading = $state(false)
  let openPath = $state('')

  function fromConversation(id: string): FileDiff[] {
    const entries = id ? chat.entries(id) : []
    const map = new Map<string, FileDiff>()
    for (const entry of entries) {
      for (const part of entry.parts) {
        if (part.type !== 'tool') continue
        const input = part.state.input as Record<string, unknown> | undefined
        if (!input) continue
        const file =
          typeof input.filePath === 'string'
            ? input.filePath
            : typeof input.path === 'string'
              ? input.path
              : ''
        if (!file) continue
        if (part.tool === 'edit') {
          const before = typeof input.oldString === 'string' ? input.oldString : ''
          const after = typeof input.newString === 'string' ? input.newString : ''
          const counts = countChanges(before, after)
          map.set(file, { file, before, after, additions: counts.additions, deletions: counts.deletions })
        } else if (part.tool === 'write') {
          const after = typeof input.content === 'string' ? input.content : ''
          const counts = countChanges('', after)
          map.set(file, { file, before: '', after, additions: counts.additions, deletions: counts.deletions })
        }
      }
    }
    return [...map.values()].sort((a, b) => a.file.localeCompare(b.file))
  }

  const conversationDiffs = $derived(sessionID ? fromConversation(sessionID) : [])
  const usingFallback = $derived(serverDiffs.length === 0 && conversationDiffs.length > 0)
  const diffs = $derived(serverDiffs.length > 0 ? serverDiffs : conversationDiffs)

  async function load(): Promise<void> {
    if (!sessionID) {
      serverDiffs = []
      return
    }
    loading = true
    try {
      const result = await connection.client.session.diff({ path: { id: sessionID } })
      if (result.error) throw result.error
      serverDiffs = result.data ?? []
    } catch (error) {
      serverDiffs = []
      ui.toast(errorMessage(error), 'error', 'Could not load changes')
    } finally {
      loading = false
    }
  }

  $effect(() => {
    void sessionID
    void load()
  })

  const totals = $derived({
    additions: diffs.reduce((sum, diff) => sum + diff.additions, 0),
    deletions: diffs.reduce((sum, diff) => sum + diff.deletions, 0),
  })
</script>

<div class="tab">
  <div class="head">
    <span class="chip ok">+{totals.additions}</span>
    <span class="chip err">-{totals.deletions}</span>
    <span class="chip">{diffs.length} files</span>
    {#if usingFallback}
      <span class="chip" title="session.diff returned nothing; showing edits from this conversation">
        conversation
      </span>
    {/if}
    <span class="spacer"></span>
    <button class="ghost mini" title="Refresh" onclick={load} disabled={loading}>
      <Icon name="refresh" size={14} class={loading ? 'spin' : ''} />
    </button>
  </div>

  <div class="list">
    {#if !sessionID}
      <div class="empty">Select a session</div>
    {:else if diffs.length === 0 && !loading}
      <div class="empty">
        <Icon name="file-diff" size={20} />
        No changes recorded for this session
      </div>
    {/if}

    {#each diffs as diff (diff.file)}
      <div class="file">
        <div class="file-head">
          <button class="file-toggle" onclick={() => (openPath = openPath === diff.file ? '' : diff.file)}>
            <Icon name={openPath === diff.file ? 'chevron-down' : 'chevron-right'} size={14} />
            <span class="name" title={diff.file}>{diff.file}</span>
          </button>
          <span class="spacer"></span>
          <span class="add">+{diff.additions}</span>
          <span class="del">-{diff.deletions}</span>
          <button
            class="ghost mini"
            title="Open in diff panel"
            onclick={() =>
              ui.openDiff({ title: diff.file, before: diff.before, after: diff.after })}
          >
            <Icon name="external" size={13} />
          </button>
        </div>
        {#if openPath === diff.file}
          <div class="file-body">
            <DiffBlock before={diff.before} after={diff.after} fileName={diff.file} />
          </div>
        {/if}
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
    gap: 8px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 12px;
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
    gap: 8px;
  }
  .file {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    background: rgb(255 255 255 / 0.02);
  }
  .file-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 6px 4px 8px;
  }
  .file-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    padding: 4px 0;
    font-size: 0.8rem;
    color: var(--text-muted);
    text-align: left;
  }
  .file-toggle:hover {
    color: var(--text);
  }
  .name {
    font-family: var(--mono);
    font-size: 0.76rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .add {
    color: var(--success);
    font-size: 0.74rem;
  }
  .del {
    color: var(--error);
    font-size: 0.74rem;
  }
  .file-body {
    padding: 0 10px 10px;
  }
  .mini {
    height: 26px;
    min-width: 26px;
    padding: 0;
  }
</style>
