<script lang="ts">
  import type { ToolPart } from '@opencode-ai/sdk/client'
  import Icon from './Icon.svelte'
  import DiffBlock from './DiffBlock.svelte'

  let { part }: { part: ToolPart } = $props()

  const toolState = $derived(part.state)
  const input = $derived(record(toolState.input))

  let open = $state(false)

  function record(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  }

  function str(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined
  }

  function pretty(value: unknown): string {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }

  const filePath = $derived(str(input.filePath) ?? str(input.path) ?? str(input.file))
  const oldString = $derived(str(input.oldString))
  const newString = $derived(str(input.newString))
  const content = $derived(str(input.content))

  const isDiff = $derived(part.tool === 'edit' && oldString !== undefined && newString !== undefined)
  const isWrite = $derived(part.tool === 'write' && content !== undefined)

  const duration = $derived.by(() => {
    const current = toolState
    if (current.status === 'pending') return ''
    const start = current.time.start
    const ms = current.status === 'running' ? Date.now() - start : current.time.end - start
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  })

  const otherInput = $derived.by(() => {
    const copy = { ...input }
    delete copy.filePath
    delete copy.path
    delete copy.file
    delete copy.oldString
    delete copy.newString
    delete copy.content
    if (isDiff || isWrite) delete copy.replaceAll
    return copy
  })

  const hasOtherInput = $derived(Object.keys(otherInput).length > 0)
  const running = $derived(toolState.status === 'running' || toolState.status === 'pending')
  const errored = $derived(toolState.status === 'error')
  const done = $derived(toolState.status === 'completed')

  const title = $derived.by(() => {
    if (toolState.status === 'running' || toolState.status === 'completed') {
      return toolState.title || part.tool
    }
    return part.tool
  })
</script>

<div class="tool" class:errored>
  <button class="tool-head" onclick={() => (open = !open)}>
    <span class="status">
      {#if running}
        <Icon name="loader" size={14} class="spin" />
      {:else if done}
        <Icon name="check" size={14} />
      {:else}
        <Icon name="alert-triangle" size={14} />
      {/if}
    </span>
    <span class="tool-name">{part.tool}</span>
    <span class="tool-title">{title}</span>
    {#if filePath}
      <span class="path">{filePath}</span>
    {/if}
    <span class="spacer"></span>
    {#if duration}
      <span class="duration">{duration}</span>
    {/if}
    <Icon name={open ? 'chevron-down' : 'chevron-right'} size={14} />
  </button>

  <div class="tool-body">
    {#if isDiff}
      <DiffBlock before={oldString ?? ''} after={newString ?? ''} fileName={filePath ?? 'file'} />
    {:else if isWrite}
      <pre class="code">{content}</pre>
    {/if}

    {#if open}
      {#if hasOtherInput}
        <div class="section">
          <div class="section-label">input</div>
          <pre class="code">{pretty(otherInput)}</pre>
        </div>
      {/if}
      {#if toolState.status === 'completed'}
        <div class="section">
          <div class="section-label">output</div>
          <pre class="code">{toolState.output || '(empty)'}</pre>
        </div>
      {:else if toolState.status === 'error'}
        <div class="section error">
          <div class="section-label">error</div>
          <pre class="code">{toolState.error}</pre>
        </div>
      {:else if toolState.status === 'running'}
        <div class="section">
          <div class="section-label">running…</div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .tool {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface-2);
    overflow: hidden;
  }
  .tool.errored {
    border-color: color-mix(in srgb, var(--error) 40%, transparent);
  }
  .tool-head {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 10px;
    font-size: 0.8rem;
    text-align: left;
    color: var(--text-muted);
  }
  .tool-head:hover {
    background: var(--hover);
  }
  .status {
    display: inline-flex;
    color: var(--text-faint);
  }
  .tool.errored .status {
    color: var(--error);
  }
  .tool-name {
    font-family: var(--mono);
    font-size: 0.76rem;
    color: var(--accent);
    font-weight: 600;
  }
  .tool-title {
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 26ch;
  }
  .path {
    font-family: var(--mono);
    font-size: 0.72rem;
    color: var(--text-faint);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .spacer {
    flex: 1;
  }
  .duration {
    font-size: 0.72rem;
    color: var(--text-faint);
  }
  .tool-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 10px 10px;
  }
  .tool-body:empty {
    padding: 0;
  }
  .section-label {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-faint);
    margin-bottom: 4px;
  }
  .section.error .section-label {
    color: var(--error);
  }
  .code {
    margin: 0;
    padding: 8px 10px;
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: var(--mono);
    font-size: 0.76rem;
    line-height: 1.5;
    overflow: auto;
    max-height: 300px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .section.error .code {
    color: var(--error);
  }
</style>
