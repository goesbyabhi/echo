import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/common'
import { marked } from 'marked'

marked.setOptions({
  gfm: true,
  breaks: true,
})

let hooksInstalled = false

function installHooks() {
  if (hooksInstalled) return
  hooksInstalled = true
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
    }
  })
}

export function renderMarkdown(text: string): string {
  if (!text) return ''
  installHooks()
  const html = marked.parse(text, { async: false })
  return DOMPurify.sanitize(html)
}

export function highlightWithin(root: HTMLElement | null | undefined): void {
  if (!root) return
  const blocks = root.querySelectorAll<HTMLElement>('pre code')
  blocks.forEach((block) => {
    if (block.dataset.highlighted === 'yes') return
    try {
      hljs.highlightElement(block)
    } catch {
      block.dataset.highlighted = 'yes'
    }
  })
}

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
