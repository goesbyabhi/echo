import type { FileContent, FileNode } from '@opencode-ai/sdk/client'
import { connection } from './connection.svelte'
import { errorMessage } from './models.svelte'
import { ui } from './ui.svelte'

export type OpenFile = {
  path: string
  content: FileContent
}

class Files {
  cwd = $state('')
  nodes = $state<FileNode[]>([])
  loading = $state(false)
  selected = $state<OpenFile | null>(null)
  searchQuery = $state('')
  results = $state<string[]>([])
  searching = $state(false)

  get breadcrumbs(): { name: string; path: string }[] {
    const crumbs = [{ name: 'root', path: '' }]
    let acc = ''
    for (const part of this.cwd.split('/').filter(Boolean)) {
      acc = acc ? `${acc}/${part}` : part
      crumbs.push({ name: part, path: acc })
    }
    return crumbs
  }

  async open(path: string): Promise<void> {
    this.loading = true
    this.cwd = path
    try {
      const result = await connection.client.file.list({ query: { path } })
      if (result.error) throw result.error
      this.nodes = [...(result.data ?? [])].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
    } catch (error) {
      this.nodes = []
      ui.toast(errorMessage(error), 'error', 'Could not read directory')
    } finally {
      this.loading = false
    }
  }

  async openFile(path: string): Promise<void> {
    try {
      const result = await connection.client.file.read({ query: { path } })
      if (result.error || !result.data) throw result.error
      this.selected = { path, content: result.data }
    } catch (error) {
      ui.toast(errorMessage(error), 'error', 'Could not read file')
    }
  }

  closeFile(): void {
    this.selected = null
  }

  async search(query: string): Promise<void> {
    this.searchQuery = query
    if (!query.trim()) {
      this.results = []
      return
    }
    this.searching = true
    try {
      const result = await connection.client.find.files({ query: { query } })
      if (result.error) throw result.error
      this.results = result.data ?? []
    } catch (error) {
      this.results = []
      ui.toast(errorMessage(error), 'error', 'Search failed')
    } finally {
      this.searching = false
    }
  }
}

export const files = new Files()
