<script lang="ts">
  import { sessions } from '../stores/sessions.svelte'
  import { status } from '../stores/status.svelte'
  import Icon from './Icon.svelte'

  const sessionID = $derived(sessions.current)
  const todos = $derived(sessionID ? (status.todos[sessionID] ?? []) : [])

  const order: Record<string, number> = { in_progress: 0, pending: 1, completed: 2, cancelled: 3 }
  const sorted = $derived(
    [...todos].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9)),
  )
  const done = $derived(todos.filter((todo) => todo.status === 'completed').length)
</script>

<div class="tab">
  <div class="head">
    {#if todos.length > 0}
      <span class="chip">{done}/{todos.length} done</span>
    {/if}
    <span class="spacer"></span>
    <button class="ghost mini" title="Refresh" onclick={() => sessionID && status.loadTodos(sessionID)}>
      <Icon name="refresh" size={14} />
    </button>
  </div>

  <div class="list">
    {#if !sessionID}
      <div class="empty">Select a session</div>
    {:else if todos.length === 0}
      <div class="empty">
        <Icon name="list" size={20} />
        No todos for this session
      </div>
    {/if}

    {#each sorted as todo, index (`${index}-${todo.content}`)}
      <div class="todo {todo.status}">
        <span class="mark">
          {#if todo.status === 'completed'}
            <Icon name="check" size={13} />
          {:else if todo.status === 'in_progress'}
            <Icon name="loader" size={13} class="spin" />
          {:else if todo.status === 'cancelled'}
            <Icon name="x" size={13} />
          {:else}
            <Icon name="circle" size={13} />
          {/if}
        </span>
        <span class="content">{todo.content}</span>
        <span class="priority {todo.priority}">{todo.priority}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .tab {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
  }
  .head {
    display: flex;
    align-items: center;
    padding: 0 12px 8px;
  }
  .spacer {
    flex: 1;
  }
  .list {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 0 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .todo {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface-2);
    font-size: 0.82rem;
  }
  .todo.completed .content {
    color: var(--text-faint);
    text-decoration: line-through;
  }
  .todo.cancelled .content {
    color: var(--text-faint);
  }
  .mark {
    display: inline-flex;
    color: var(--text-faint);
  }
  .todo.in_progress .mark {
    color: var(--accent);
  }
  .todo.completed .mark {
    color: var(--success);
  }
  .content {
    flex: 1;
    min-width: 0;
  }
  .priority {
    font-size: 0.66rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-faint);
  }
  .priority.high {
    color: var(--error);
  }
  .priority.medium {
    color: var(--warning);
  }
  .mini {
    height: 26px;
    min-width: 26px;
    padding: 0;
  }
</style>
