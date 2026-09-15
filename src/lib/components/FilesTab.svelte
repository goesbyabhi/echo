<script lang="ts">
  import { files } from '../stores/files.svelte'
  import { languageFromPath } from '../format'
  import Icon from './Icon.svelte'
  import CodeBlock from './CodeBlock.svelte'

  let initialized = $state(false)

  $effect(() => {
    if (initialized) return
    initialized = true
    void files.open(files.cwd)
  })
</script>

<div class="tab">
  {#if files.selected}
    <div class="viewer-head">
      <button class="ghost mini" title="Back" onclick={() => files.closeFile()}>
        <Icon name="arrow-left" size={15} />
      </button>
      <span class="file-path">{files.selected.path}</span>
      <span class="spacer"></span>
      <span class="chip">{files.selected.content.type}</span>
    </div>
    <div class="viewer-body">
      {#if files.selected.content.type === 'text'}
        <CodeBlock
          code={files.selected.content.content}
          language={languageFromPath(files.selected.path)}
          maxHeight={2000}
        />
      {:else}
        <div class="empty">
          <Icon name="image" size={20} />
          Binary file ({files.selected.content.mimeType ?? 'unknown'})
        </div>
      {/if}
    </div>
  {:else}
    <div class="search">
      <Icon name="search" size={14} />
      <input
        placeholder="Search files…"
        value={files.searchQuery}
        oninput={(event) => files.search((event.currentTarget as HTMLInputElement).value)}
      />
    </div>

    {#if files.searchQuery.trim()}
      <div class="crumbs">
        <span class="crumb-label">{files.results.length} results</span>
        <span class="spacer"></span>
        <button class="ghost mini" onclick={() => files.search('')}>
          <Icon name="x" size={13} />
        </button>
      </div>
      <div class="list">
        {#each files.results as path (path)}
          <button class="row" onclick={() => files.openFile(path)}>
            <Icon name="file" size={14} />
            <span class="row-path">{path}</span>
          </button>
        {/each}
        {#if files.results.length === 0 && !files.searching}
          <div class="empty">No files found</div>
        {/if}
      </div>
    {:else}
      <div class="crumbs">
        {#each files.breadcrumbs as crumb, index (crumb.path)}
          {#if index > 0}
            <Icon name="chevron-right" size={12} />
          {/if}
          <button class="crumb" onclick={() => files.open(crumb.path)}>{crumb.name}</button>
        {/each}
        <span class="spacer"></span>
        <button class="ghost mini" title="Refresh" onclick={() => files.open(files.cwd)}>
          <Icon name="refresh" size={13} />
        </button>
      </div>

      <div class="list">
        {#if files.cwd}
          <button class="row" onclick={() => files.open(files.cwd.split('/').slice(0, -1).join('/'))}>
            <Icon name="arrow-left" size={14} />
            <span class="row-path">..</span>
          </button>
        {/if}
        {#each files.nodes as node (node.path)}
          <button
            class="row"
            class:ignored={node.ignored}
            onclick={() => (node.type === 'directory' ? files.open(node.path) : files.openFile(node.path))}
          >
            <Icon name={node.type === 'directory' ? 'folder' : 'file'} size={14} />
            <span class="row-path">{node.name}</span>
            {#if node.type === 'directory'}
              <Icon name="chevron-right" size={13} />
            {/if}
          </button>
        {/each}
        {#if files.loading}
          <div class="empty"><Icon name="loader" size={16} class="spin" /> Loading…</div>
        {:else if files.nodes.length === 0 && files.cwd}
          <div class="empty">Empty directory</div>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  .tab {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
    gap: 8px;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 12px;
    padding: 7px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--input-bg);
    color: var(--text-faint);
  }
  .search input {
    flex: 1;
    min-width: 0;
    background: none;
    border: none;
    outline: none;
    font-size: 0.82rem;
  }
  .crumbs {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 0 12px;
    font-size: 0.76rem;
    color: var(--text-faint);
    overflow-x: auto;
    white-space: nowrap;
  }
  .crumb-label {
    padding: 4px 0;
  }
  .crumb {
    padding: 3px 6px;
    border-radius: 6px;
    color: var(--text-muted);
    font-family: var(--mono);
    font-size: 0.72rem;
  }
  .crumb:hover {
    background: var(--hover-strong);
    color: var(--text);
  }
  .list {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 0 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    text-align: left;
    font-size: 0.82rem;
    color: var(--text-muted);
    min-width: 0;
  }
  .row:hover {
    background: var(--hover-strong);
    color: var(--text);
  }
  .row.ignored {
    opacity: 0.45;
  }
  .row-path {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--mono);
    font-size: 0.78rem;
  }
  .spacer {
    flex: 1;
  }
  .viewer-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
  }
  .file-path {
    font-family: var(--mono);
    font-size: 0.75rem;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .viewer-body {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 0 12px 12px;
  }
  .mini {
    height: 26px;
    min-width: 26px;
    padding: 0;
  }
</style>
