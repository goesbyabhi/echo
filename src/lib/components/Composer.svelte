<script lang="ts">
  import { chat } from '../stores/chat.svelte'
  import { files } from '../stores/files.svelte'
  import { models } from '../stores/models.svelte'
  import { sessions } from '../stores/sessions.svelte'
  import { status } from '../stores/status.svelte'
  import Icon from './Icon.svelte'
  import ModelPicker from './ModelPicker.svelte'

  let { sessionID }: { sessionID: string } = $props()

  const draft = $derived(chat.draft(sessionID))
  const busy = $derived(sessions.status(sessionID)?.type === 'busy')
  let textarea = $state<HTMLTextAreaElement | undefined>()
  let sending = $state(false)

  const cwd = $derived(status.path?.directory ?? status.project?.worktree ?? '')
  const cwdLabel = $derived(cwd ? cwd.split(/[\\/]/).filter(Boolean).pop() ?? cwd : 'workspace')

  /* ---- slash commands ---- */
  const slashQuery = $derived.by(() => {
    const match = /^\/([^\s]*)$/.exec(draft)
    return match ? match[1] : null
  })
  const slashItems = $derived(
    slashQuery === null
      ? []
      : models.commands
          .filter((command) => command.name.toLowerCase().startsWith(slashQuery.toLowerCase()))
          .slice(0, 8),
  )
  let slashIndex = $state(0)
  $effect(() => {
    void slashQuery
    slashIndex = 0
  })

  /* ---- @ file mentions ---- */
  let mentionStart = $state(-1)
  let mentionQuery = $state('')
  let mentionIndex = $state(0)
  let searchTimer: ReturnType<typeof setTimeout> | null = null

  const mentionOpen = $derived(mentionStart >= 0)
  const mentionItems = $derived.by(() => {
    if (mentionStart < 0) return [] as string[]
    if (mentionQuery) return files.results.slice(0, 8)
    return files.nodes
      .filter((node) => node.type === 'file')
      .slice(0, 8)
      .map((node) => node.path)
  })

  function refreshMention(): void {
    if (!textarea) return
    const value = textarea.value
    const caret = textarea.selectionStart ?? value.length
    const before = value.slice(0, caret)
    const at = before.lastIndexOf('@')
    if (at === -1) {
      mentionStart = -1
      return
    }
    const between = before.slice(at + 1)
    const boundary = at === 0 || /\s/.test(before[at - 1] ?? '')
    if (!boundary || /\s/.test(between)) {
      mentionStart = -1
      return
    }
    const changed = at !== mentionStart || between !== mentionQuery
    mentionStart = at
    mentionQuery = between
    if (changed) {
      mentionIndex = 0
      if (searchTimer) clearTimeout(searchTimer)
      if (between.trim()) searchTimer = setTimeout(() => void files.search(between), 140)
      else void files.search('')
    }
  }

  function insertMention(path: string): void {
    if (!textarea) return
    const start = mentionStart
    const value = textarea.value
    const caret = textarea.selectionStart ?? value.length
    const next = value.slice(0, start) + '@' + path + ' ' + value.slice(caret)
    const pos = start + path.length + 2
    mentionStart = -1
    chat.setDraft(sessionID, next)
    queueMicrotask(() => {
      if (!textarea) return
      textarea.focus()
      textarea.setSelectionRange(pos, pos)
    })
  }

  function insertCommand(name: string): void {
    chat.setDraft(sessionID, `/${name} `)
    textarea?.focus()
  }

  function openPicker(symbol: string): void {
    if (!textarea) return
    const current = textarea.value
    const base = current && !current.endsWith(' ') ? current + ' ' : current
    chat.setDraft(sessionID, `${base}${symbol}`)
    queueMicrotask(() => {
      if (!textarea) return
      textarea.focus()
      const size = textarea.value.length
      textarea.setSelectionRange(size, size)
      if (symbol === '@') refreshMention()
    })
  }

  $effect(() => {
    void draft
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 260)}px`
  })

  async function send(): Promise<void> {
    const value = draft.trim()
    if (!value || sending) return
    sending = true
    let id = sessionID
    if (!id) {
      const created = await sessions.create()
      if (!created) {
        sending = false
        return
      }
      id = created.id
    }
    const ok = await chat.send(id, value)
    sending = false
    if (ok) {
      chat.setDraft(sessionID, '')
      mentionStart = -1
      textarea?.focus()
    }
  }

  function onKeydown(event: KeyboardEvent): void {
    if (mentionOpen && mentionItems.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        mentionIndex = (mentionIndex + 1) % mentionItems.length
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        mentionIndex = (mentionIndex - 1 + mentionItems.length) % mentionItems.length
        return
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        insertMention(mentionItems[mentionIndex])
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        mentionStart = -1
        return
      }
    }

    if (slashItems.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        slashIndex = (slashIndex + 1) % slashItems.length
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        slashIndex = (slashIndex - 1 + slashItems.length) % slashItems.length
        return
      }
      if (event.key === 'Tab' || event.key === 'Enter') {
        event.preventDefault()
        insertCommand(slashItems[slashIndex].name)
        return
      }
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void send()
    }
  }
</script>

<div class="composer">
  <div class="meta">
    <Icon name="folder" size={13} />
    <span class="path">{cwdLabel}</span>
    {#if status.vcs?.branch}
      <span class="meta-sep"></span>
      <span class="branch"><Icon name="git-branch" size={12} />{status.vcs.branch}</span>
    {/if}
  </div>

  {#if mentionOpen && mentionItems.length > 0}
    <div class="pop">
      <div class="pop-head">Files</div>
      {#each mentionItems as item, i (item)}
        <button
          class="pop-row"
          class:active={i === mentionIndex}
          onclick={() => insertMention(item)}
          onmouseenter={() => (mentionIndex = i)}
        >
          <Icon name="file" size={14} />
          <span class="pop-path">{item}</span>
        </button>
      {/each}
    </div>
  {:else if slashItems.length > 0}
    <div class="pop">
      <div class="pop-head">Commands</div>
      {#each slashItems as command, i (command.name)}
        <button
          class="pop-row"
          class:active={i === slashIndex}
          onclick={() => insertCommand(command.name)}
          onmouseenter={() => (slashIndex = i)}
        >
          <span class="pop-name">/{command.name}</span>
          {#if command.description}
            <span class="pop-desc">{command.description}</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}

  <textarea
    bind:this={textarea}
    value={draft}
    placeholder="Ask anything. / for commands, @ for context"
    rows="1"
    oninput={(event) => {
      chat.setDraft(sessionID, (event.currentTarget as HTMLTextAreaElement).value)
      refreshMention()
    }}
    onkeyup={() => refreshMention()}
    onclick={() => refreshMention()}
    onkeydown={onKeydown}
  ></textarea>

  <div class="toolbar">
    <button class="tool" title="Attach a file" onclick={() => openPicker('@')}>
      <Icon name="plus" size={16} />
    </button>
    <button class="hint" onclick={() => openPicker('/')}>
      <Icon name="slash" size={11} /> commands
    </button>
    <button class="hint" onclick={() => openPicker('@')}>
      <Icon name="at-sign" size={11} /> files
    </button>
    <span class="spacer"></span>
    <ModelPicker />
    {#if busy}
      <button class="stop" title="Stop" onclick={() => sessions.abort(sessionID)}>
        <Icon name="stop" size={12} />
      </button>
    {:else}
      <button
        class="send"
        title="Send"
        disabled={!draft.trim() || sending}
        onclick={send}
        aria-label="Send"
      >
        {#if sending}
          <Icon name="loader" size={14} class="spin" />
        {:else}
          <Icon name="arrow-up" size={15} />
        {/if}
      </button>
    {/if}
  </div>
</div>

<style>
  .composer {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 14px 10px;
    background: rgb(var(--surface-rgb) / 0.96);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--text-faint);
    font-size: 0.76rem;
    min-width: 0;
  }
  .path {
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .meta-sep {
    width: 1px;
    height: 12px;
    background: var(--border-strong);
  }
  .branch {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--text-muted);
    white-space: nowrap;
  }
  textarea {
    width: 100%;
    min-height: 52px;
    max-height: 260px;
    resize: none;
    background: none;
    border: none;
    outline: none;
    padding: 0;
    font-size: 0.92rem;
    line-height: 1.6;
    color: var(--text);
  }
  textarea::placeholder {
    color: var(--text-faint);
  }
  .toolbar {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .tool {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    border: 1px solid var(--border);
    color: var(--text-muted);
    transition: background 0.16s ease, color 0.16s ease;
  }
  .tool:hover {
    background: var(--hover);
    color: var(--text);
  }
  .hint {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
    height: 24px;
    border-radius: 999px;
    background: rgb(255 255 255 / 0.04);
    color: var(--text-faint);
    font-size: 0.72rem;
    transition: background 0.16s ease, color 0.16s ease;
  }
  .hint:hover {
    background: var(--hover);
    color: var(--text-muted);
  }
  .spacer {
    flex: 1;
  }
  .send {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 999px;
    background: var(--accent);
    color: #ffffff;
    transition: background 0.16s ease, opacity 0.16s ease, transform 0.1s ease;
  }
  .send:hover:not(:disabled) {
    background: color-mix(in srgb, var(--accent) 88%, #ffffff);
  }
  .send:active:not(:disabled) {
    transform: scale(0.94);
  }
  .send:disabled {
    background: rgb(255 255 255 / 0.1);
    color: var(--text-faint);
    cursor: not-allowed;
  }
  .stop {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--error) 35%, transparent);
    background: var(--error-bg);
    color: var(--error);
  }
  .pop {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface-2);
    overflow: hidden;
    animation: pop-in 0.16s ease both;
  }
  .pop-head {
    padding: 6px 10px 4px;
    font-size: 0.66rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-faint);
  }
  .pop-row {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 6px 10px;
    text-align: left;
    font-size: 0.82rem;
    color: var(--text-muted);
  }
  .pop-row.active {
    background: var(--hover-strong);
    color: var(--text);
  }
  .pop-row .pop-name {
    font-family: var(--mono);
    color: var(--accent);
  }
  .pop-row .pop-path {
    font-family: var(--mono);
    font-size: 0.78rem;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pop-row .pop-desc {
    font-size: 0.74rem;
    color: var(--text-faint);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
