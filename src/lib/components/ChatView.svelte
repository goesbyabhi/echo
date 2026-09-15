<script lang="ts">
  import { untrack } from 'svelte'
  import { chat } from '../stores/chat.svelte'
  import { sessions } from '../stores/sessions.svelte'
  import { status } from '../stores/status.svelte'
  import { ui } from '../stores/ui.svelte'
  import Icon from './Icon.svelte'
  import MessageItem from './MessageItem.svelte'
  import Composer from './Composer.svelte'

  const sessionID = $derived(sessions.current)
  const entries = $derived(sessionID ? chat.entries(sessionID) : [])
  const busy = $derived(Boolean(sessionID) && sessions.status(sessionID)?.type === 'busy')
  const loading = $derived(Boolean(sessionID) && chat.loading[sessionID] === true)

  let scroller = $state<HTMLDivElement | undefined>()
  let pinned = $state(true)

  function scrollToBottom(smooth = false): void {
    if (!scroller) return
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }

  function onScroll(): void {
    if (!scroller) return
    pinned = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 140
  }

  $effect(() => {
    const id = sessionID
    if (!id) return
    untrack(() => {
      void chat.load(id)
      void status.loadTodos(id)
    })
    pinned = true
    queueMicrotask(() => scrollToBottom())
  })

  $effect(() => {
    const count = entries.length
    const last = entries[count - 1]
    const partCount = last?.parts.length ?? 0
    void partCount
    if (pinned) scrollToBottom()
  })

  async function createSession(): Promise<void> {
    await sessions.create()
  }

  function share(): void {
    if (!sessionID) return
    void sessions.share(sessionID).then((url) => {
      if (url) {
        void navigator.clipboard.writeText(url)
        ui.toast('Share link copied to clipboard', 'success')
      }
    })
  }
</script>

<section class="chat">
  {#if !sessionID}
    <div class="welcome">
      <div class="welcome-card panel">
        <Icon name="sparkles" size={26} />
        <h1>opencode web</h1>
        <p>Start a new session to talk to your local opencode server.</p>
        <button class="btn primary" onclick={createSession}>
          <Icon name="plus" size={14} />
          New session
        </button>
      </div>
    </div>
  {:else}
    <header class="chat-head">
      <div class="title">{sessions.currentSession?.title ?? 'Untitled session'}</div>
      <div class="chips">
        {#if busy}
          <span class="chip warn"><span class="pulse-dot busy"></span> working</span>
        {:else}
          <span class="chip ok"><span class="pulse-dot"></span> idle</span>
        {/if}
        {#if sessions.currentSession?.summary}
          <span class="chip">{sessions.currentSession.summary.files} files</span>
          <span class="chip">+{sessions.currentSession.summary.additions}</span>
          <span class="chip">-{sessions.currentSession.summary.deletions}</span>
        {/if}
      </div>
      <span class="spacer"></span>
      <button class="ghost" title="Reload messages" onclick={() => sessionID && chat.reload(sessionID)}>
        <Icon name="refresh" size={15} />
      </button>
      <button class="ghost" title="Share session" onclick={share}>
        <Icon name="external" size={15} />
      </button>
    </header>

    <div class="scroller" bind:this={scroller} onscroll={onScroll}>
      <div class="thread">
        {#if loading && entries.length === 0}
          <div class="empty"><Icon name="loader" size={18} class="spin" /> Loading messages…</div>
        {:else if entries.length === 0}
          <div class="empty">
            <Icon name="message" size={20} />
            No messages yet — say hello to get started.
          </div>
        {/if}

        {#each entries as entry (entry.info.id)}
          <MessageItem {entry} {busy} />
        {/each}
      </div>
    </div>

    {#if !pinned && entries.length > 0}
      <button class="jump" onclick={() => { pinned = true; scrollToBottom(true) }}>
        <Icon name="chevron-down" size={14} />
        Latest
      </button>
    {/if}

    <div class="composer-wrap">
      <Composer {sessionID} />
    </div>
  {/if}
</section>

<style>
  .chat {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    position: relative;
  }
  .welcome {
    flex: 1;
    display: grid;
    place-items: center;
    padding: 24px;
  }
  .welcome-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 40px 48px;
    text-align: center;
    color: var(--accent);
  }
  .welcome-card h1 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--text);
  }
  .welcome-card p {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.9rem;
    max-width: 34ch;
  }
  .chat-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 18px;
    border-bottom: 1px solid var(--border);
  }
  .title {
    font-weight: 600;
    font-size: 0.92rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 42ch;
  }
  .chips {
    display: flex;
    gap: 6px;
    flex-wrap: nowrap;
    overflow: hidden;
  }
  .spacer {
    flex: 1;
  }
  .scroller {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    scroll-behavior: auto;
  }
  .thread {
    max-width: 860px;
    margin: 0 auto;
    padding: 20px 20px 30px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .composer-wrap {
    padding: 0 18px 16px;
  }
  .composer-wrap :global(.composer) {
    max-width: 860px;
    margin: 0 auto;
  }
  .jump {
    position: absolute;
    bottom: 130px;
    left: 50%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    background: rgb(var(--surface-2-rgb) / 0.95);
    color: var(--text-muted);
    font-size: 0.78rem;
    box-shadow: var(--shadow);
    z-index: 5;
  }
  .jump:hover {
    color: var(--text);
  }
  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 60px 20px;
    color: var(--text-faint);
    font-size: 0.86rem;
  }
</style>
