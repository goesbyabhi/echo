<script lang="ts">
  import { untrack } from 'svelte'
  import { chat } from '../stores/chat.svelte'
  import { sessions } from '../stores/sessions.svelte'
  import { status } from '../stores/status.svelte'
  import { ui } from '../stores/ui.svelte'
  import Icon from './Icon.svelte'
  import MessageItem from './MessageItem.svelte'
  import Composer from './Composer.svelte'
  import BrandMark from './BrandMark.svelte'

  const sessionID = $derived(sessions.current)
  const entries = $derived(sessionID ? chat.entries(sessionID) : [])
  const busy = $derived(Boolean(sessionID) && sessions.status(sessionID)?.type === 'busy')
  const loading = $derived(Boolean(sessionID) && chat.loading[sessionID] === true)

  const PAGE = 25
  let historyLimit = $state(PAGE)
  const mayHaveMore = $derived(entries.length >= historyLimit)

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

  function loadOlder(): void {
    const id = sessionID
    if (!id) return
    historyLimit += PAGE
    void chat.load(id, true, historyLimit)
  }

  function reload(): void {
    const id = sessionID
    if (!id) return
    void chat.load(id, true, historyLimit)
  }

  $effect(() => {
    const id = sessionID
    if (!id) return
    historyLimit = PAGE
    untrack(() => {
      void chat.load(id, false, PAGE)
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
      <div class="hero">
        <div class="hero-brand">
          <BrandMark size={30} />
          <h1>echo</h1>
        </div>
        <p>Ask your local opencode server. Use / for commands and @ for files.</p>
        <div class="hero-composer">
          <Composer sessionID="" />
        </div>
      </div>
    </div>
  {:else}
    {@const parent = sessions.currentParent}
    <header class="chat-head">
      <div class="head-inner">
        {#if parent}
          <button
            class="ghost"
            title={`Back to ${parent.title}`}
            onclick={() => sessions.select(parent.id)}
          >
            <Icon name="arrow-left" size={15} />
          </button>
        {/if}
        <div class="title">{sessions.currentSession?.title ?? 'Untitled session'}</div>
        <div class="chips">
          {#if parent}
            <span class="chip" title={parent.title}>sub-agent</span>
          {/if}
          {#if busy}
            <span class="chip warn streaming"><span class="pulse-dot busy"></span> working</span>
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
        <button class="ghost" title="Reload messages" onclick={reload}>
          <Icon name="refresh" size={15} />
        </button>
        <button class="ghost" title="Share session" onclick={share}>
          <Icon name="external" size={15} />
        </button>
      </div>
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

        {#if mayHaveMore}
          <button class="load-older" onclick={loadOlder}>
            <Icon name="arrow-up" size={13} />
            Load earlier messages
          </button>
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
      <div class="composer-inner">
        <Composer {sessionID} />
      </div>
    </div>
  {/if}
</section>

<style>
  .chat {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
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
  .hero {
    width: 100%;
    max-width: 768px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .hero-brand {
    display: flex;
    align-items: center;
    gap: 11px;
    color: var(--text-strong);
  }
  .hero h1 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 600;
    letter-spacing: -0.035em;
    color: var(--text-strong);
    line-height: 1;
  }
  .hero p {
    margin: 0 0 6px;
    color: var(--text-muted);
    font-size: 0.88rem;
    max-width: 46ch;
    text-align: center;
  }
  .hero-composer {
    width: 100%;
  }
  .chat-head {
    padding: 10px 18px;
  }
  .head-inner {
    width: 100%;
    max-width: 768px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 10px;
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
    max-width: 768px;
    margin: 0 auto;
    padding: 16px 20px 26px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    animation: fade-in 0.2s ease;
  }
  .load-older {
    align-self: center;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 13px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: rgb(255 255 255 / 0.04);
    color: var(--text-muted);
    font-size: 0.78rem;
    transition: background 0.16s ease, color 0.16s ease;
  }
  .load-older:hover {
    background: var(--hover-strong);
    color: var(--text);
  }
  .composer-wrap {
    width: 100%;
    padding: 0 18px 18px;
  }
  .composer-inner {
    width: 100%;
    max-width: 768px;
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
