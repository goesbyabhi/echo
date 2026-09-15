<script lang="ts">
  import { highlightWithin, renderMarkdown } from '../markdown'

  let { text = '' }: { text?: string } = $props()

  let element = $state<HTMLDivElement | undefined>()
  const html = $derived(renderMarkdown(text))

  $effect(() => {
    if (!element) return
    void html
    highlightWithin(element)
  })
</script>

<div class="md" bind:this={element}>{@html html}</div>
