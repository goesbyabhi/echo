<script lang="ts">
  import { highlightWithin } from '../markdown'

  let {
    code,
    language = 'plaintext',
    maxHeight = 460,
  }: { code: string; language?: string; maxHeight?: number } = $props()

  let element = $state<HTMLElement | undefined>()
  let copied = $state(false)

  $effect(() => {
    void code
    if (element) highlightWithin(element)
  })

  async function copy(): Promise<void> {
    await navigator.clipboard.writeText(code)
    copied = true
    setTimeout(() => (copied = false), 1400)
  }
</script>

<div class="wrap">
  <button class="copy ghost" onclick={copy}>
    {copied ? 'Copied' : 'Copy'}
  </button>
  <pre bind:this={element} style="max-height:{maxHeight}px"><code class="language-{language}">{code}</code></pre>
</div>

<style>
  .wrap {
    position: relative;
  }
  .copy {
    position: absolute;
    top: 8px;
    right: 8px;
    height: 26px;
    padding: 0 9px;
    font-size: 0.72rem;
    background: rgb(var(--surface-3-rgb) / 0.9);
    border: 1px solid var(--border);
    z-index: 2;
  }
  pre {
    margin: 0;
    padding: 12px 14px;
    background: rgb(6 8 18 / 0.62);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: auto;
    font-family: var(--mono);
    font-size: 0.78rem;
    line-height: 1.55;
    white-space: pre;
  }
</style>
