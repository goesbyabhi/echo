<script lang="ts">
  import type { FileDiff } from '@opencode-ai/sdk/client'
  import { countChanges } from '../diff'
  import { relativeTime } from '../format'
  import { chat } from '../stores/chat.svelte'
  import { connection } from '../stores/connection.svelte'
  import { errorMessage } from '../stores/models.svelte'
  import { sessions } from '../stores/sessions.svelte'
  import { ui } from '../stores/ui.svelte'
  import DiffBlock from './DiffBlock.svelte'
  import Icon from './Icon.svelte'

  type Commit = {
    id: string
    title: string
    time: number
    files: FileDiff[]
    additions: number
    deletions: number
  }

  const sessionID = $derived(sessions.current)

  let serverDiffs = $state<FileDiff[]>([])
  let loading = $state(false)
  let openCommit = $state('')
  let openFile = $state('')

  function inputPath(input: Record<string, unknown>): string {
    return typeof input.filePath === 'string'
      ? input.filePath
      : typeof input.path === 'string'
        ? input.path
        : typeof input.file === 'string'
          ? input.file
          : ''
  }

  function commitTitle(text: string): string {
    const line = text.trim().split('\n').find((l) => l.trim())
    if (!line) return 'Edits'
    return line.replace(/^#+\s*/, '').trim()
  }

  function fromConversation(id: string): Commit[] {
    const entries = id ? chat.entries(id) : []
    const commits: Commit[] = []
    for (const entry of entries) {
      if (entry.info.role !== 'assistant') continue
      const files = new Map<string, FileDiff>()
      for (const part of entry.parts) {
        if (part.type !== 'tool') continue
        const input = part.state.input as Record<string, unknown> | undefined
        if (!input) continue
        const file = inputPath(input)
        if (!file) continue
        if (part.tool === 'edit') {
          const before = typeof input.oldString === 'string' ? input.oldString : ''
          const after = typeof input.newString === 'string' ? input.newString : ''
          files.set(file, { file, before, after, ...countChanges(before, after) })
        } else if (part.tool === 'write') {
          const after = typeof input.content === 'string' ? input.content : ''
          files.set(file, { file, before: '', after, ...countChanges('', after) })
        }
      }
      if (files.size === 0) continue
      const text = entry.parts.find((part) => part.type === 'text') as
        | { type: 'text'; text: string }
        | undefined
      const list = [...files.values()].sort((a, b) => a.file.localeCompare(b.file))
      commits.push({
        id: entry.info.id,
        title: commitTitle(text?.text ?? ''),
        time: entry.info.time.created,
        files: list,
        additions: list.reduce((sum, f) => sum + f.additions, 0),
        deletions: list.reduce((sum, f) => sum + f.deletions, 0),
      })
    }
    return commits.reverse()
  }

  const conversation = $derived(sessionID ? fromConversation(sessionID) : [])

  const workingTree = $derived.by<Commit | null>(() => {
    if (serverDiffs.length === 0) return null
    return {
      id: 'working-tree',
      title: 'Uncommitted changes',
      time: 0,
      files: serverDiffs,
      additions: serverDiffs.reduce((sum, f) => sum + f.additions, 0),
      deletions: serverDiffs.reduce((sum, f) => sum + f.deletions, 0),
    }
  })

  const commits = $derived(workingTree ? [workingTree, ...conversation] : conversation)
  const totalAdditions = $derived(commits.reduce((sum, c) => sum + c.additions, 0))
  const totalDeletions = $derived(commits.reduce((sum, c) => sum + c.deletions, 0))

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

  function openInPanel(file: FileDiff): void {
    ui.openDiff({ title: file.file, before: file.before, after: file.after })
  }
</script>

<div class="tab">
  <div class="head">
    <span class="chip">{commits.length} commits</span>
    <span class="chip ok">+{totalAdditions}</span>
    <span class="chip err">-{totalDeletions}</span>
    <span class="spacer"></span>
    <button class="ghost mini" title="Refresh" onclick={load} disabled={loading}>
      <Icon name="refresh" size={14} class={loading ? 'spin' : ''} />
    </button>
  </div>

  <div class="list">
    {#if !sessionID}
      <div class="empty">Select a session</div>
    {:else if commits.length === 0 && !loading}
      <div class="empty">
        <Icon name="file-diff" size={20} />
        No changes recorded for this session
      </div>
    {/if}

    {#each commits as commit (commit.id)}
      {@const expanded = openCommit === commit.id}
      <article class="commit" class:open={expanded}>
        <header class="row">
          <button class="commit-head" onclick={() => (openCommit = expanded ? '' : commit.id)}>
            <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={14} />
            <span class="title">{commit.title}</span>
            <span class="stats">
              <b>+{commit.additions}</b>
              <i>-{commit.deletions}</i>
            </span>
          </button>
          <span class="meta">
            {commit.files.length} file{commit.files.length === 1 ? '' : 's'}
            {#if commit.time}· {relativeTime(commit.time)}{/if}
          </span>
        </header>

        {#if expanded}
          <div class="files">
            {#each commit.files as file (file.file)}
              {@const fileOpen = openFile === `${commit.id}:${file.file}`}
              <div class="file" class:file-open={fileOpen}>
                <div class="file-row">
                  <button
                    class="file-name"
                    title={file.file}
                    onclick={() => (openFile = fileOpen ? '' : `${commit.id}:${file.file}`)}
                  >
                    <span class="file-icon"><Icon name="file" size={13} /></span>
                    <span>{file.file}</span>
                  </button>
                  <span class="add">+{file.additions}</span>
                  <span class="del">-{file.deletions}</span>
                  <button class="ghost mini" title="Open in diff panel" onclick={() => openInPanel(file)}>
                    <Icon name="external" size={13} />
                  </button>
                </div>
                {#if fileOpen}
                  <div class="file-body">
                    <DiffBlock before={file.before} after={file.after} fileName={file.file} />
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </article>
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
    overflow-x: hidden;
    min-height: 0;
    padding: 2px 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    scrollbar-gutter: stable;
  }
  .commit {
    position: relative;
    padding-left: 20px;
  }
  .commit::before {
    content: '';
    position: absolute;
    left: 5px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--border);
  }
  .commit:last-child::before {
    bottom: auto;
    height: 16px;
  }
  .commit::after {
    content: '';
    position: absolute;
    left: 2px;
    top: 11px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--surface-3);
    border: 1px solid var(--border-strong);
  }
  .commit.open::after {
    background: var(--accent);
    border-color: var(--accent);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .commit-head {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    text-align: left;
    color: var(--text-muted);
  }
  .commit-head:hover {
    background: var(--hover);
    color: var(--text);
  }
  .title {
    flex: 1;
    min-width: 0;
    font-size: 0.82rem;
    color: var(--text);
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .stats {
    display: inline-flex;
    gap: 6px;
    font-size: 0.72rem;
    white-space: nowrap;
  }
  .stats b {
    color: var(--success);
    font-weight: 500;
  }
  .stats i {
    color: var(--error);
    font-style: normal;
  }
  .meta {
    font-size: 0.7rem;
    color: var(--text-faint);
    white-space: nowrap;
  }
  .files {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 2px 0 8px 6px;
    border-left: 1px solid var(--border);
    margin-left: 8px;
  }
  .file-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 4px;
    border-radius: var(--radius-sm);
  }
  .file-row:hover {
    background: var(--hover);
  }
  .file-name {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    flex: 1;
    min-width: 0;
    padding: 4px 4px;
    text-align: left;
    font-family: var(--mono);
    font-size: 0.74rem;
    color: var(--text-muted);
    white-space: normal;
    overflow-wrap: anywhere;
    line-height: 1.4;
  }
  .file-name:hover {
    color: var(--text);
  }
  .file-icon {
    margin-top: 2px;
    flex-shrink: 0;
  }
  .add {
    color: var(--success);
    font-size: 0.72rem;
    white-space: nowrap;
  }
  .del {
    color: var(--error);
    font-size: 0.72rem;
    white-space: nowrap;
  }
  .file-body {
    padding: 4px 4px 8px;
    --diff-max: 320px;
  }
  .mini {
    height: 26px;
    min-width: 26px;
    padding: 0;
  }
</style>
