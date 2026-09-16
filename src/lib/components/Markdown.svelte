<script lang="ts">
  import { highlightWithin, renderMarkdown, whenVisible } from '../markdown'

  let { text = '' }: { text?: string } = $props()

  let element = $state<HTMLDivElement | undefined>()
  let visible = $state(false)
  const html = $derived(visible ? renderMarkdown(text) : '')

  $effect(() => {
    if (visible || !element) return
    if (typeof IntersectionObserver === 'undefined') {
      visible = true
      return
    }
    return whenVisible(element, () => {
      visible = true
    })
  })

  $effect(() => {
    if (!element || !visible) return
    void html
    highlightWithin(element)
  })
</script>

<div class="md" bind:this={element}>
  {#if visible}
    {@html html}
  {:else}
    <div class="md-raw">{text}</div>
  {/if}
</div>

<style>
  .md-raw {
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
