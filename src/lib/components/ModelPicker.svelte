<script lang="ts">
  import { models } from '../stores/models.svelte'
  import Icon from './Icon.svelte'

  let open = $state(false)
  let container = $state<HTMLDivElement | undefined>()
  let query = $state('')

  const options = $derived(
    models.modelOptions
      .filter((option) => option.name.toLowerCase().includes(query.trim().toLowerCase()))
      .slice(0, 80),
  )

  $effect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (container && !container.contains(event.target as Node)) open = false
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') open = false
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  })
</script>

<div class="picker" bind:this={container}>
  <button class="trigger" onclick={() => (open = !open)}>
    <Icon name="cpu" size={14} />
    <span class="label">{models.current?.name ?? 'No model'}</span>
    <span class="agent">{models.selectedAgent || 'agent'}</span>
    <Icon name="chevron-down" size={13} />
  </button>

  {#if open}
    <div class="popover">
      <div class="search">
        <Icon name="search" size={14} />
        <input placeholder="Filter models…" bind:value={query} />
      </div>

      <div class="scroll">
        <div class="section-title">Models</div>
        {#if options.length === 0}
          <div class="none">No models available</div>
        {/if}
        {#each options as option (option.providerID + option.modelID)}
          <button
            class="row"
            class:active={models.selected === `${option.providerID}/${option.modelID}`}
            onclick={() => {
              models.setModel(option.providerID, option.modelID)
              open = false
            }}
          >
            <span class="row-name">{option.name}</span>
            {#if models.selected === `${option.providerID}/${option.modelID}`}
              <Icon name="check" size={14} />
            {/if}
          </button>
        {/each}

        <div class="section-title">Agents</div>
        {#each models.primaryAgents as agent (agent.name)}
          <button
            class="row"
            class:active={models.selectedAgent === agent.name}
            onclick={() => {
              models.setAgent(agent.name)
              open = false
            }}
          >
            <span class="row-name">{agent.name}</span>
            {#if agent.description}
              <span class="row-desc">{agent.description}</span>
            {/if}
            {#if models.selectedAgent === agent.name}
              <Icon name="check" size={14} />
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .picker {
    position: relative;
  }
  .trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 8px;
    border-radius: 999px;
    border: 1px solid transparent;
    color: var(--text-muted);
    font-size: 0.8rem;
    max-width: 320px;
    transition: background 0.16s ease, color 0.16s ease;
  }
  .trigger:hover {
    background: var(--hover);
    color: var(--text);
  }
  .trigger:hover {
    background: var(--hover-strong);
    color: var(--text);
  }
  .label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text);
    font-weight: 500;
  }
  .agent {
    font-size: 0.7rem;
    padding: 1px 7px;
    border-radius: 999px;
    background: rgb(255 255 255 / 0.06);
    color: var(--text-muted);
    white-space: nowrap;
  }
  .popover {
    position: absolute;
    bottom: calc(100% + 8px);
    right: 0;
    width: 420px;
    max-width: 88vw;
    max-height: min(56vh, 440px);
    display: flex;
    flex-direction: column;
    background: var(--surface-1);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    z-index: 60;
    overflow: hidden;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
    color: var(--text-faint);
    flex-shrink: 0;
  }
  .search input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: 0.85rem;
  }
  .scroll {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 6px;
  }
  .section-title {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-faint);
    padding: 8px 8px 4px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 8px;
    border-radius: var(--radius-sm);
    text-align: left;
    font-size: 0.82rem;
    color: var(--text-muted);
  }
  .row:hover {
    background: var(--hover-strong);
    color: var(--text);
  }
  .row.active {
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    color: var(--text);
  }
  .row-name {
    flex-shrink: 0;
  }
  .row-desc {
    flex: 1;
    font-size: 0.72rem;
    color: var(--text-faint);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .none {
    padding: 10px;
    color: var(--text-faint);
    font-size: 0.8rem;
  }
</style>
