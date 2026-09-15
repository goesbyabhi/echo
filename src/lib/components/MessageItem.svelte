<script lang="ts">
  import type { MessageEntry } from '../stores/chat.svelte'
  import { chat } from '../stores/chat.svelte'
  import { clockTime, formatCost, formatTokens } from '../format'
  import Icon from './Icon.svelte'
  import PartView from './PartView.svelte'

  let { entry, busy = false }: { entry: MessageEntry; busy?: boolean } = $props()

  const info = $derived(entry.info)
  const user = $derived(info.role === 'user' ? info : undefined)
  const assistant = $derived(info.role === 'assistant' ? info : undefined)

  const visibleParts = $derived(
    entry.parts.filter((part) => part.type !== 'step-start' && part.type !== 'snapshot'),
  )
  const hasContent = $derived(
    visibleParts.some((part) => part.type !== 'step-finish' && part.type !== 'patch'),
  )
  const pending = $derived(Boolean(assistant && !assistant.time.completed && busy))

  const errorText = $derived.by(() => {
    if (!assistant?.error) return ''
    const data = assistant.error.data as Record<string, unknown>
    return typeof data.message === 'string' ? data.message : assistant.error.name
  })

  function copyText(): void {
    const text = visibleParts
      .filter((part) => part.type === 'text')
      .map((part) => (part.type === 'text' ? part.text : ''))
      .join('\n\n')
    void navigator.clipboard.writeText(text)
  }
</script>

<article class="message" class:user={Boolean(user)} class:assistant={Boolean(assistant)}>
  <div class="avatar">
    {#if user}
      <Icon name="message" size={15} />
    {:else}
      <Icon name="sparkles" size={15} />
    {/if}
  </div>

  <div class="body">
    <header class="head">
      <span class="who">{user ? 'You' : assistant?.modelID ?? 'Assistant'}</span>
      {#if user}
        <span class="meta">{user.agent}</span>
      {/if}
      <span class="meta">{clockTime(info.time.created)}</span>
      <span class="spacer"></span>
      <button class="ghost action" title="Copy" onclick={copyText}>
        <Icon name="copy" size={13} />
      </button>
      {#if user}
        <button
          class="ghost action"
          title="Revert to before this message"
          onclick={() => user && chat.revert(user.sessionID, user.id)}
        >
          <Icon name="undo" size={13} />
        </button>
      {/if}
    </header>

    <div class="content">
      {#each visibleParts as part (part.id)}
        <PartView {part} />
      {/each}

      {#if pending && !hasContent}
        <div class="thinking">
          <Icon name="loader" size={14} class="spin" />
          <span>Thinking…</span>
        </div>
      {/if}

      {#if errorText}
        <div class="error">
          <Icon name="alert-triangle" size={14} />
          <span>{errorText}</span>
        </div>
      {/if}
    </div>

    {#if assistant && assistant.time.completed}
      <footer class="foot">
        <span class="chip">{formatTokens(assistant.tokens.input)} in</span>
        <span class="chip">{formatTokens(assistant.tokens.output)} out</span>
        {#if assistant.tokens.reasoning}
          <span class="chip">{formatTokens(assistant.tokens.reasoning)} reasoning</span>
        {/if}
        {#if assistant.cost}
          <span class="chip">{formatCost(assistant.cost)}</span>
        {/if}
      </footer>
    {/if}
  </div>
</article>

<style>
  .message {
    display: grid;
    grid-template-columns: 30px 1fr;
    gap: 10px;
    padding: 4px 0;
  }
  .avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: rgb(255 255 255 / 0.05);
    color: var(--text-muted);
    margin-top: 2px;
  }
  .message.assistant .avatar {
    color: var(--accent);
    border-color: color-mix(in srgb, var(--accent) 35%, transparent);
    background: color-mix(in srgb, var(--accent) 14%, transparent);
  }
  .body {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.76rem;
    color: var(--text-faint);
  }
  .who {
    color: var(--text);
    font-weight: 600;
    font-size: 0.82rem;
  }
  .meta {
    white-space: nowrap;
  }
  .spacer {
    flex: 1;
  }
  .action {
    height: 24px;
    min-width: 24px;
    padding: 0;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
  .message:hover .action {
    opacity: 1;
  }
  .content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .message.user .content {
    background: rgb(255 255 255 / 0.045);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 10px 12px;
  }
  .thinking {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-faint);
    font-size: 0.85rem;
  }
  .error {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid color-mix(in srgb, var(--error) 35%, transparent);
    background: color-mix(in srgb, var(--error) 10%, transparent);
    color: var(--error);
    font-size: 0.82rem;
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
</style>
