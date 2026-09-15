import type {
  File,
  FormatterStatus,
  LspStatus,
  McpStatus,
  Path,
  Project,
  Todo,
  VcsInfo,
} from '@opencode-ai/sdk/client'
import { connection } from './connection.svelte'

class Status {
  mcp = $state<Record<string, McpStatus>>({})
  lsp = $state<LspStatus[]>([])
  formatters = $state<FormatterStatus[]>([])
  vcs = $state<VcsInfo | null>(null)
  path = $state<Path | null>(null)
  project = $state<Project | null>(null)
  changes = $state<File[]>([])
  todos = $state<Record<string, Todo[]>>({})
  refreshing = $state(false)

  setTodos(sessionID: string, todos: Todo[]): void {
    this.todos = { ...this.todos, [sessionID]: todos }
  }

  async loadTodos(sessionID: string): Promise<void> {
    if (!sessionID) return
    try {
      const result = await connection.client.session.todo({ path: { id: sessionID } })
      if (result.error || !result.data) return
      this.setTodos(sessionID, result.data)
    } catch {
      /* non fatal */
    }
  }

  async refresh(): Promise<void> {
    this.refreshing = true
    const client = connection.client
    const [mcp, lsp, formatters, vcs, path, project, changes] = await Promise.allSettled([
      client.mcp.status(),
      client.lsp.status(),
      client.formatter.status(),
      client.vcs.get(),
      client.path.get(),
      client.project.current(),
      client.file.status(),
    ])
    if (mcp.status === 'fulfilled' && mcp.value.data) this.mcp = mcp.value.data
    if (lsp.status === 'fulfilled' && lsp.value.data) this.lsp = lsp.value.data
    if (formatters.status === 'fulfilled' && formatters.value.data) this.formatters = formatters.value.data
    if (vcs.status === 'fulfilled' && vcs.value.data) this.vcs = vcs.value.data
    if (path.status === 'fulfilled' && path.value.data) this.path = path.value.data
    if (project.status === 'fulfilled' && project.value.data) this.project = project.value.data
    if (changes.status === 'fulfilled' && changes.value.data) this.changes = changes.value.data
    this.refreshing = false
  }
}

export const status = new Status()
