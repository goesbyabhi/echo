<script lang="ts">
  import { chat } from '../stores/chat.svelte'
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

  const slashQuery = $derived.by(() => {
    const match = /^\/([^\s]*)$/.exec(draft)
    return match ? match[1] : null
  })

  const slashMatches = $derived(
    slashQuery === null
      ? []
      : models.commands
          .filter((command) => command.name.toLowerCase().startsWith(slashQuery.toLowerCase()))
          .slice(0, 8),
  )

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
      textarea?.focus()
    }
  }

  function completeCommand(): void {
    if (slashMatches.length === 0) return
    chat.setDraft(sessionID, `/${slashMatches[0].name} `)
    textarea?.focus()
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab' && slashMatches.length > 0) {
      event.preventDefault()
      completeCommand()
      return
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

  {#if slashMatches.length > 0}
    <div class="slash">
      {#each slashMatches as command (command.name)}
        <button
          class="slash-row"
          onclick={() => {
            chat.setDraft(sessionID, `/${command.name} `)
            textarea?.focus()
          }}
        >
          <span class="name">/{command.name}</span>
          {#if command.description}
            <span class="desc">{command.description}</span>
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
    oninput={(event) => chat.setDraft(sessionID, (event.currentTarget as HTMLTextAreaElement).value)}
    onkeydown={onKeydown}
  ></textarea>

  <div class="toolbar">
    <button class="tool" title="Focus input" onclick={() => textarea?.focus()}>
      <Icon name="plus" size={16} />
    </button>
    <span class="kbd-hint"><Icon name="slash" size={11} /> commands</span>
    <span class="kbd-hint"><Icon name="at-sign" size={11} /> files</span>
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
    background: rgb(var(--surface-rgb) / 0.72);
    backdrop-filter: blur(20px) saturate(130%);
    -webkit-backdrop-filter: blur(20px) saturate(130%);
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
  .kbd-hint {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
    height: 24px;
    border-radius: 999px;
    background: rgb(255 255 255 / 0.04);
    color: var(--text-faint);
    font-size: 0.72rem;
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
  .slash {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface-2);
    overflow: hidden;
    margin-bottom: 2px;
  }
  .slash-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 10px;
    text-align: left;
    font-size: 0.82rem;
    color: var(--text-muted);
  }
  .slash-row:hover {
    background: var(--hover);
    color: var(--text);
  }
  .slash-row .name {
    font-family: var(--mono);
    color: var(--accent);
  }
  .slash-row .desc {
    font-size: 0.74rem;
    color: var(--text-faint);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
