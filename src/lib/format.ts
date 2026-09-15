export function relativeTime(timestamp: number | undefined): string {
  if (!timestamp) return ''
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 0) return 'just now'
  const seconds = Math.floor(diff / 1000)
  if (seconds < 45) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export function clockTime(timestamp: number | undefined): string {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatCost(cost: number | undefined): string {
  if (!cost) return '$0.00'
  if (cost < 0.01) return `$${cost.toFixed(4)}`
  return `$${cost.toFixed(2)}`
}

export function formatTokens(count: number | undefined): string {
  if (!count) return '0'
  if (count < 1000) return String(count)
  if (count < 1_000_000) return `${(count / 1000).toFixed(1)}k`
  return `${(count / 1_000_000).toFixed(2)}M`
}

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value
  return `${value.slice(0, Math.max(0, max - 1))}…`
}

export function fileIcon(node: { type: string; name: string }): string {
  if (node.type === 'directory') return 'folder'
  const ext = node.name.includes('.') ? node.name.split('.').pop()!.toLowerCase() : ''
  if (['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'svelte', 'vue'].includes(ext)) return 'code'
  if (['json', 'yaml', 'yml', 'toml', 'ini', 'env'].includes(ext)) return 'settings'
  if (['md', 'mdx', 'txt', 'rst'].includes(ext)) return 'doc'
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) return 'image'
  if (['css', 'scss', 'sass', 'less'].includes(ext)) return 'palette'
  if (['sh', 'bash', 'ps1', 'zsh', 'fish'].includes(ext)) return 'terminal'
  return 'file'
}

export function languageFromPath(path: string | undefined): string {
  if (!path) return 'plaintext'
  const ext = path.includes('.') ? path.split('.').pop()!.toLowerCase() : ''
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    svelte: 'xml',
    json: 'json',
    html: 'xml',
    css: 'css',
    scss: 'scss',
    md: 'markdown',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    c: 'c',
    h: 'c',
    cpp: 'cpp',
    cs: 'csharp',
    php: 'php',
    sh: 'bash',
    bash: 'bash',
    yml: 'yaml',
    yaml: 'yaml',
    toml: 'ini',
    sql: 'sql',
    xml: 'xml',
    swift: 'swift',
    kt: 'kotlin',
  }
  return map[ext] ?? 'plaintext'
}
