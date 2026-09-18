import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import diff from 'highlight.js/lib/languages/diff'
import json from 'highlight.js/lib/languages/json'
import javascript from 'highlight.js/lib/languages/javascript'
import markdown from 'highlight.js/lib/languages/markdown'
import powershell from 'highlight.js/lib/languages/powershell'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import { marked } from 'marked'

marked.setOptions({
  gfm: true,
  breaks: true,
})

const registered: [string, unknown][] = [
  ['bash', bash],
  ['css', css],
  ['diff', diff],
  ['json', json],
  ['javascript', javascript],
  ['js', javascript],
  ['md', markdown],
  ['markdown', markdown],
  ['powershell', powershell],
  ['ps1', powershell],
  ['python', python],
  ['py', python],
  ['sql', sql],
  ['typescript', typescript],
  ['ts', typescript],
  ['xml', xml],
  ['html', xml],
  ['yaml', yaml],
  ['yml', yaml],
]
for (const [name, language] of registered) {
  hljs.registerLanguage(name, language as Parameters<typeof hljs.registerLanguage>[1])
}

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

export function renderMarkdown(text: string): string {
  if (!text) return ''
  const html = marked.parse(text, { async: false })
  return DOMPurify.sanitize(html)
}

export function highlightWithin(root: HTMLElement | null | undefined): void {
  if (!root) return
  const blocks = root.querySelectorAll<HTMLElement>('pre code')
  blocks.forEach((block) => {
    if (block.dataset.highlighted === 'yes') return
    const match = /language-([\w-]+)/.exec(block.className)
    const language = match?.[1]
    if (!language || language === 'plaintext' || !hljs.getLanguage(language)) {
      block.dataset.highlighted = 'yes'
      return
    }
    try {
      hljs.highlightElement(block)
    } catch {
      block.dataset.highlighted = 'yes'
    }
  })
}