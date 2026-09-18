<script lang="ts">
  import { highlightWithin, renderMarkdown, whenVisible } from '../markdown'

  let { text = '', streaming = false }: { text?: string; streaming?: boolean } = $props()

  let element = $state<HTMLDivElement | undefined>()
  let visible = $state(false)
  let html = $state('')

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
    if (!visible || streaming) return
    const source = text
    if (!source) {
      html = ''
      return
    }
    let cancelled = false
    void renderMarkdown(source).then((rendered) => {
      if (!cancelled) html = rendered
    })
    return () => {
      cancelled = true
    }
  })

  $effect(() => {
    if (!visible || !streaming) return
    const source = text
    if (!source) return
    let cancelled = false
    const timer = setTimeout(() => {
      void renderMarkdown(source).then((rendered) => {
        if (!cancelled && streaming) html = rendered
      })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  })

  $effect(() => {
    if (!element || !visible) return
    void html
    void highlightWithin(element)
  })
</script>

<div class="md" class:streaming bind:this={element}>
  {#if html}
    {@html html}
  {:else if text}
    <div class="md-raw">{text}</div>
  {/if}
</div>

<style>
  .md-raw {
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>