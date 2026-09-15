<script lang="ts">
  import type { Part } from '@opencode-ai/sdk/client'
  import Icon from './Icon.svelte'
  import Markdown from './Markdown.svelte'
  import ToolCall from './ToolCall.svelte'

  let { part }: { part: Part } = $props()

  let reasoningOpen = $state(false)
</script>

{#if part.type === 'text'}
  {#if part.synthetic}
    <div class="notice">{part.text}</div>
  {:else}
    <Markdown text={part.text} />
  {/if}
{:else if part.type === 'reasoning'}
  <div class="reasoning">
    <button class="reasoning-head" onclick={() => (reasoningOpen = !reasoningOpen)}>
      <Icon name="brain" size={14} />
      <span>Reasoning</span>
      <Icon name={reasoningOpen ? 'chevron-down' : 'chevron-right'} size={14} />
    </button>
    {#if reasoningOpen}
      <div class="reasoning-body">
        <Markdown text={part.text} />
      </div>
    {/if}
  </div>
{:else if part.type === 'tool'}
  <ToolCall {part} />
{:else if part.type === 'file'}
  <div class="file-part">
    <Icon name="file" size={16} />
    <span class="name">{part.filename ?? part.mime}</span>
    {#if part.mime.startsWith('image/')}
      <img src={part.url} alt={part.filename ?? 'image'} />
    {/if}
  </div>
{:else if part.type === 'patch'}
  <div class="patch-part">
    <Icon name="file-diff" size={14} />
    <span>{part.files.length} file{part.files.length === 1 ? '' : 's'} changed</span>
    <span class="files">{part.files.join(', ')}</span>
  </div>
{:else if part.type === 'agent'}
  <div class="agent-part">
    <Icon name="sparkles" size={13} />
    <span>Agent: {part.name}</span>
  </div>
{:else if part.type === 'subtask'}
  <div class="subtask">
    <div class="subtask-head">
      <Icon name="git-branch" size={14} />
      <strong>{part.description}</strong>
      <span class="chip">{part.agent}</span>
    </div>
    <pre>{part.prompt}</pre>
  </div>
{:else if part.type === 'retry'}
  <div class="retry">
    <Icon name="refresh" size={14} class="spin" />
    <span>Retry attempt {part.attempt}: {part.error.data.message}</span>
  </div>
{:else if part.type === 'compaction'}
  <div class="divider"><span>{part.auto ? 'Auto-compacted' : 'Compacted'}</span></div>
{:else if part.type === 'step-finish'}
  <div class="divider"><span>step finished · {part.reason}</span></div>
{/if}

<style>
  .notice {
    font-size: 0.82rem;
    color: var(--text-faint);
    font-style: italic;
  }
  .reasoning {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: rgb(255 255 255 / 0.02);
    overflow: hidden;
  }
  .reasoning-head {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    padding: 6px 10px;
    font-size: 0.78rem;
    color: var(--text-muted);
  }
  .reasoning-head:hover {
    background: rgb(255 255 255 / 0.05);
  }
  .reasoning-body {
    padding: 0 12px 10px;
    color: var(--text-muted);
    border-top: 1px solid var(--border);
  }
  .file-part {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: rgb(255 255 255 / 0.03);
    font-size: 0.82rem;
  }
  .file-part .name {
    font-family: var(--mono);
    color: var(--text-muted);
  }
  .file-part img {
    max-height: 260px;
    max-width: 100%;
    border-radius: var(--radius-sm);
    align-self: flex-start;
  }
  .patch-part,
  .agent-part {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    color: var(--text-muted);
  }
  .patch-part .files {
    font-family: var(--mono);
    font-size: 0.74rem;
    color: var(--text-faint);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .subtask {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 10px;
    background: rgb(255 255 255 / 0.03);
  }
  .subtask-head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    margin-bottom: 6px;
  }
  .subtask pre {
    margin: 0;
    font-family: var(--mono);
    font-size: 0.75rem;
    color: var(--text-muted);
    white-space: pre-wrap;
    max-height: 200px;
    overflow: auto;
  }
  .retry {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    color: var(--warning);
  }
  .divider {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-faint);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 4px 0;
  }
  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }
</style>
