export function plainText(text: string | undefined, max = 160): string {  if (!text) return ''
  const stripped = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return stripped.length > max ? `${stripped.slice(0, max)}…` : stripped
}

type VisibilityCallback = () => void

const visibilityCallbacks = new WeakMap<Element, VisibilityCallback>()
let visibilityObserver: IntersectionObserver | null = null

function ensureVisibilityObserver(): IntersectionObserver {
  if (!visibilityObserver) {
    visibilityObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const callback = visibilityCallbacks.get(entry.target)
          visibilityCallbacks.delete(entry.target)
          visibilityObserver?.unobserve(entry.target)
          callback?.()
        }
      },
      { rootMargin: '600px 0px' },
    )
  }
  return visibilityObserver
}

export function whenVisible(element: Element, callback: VisibilityCallback): () => void {
  visibilityCallbacks.set(element, callback)
  ensureVisibilityObserver().observe(element)
  return () => {
    visibilityCallbacks.delete(element)
    visibilityObserver?.unobserve(element)
  }
}

type Engine = typeof import('./markdown-engine')

let enginePromise: Promise<Engine> | null = null

function loadEngine(): Promise<Engine> {
  if (!enginePromise) enginePromise = import('./markdown-engine')
  return enginePromise
}

export async function renderMarkdown(text: string): Promise<string> {
  if (!text) return ''
  const engine = await loadEngine()
  return engine.renderMarkdown(text)
}

export async function highlightWithin(root: HTMLElement | null | undefined): Promise<void> {
  if (!root) return
  const engine = await loadEngine()
  engine.highlightWithin(root)
}