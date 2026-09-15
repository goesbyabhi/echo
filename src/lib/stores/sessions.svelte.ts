import type { Session, SessionStatus } from '@opencode-ai/sdk/client'
import { connection } from './connection.svelte'
import { ui } from './ui.svelte'

const SESSION_KEY = 'opencode-ui:session'

function message(error: unknown): string {
  if (!error) return 'Unknown error'
  if (typeof error === 'string') return error
  if (typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message)
  return JSON.stringify(error)
}

class Sessions {
  list = $state<Session[]>([])
  current = $state('')
  statuses = $state<Record<string, SessionStatus>>({})
  loading = $state(false)
  private bootstrapped = false

  get roots(): Session[] {
    return this.list.filter((session) => !session.parentID)
  }

  children(parentID: string): Session[] {
    return this.list
      .filter((session) => session.parentID === parentID)
      .sort((a, b) => a.time.created - b.time.created)
  }

  get currentParent(): Session | undefined {
    const session = this.currentSession
    if (!session?.parentID) return undefined
    return this.list.find((item) => item.id === session.parentID)
  }

  get currentSession(): Session | undefined {
    return this.list.find((session) => session.id === this.current)
  }

  get busy(): boolean {
    const status = this.statuses[this.current]
    return Boolean(status && status.type === 'busy')
  }

  status(id: string): SessionStatus | undefined {
    return this.statuses[id]
  }

  async refresh(): Promise<void> {
    this.loading = true
    try {
      const result = await connection.client.session.list()
      if (result.error) {
        ui.toast(message(result.error), 'error', 'Failed to load sessions')
        return
      }
      this.list = (result.data ?? []).sort((a, b) => b.time.updated - a.time.updated)
    } catch (error) {
      ui.toast(message(error), 'error', 'Failed to reach server')
    } finally {
      this.loading = false
    }
  }

  restoreLast(): void {
    if (this.bootstrapped) return
    this.bootstrapped = true
    if (this.current || typeof localStorage === 'undefined') return
    const id = localStorage.getItem(SESSION_KEY)
    if (id && this.list.some((session) => session.id === id)) this.current = id
  }

  async refreshStatuses(): Promise<void> {
    try {
      const result = await connection.client.session.status()
      if (result.error || !result.data) return
      this.statuses = { ...this.statuses, ...result.data }
    } catch {
      /* non fatal */
    }
  }

  async create(title?: string): Promise<Session | undefined> {
    try {
      const result = await connection.client.session.create({ body: { title } })
      if (result.error || !result.data) {
        ui.toast(message(result.error), 'error', 'Could not create session')
        return undefined
      }
      this.upsert(result.data)
      this.current = result.data.id
      this.statuses = { ...this.statuses, [result.data.id]: { type: 'idle' } }
      return result.data
    } catch (error) {
      ui.toast(message(error), 'error', 'Could not create session')
      return undefined
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await connection.client.session.delete({ path: { id } })
      if (result.error) {
        ui.toast(message(result.error), 'error', 'Could not delete session')
        return
      }
      this.list = this.list.filter((session) => session.id !== id)
      if (this.current === id) {
        this.current = this.roots[0]?.id ?? ''
      }
      ui.toast('Session deleted', 'success')
    } catch (error) {
      ui.toast(message(error), 'error', 'Could not delete session')
    }
  }

  async rename(id: string, title: string): Promise<void> {
    try {
      const result = await connection.client.session.update({ path: { id }, body: { title } })
      if (result.error || !result.data) {
        ui.toast(message(result.error), 'error', 'Could not rename session')
        return
      }
      this.upsert(result.data)
    } catch (error) {
      ui.toast(message(error), 'error', 'Could not rename session')
    }
  }

  async abort(id: string): Promise<void> {
    try {
      await connection.client.session.abort({ path: { id } })
    } catch (error) {
      ui.toast(message(error), 'error', 'Could not abort session')
    }
  }

  async share(id: string): Promise<string | undefined> {
    try {
      const result = await connection.client.session.share({ path: { id } })
      if (result.error || !result.data?.share?.url) {
        ui.toast(message(result.error), 'error', 'Could not share session')
        return undefined
      }
      this.upsert(result.data)
      return result.data.share.url
    } catch (error) {
      ui.toast(message(error), 'error', 'Could not share session')
      return undefined
    }
  }

  select(id: string): void {
    this.current = id
    if (typeof localStorage === 'undefined') return
    try {
      if (id) localStorage.setItem(SESSION_KEY, id)
      else localStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
  }

  upsert(session: Session): void {
    const index = this.list.findIndex((item) => item.id === session.id)
    if (index >= 0) this.list[index] = session
    else this.list = [session, ...this.list]
    this.list = [...this.list].sort((a, b) => b.time.updated - a.time.updated)
  }

  removeLocal(id: string): void {
    this.list = this.list.filter((session) => session.id !== id)
    if (this.current === id) this.current = this.roots[0]?.id ?? ''
  }

  setStatus(id: string, status: SessionStatus): void {
    this.statuses = { ...this.statuses, [id]: status }
  }
}

export const sessions = new Sessions()
