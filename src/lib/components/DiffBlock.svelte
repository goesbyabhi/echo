<script lang="ts">
  import { buildDiff } from '../diff'

  let {
    before = '',
    after = '',
    fileName = 'file',
  }: { before?: string; after?: string; fileName?: string } = $props()

  const LIMIT = 500

  const hunks = $derived(buildDiff(before, after, fileName))
  const additions = $derived(
    hunks.reduce((sum, hunk) => sum + hunk.lines.filter((line) => line.type === 'add').length, 0),
  )
  const deletions = $derived(
    hunks.reduce((sum, hunk) => sum + hunk.lines.filter((line) => line.type === 'remove').length, 0),
  )
  const totalLines = $derived(hunks.reduce((sum, hunk) => sum + hunk.lines.length, 0))

  let expanded = $state(true)
  const visible = $derived(expanded ? hunks : hunks.slice(0, 1))
</script>

<div class="diff">
  <div class="diff-stats">
    <span class="add">+{additions}</span>
    <span class="del">-{deletions}</span>
    {#if totalLines > LIMIT}
      <button class="ghost" style="height:22px;font-size:0.72rem" onclick={() => (expanded = !expanded)}>
        {expanded ? 'Collapse' : 'Show full diff'}
      </button>
    {/if}
  </div>

  {#if totalLines === 0}
    <div class="diff-empty">No changes</div>
  {:else}
    <div class="diff-body">
      {#each visible as hunk, hunkIndex (hunkIndex)}
        <div class="hunk">
          <div class="hunk-header">{hunk.header}</div>
          {#each expanded ? hunk.lines : hunk.lines.slice(0, LIMIT) as line, lineIndex (lineIndex)}
            <div class="line {line.type}">
              <span class="num">{line.oldNumber ?? ''}</span>
              <span class="num">{line.newNumber ?? ''}</span>
              <span class="sign">{line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}</span>
              <span class="code">{line.content}</span>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .diff {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    background: var(--code-bg);
    font-family: var(--mono);
    font-size: 0.76rem;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .diff-stats {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 5px 10px;
    border-bottom: 1px solid var(--border);
    background: var(--surface-2);
    font-size: 0.75rem;
  }
  .diff-stats .add {
    color: var(--success);
  }
  .diff-stats .del {
    color: var(--error);
  }
  .diff-empty {
    padding: 10px;
    color: var(--text-faint);
    font-family: var(--font);
  }
  .diff-body {
    flex: 1;
    min-height: 0;
    max-height: var(--diff-max, 460px);
    overflow: auto;
  }
  .hunk-header {
    padding: 3px 10px;
    color: var(--text-faint);
    font-size: 0.72rem;
    background: var(--hover);
    position: sticky;
    top: 0;
  }
  .line {
    display: grid;
    grid-template-columns: 40px 40px 14px 1fr;
    gap: 0;
    white-space: pre;
    line-height: 1.55;
  }
  .line.add {
    background: color-mix(in srgb, var(--success) 12%, transparent);
  }
  .line.remove {
    background: color-mix(in srgb, var(--error) 12%, transparent);
  }
  .num {
    color: var(--text-faint);
    text-align: right;
    padding-right: 8px;
    user-select: none;
    font-size: 0.72rem;
  }
  .sign {
    color: var(--text-faint);
    text-align: center;
  }
  .code {
    padding-left: 4px;
    overflow-x: visible;
  }
</style>
