<script lang="ts">
  import { ui } from '../stores/ui.svelte'
  import Icon from './Icon.svelte'

  const icons: Record<string, string> = {
    info: 'info',
    success: 'check',
    warning: 'alert-triangle',
    error: 'alert-triangle',
  }
</script>

<div class="toasts">
  {#each ui.toasts as toast (toast.id)}
    <div class="toast {toast.variant}">
      <span class="icon"><Icon name={icons[toast.variant]} size={15} /></span>
      <div class="text">
        {#if toast.title}
          <strong>{toast.title}</strong>
        {/if}
        <span>{toast.message}</span>
      </div>
      <button class="ghost mini" onclick={() => ui.dismiss(toast.id)}>
        <Icon name="x" size={13} />
      </button>
    </div>
  {/each}
</div>

<style>
  .toasts {
    position: fixed;
    bottom: 18px;
    right: 18px;
    z-index: 200;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 380px;
  }
  .toast {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border-radius: var(--radius);
    border: 1px solid var(--border-strong);
    background: rgb(var(--surface-2-rgb) / 0.96);
    backdrop-filter: blur(20px);
    box-shadow: var(--shadow);
    animation: slide-in 0.2s ease;
    font-size: 0.82rem;
  }
  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }
  .icon {
    display: inline-flex;
    margin-top: 1px;
  }
  .toast.info .icon {
    color: var(--info);
  }
  .toast.success .icon {
    color: var(--success);
  }
  .toast.warning .icon {
    color: var(--warning);
  }
  .toast.error .icon {
    color: var(--error);
  }
  .toast.error {
    border-color: color-mix(in srgb, var(--error) 40%, transparent);
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .text strong {
    font-size: 0.8rem;
  }
  .text span {
    color: var(--text-muted);
    overflow-wrap: anywhere;
  }
  .mini {
    height: 24px;
    min-width: 24px;
    padding: 0;
    flex-shrink: 0;
  }
</style>
