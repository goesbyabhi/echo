<script lang="ts">
  let { size = 18, class: className = '' }: { size?: number; class?: string } = $props()
</script>

<svg
  class={className}
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  aria-hidden="true"
>
  <circle cx="6.4" cy="12" r="2.05" fill="currentColor" />
  <path
    d="M11.3 7.3a6.3 6.3 0 0 1 0 9.4"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
  />
  <path
    d="M15.6 4.4a10.6 10.6 0 0 1 0 15.2"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    opacity="0.5"
  />
</svg>
