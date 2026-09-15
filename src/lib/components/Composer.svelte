<script lang="ts">
  import { chat } from '../stores/chat.svelte'
  import { models } from '../stores/models.svelte'
  import { sessions } from '../stores/sessions.svelte'
  import Icon from './Icon.svelte'
  import ModelPicker from './ModelPicker.svelte'

  let { sessionID }: { sessionID: string } = $props()

  const draft = $derived(chat.draft(sessionID))
  const busy = $derived(sessions.status(sessionID)?.type === 'busy')
  let textarea = $state<HTMLTextAreaElement | undefined>()
  let sending = $state(false)

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
    textarea.style.height = `${Math.min(textarea.scrollHeight, 280)}px`
  })

  async function send(): Promise<void> {
    const value = draft.trim()
    if (!value || sending) return
    sending = true
    const ok = await chat.send(sessionID, value)
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

<div class="composer panel">
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
    placeholder="Ask opencode to build something…  ( / commands · ! shell )"
    rows="1"
    oninput={(event) => chat.setDraft(sessionID, (event.currentTarget as HTMLTextAreaElement).value)}
    onkeydown={onKeydown}
  ></textarea>

  <div class="row">
    <ModelPicker />
    <span class="spacer"></span>
    {#if textarea}
      <span class="hint">Enter to send · Shift+Enter for newline</span>
    {/if}
    {#if busy}
      <button class="btn danger" onclick={() => sessions.abort(sessionID)}>
        <Icon name="stop" size={13} />
        Stop
      </button>
    {/if}
    <button class="btn primary" disabled={!draft.trim() || sending} onclick={send}>
      {#if sending}
        <Icon name="loader" size={14} class="spin" />
      {:else}
        <Icon name="send" size={14} />
      {/if}
      Send
    </button>
  </div>
</div>

<style>
  .composer {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
  }
  textarea {
    width: 100%;
    min-height: 44px;
    max-height: 280px;
    resize: none;
    background: rgb(0 0 0 / 0.28);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 11px 12px;
    outline: none;
    font-size: 0.9rem;
    line-height: 1.55;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  textarea:focus {
    border-color: color-mix(in srgb, var(--accent) 55%, transparent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .spacer {
    flex: 1;
  }
  .hint {
    font-size: 0.72rem;
    color: var(--text-faint);
  }
  .slash {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: rgb(var(--surface-2-rgb) / 0.96);
    overflow: hidden;
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
    background: rgb(255 255 255 / 0.07);
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
