<script lang="ts">
  import { matchesPreset, wallpapers, type WallpaperPreset } from '../wallpapers'
  import { ui } from '../stores/ui.svelte'
  import Icon from './Icon.svelte'

  let {}: Record<string, never> = $props()

  const active = $derived((preset: WallpaperPreset) => matchesPreset(preset, ui.theme))

  function previewStyle(preset: WallpaperPreset): string {
    const p = preset.patch
    const image = p.kind === 'image' ? `--bg-image:url("${p.imageUrl}")` : '--bg-image:none'
    return `--bg-1:${p.color1};--bg-2:${p.color2};--bg-3:${p.color3};--bg-dim:${p.dim ?? ui.theme.dim};${image}`
  }

  function apply(preset: WallpaperPreset): void {
    ui.updateTheme(preset.patch)
  }
</script>

<div class="picker">
  {#each wallpapers as preset (preset.id)}
    <button
      class="card"
      class:active={active(preset)}
      title={preset.name}
      aria-pressed={active(preset)}
      onclick={() => apply(preset)}
    >
      <span class="prev" data-bg={preset.patch.kind} style={previewStyle(preset)}>
        <span class="app-bg"></span>
        {#if active(preset)}
          <span class="tick"><Icon name="check" size={12} /></span>
        {/if}
      </span>
      <span class="name">{preset.name}</span>
    </button>
  {/each}
</div>

<style>
  .picker {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 96px;
    padding: 0;
    color: var(--text-muted);
    font-size: 0.72rem;
  }
  .card:hover {
    color: var(--text);
  }
  .card.active .prev {
    box-shadow: 0 0 0 2px var(--accent);
  }
  .prev {
    position: relative;
    display: block;
    width: 96px;
    height: 56px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-strong);
    overflow: hidden;
  }
  .prev .app-bg {
    position: absolute;
    inset: 0;
    background-color: var(--bg-1);
    animation: none !important;
    transform: none;
    filter: none;
  }
  .tick {
    position: absolute;
    top: 5px;
    right: 5px;
    width: 18px;
    height: 18px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--accent);
    color: #08111f;
  }
</style>