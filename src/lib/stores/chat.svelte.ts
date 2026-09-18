import type { Message, Part, TextPartInput } from '@opencode-ai/sdk/client'
import { connection } from './connection.svelte'
import { errorMessage, models } from './models.svelte'
import { sessions } from './sessions.svelte'
import { ui } from './ui.svelte'

export type MessageEntry = {
  info: Message
  parts: Part[]
}

const MAX_MESSAGES = 500
const MAX_ORPHANS = 200

class Chat {
  bySession = $state<Record<string, MessageEntry[]>>({})
  loading = $state<Record<string, boolean>>({})
  drafts = $state<Record<string, string>>({})
  private orphans = new Map<string, Part[]>()

  entries(sessionID: string): MessageEntry[] {
    return this.bySession[sessionID] ?? []
  }

  draft(sessionID: string): string {
    return this.drafts[sessionID] ?? ''
  }

  setDraft(sessionID: string, value: string): void {
    this.drafts = { ...this.drafts, [sessionID]: value }
  }

  private ensure(sessionID: string): MessageEntry[] {
    let list = this.bySession[sessionID]
    if (!list) {
      list = []
      this.bySession[sessionID] = list
    }
    return list
  }

  async load(sessionID: string, force = false, limit?: number): Promise<void> {
    if (!sessionID) return
    if (!force && this.bySession[sessionID]) return
    this.loading = { ...this.loading, [sessionID]: true }
    try {
      const result = await connection.client.session.messages({
        path: { id: sessionID },
        query: limit ? { limit } : undefined,
      })
      if (result.error) {
        ui.toast(errorMessage(result.error), 'error', 'Could not load messages')
        return
      }
      this.bySession = {
        ...this.bySession,
        [sessionID]: (result.data ?? []).map((entry) => ({ info: entry.info, parts: [...entry.parts] })),
      }
    } catch (error) {
      ui.toast(errorMessage(error), 'error', 'Could not load messages')
    } finally {
      this.loading = { ...this.loading, [sessionID]: false }
    }
  }

  reload(sessionID: string): Promise<void> {
    return this.load(sessionID, true)
  }

  upsertMessage(info: Message): void {
    const list = this.ensure(info.sessionID)
    const index = list.findIndex((entry) => entry.info.id === info.id)
    if (index >= 0) {
      list[index].info = info
      return
    }
    const orphaned = this.orphans.get(info.id)
    list.push({ info, parts: orphaned ?? [] })
    if (orphaned) this.orphans.delete(info.id)
    list.sort((a, b) => a.info.time.created - b.info.time.created)
    if (list.length > MAX_MESSAGES) list.splice(0, list.length - MAX_MESSAGES)
  }

  upsertPart(part: Part): void {
    const list = this.bySession[part.sessionID]
    const entry = list?.find((item) => item.info.id === part.messageID)
    if (!entry) {
      const bucket = this.orphans.get(part.messageID) ?? []
      const index = bucket.findIndex((item) => item.id === part.id)
      if (index >= 0) bucket[index] = part
      else bucket.push(part)
      this.orphans.set(part.messageID, bucket)
      if (this.orphans.size > MAX_ORPHANS) {
        const oldest = this.orphans.keys().next().value
        if (oldest !== undefined) this.orphans.delete(oldest)
      }
      return
    }
    const index = entry.parts.findIndex((item) => item.id === part.id)
    if (index >= 0) entry.parts[index] = part
    else entry.parts.push(part)
  }

  removePart(sessionID: string, messageID: string, partID: string): void {
    const entry = this.bySession[sessionID]?.find((item) => item.info.id === messageID)
    if (!entry) return
    entry.parts = entry.parts.filter((part) => part.id !== partID)
  }

  removeMessage(sessionID: string, messageID: string): void {
    const list = this.bySession[sessionID]
    if (!list) return
    this.bySession[sessionID] = list.filter((entry) => entry.info.id !== messageID)
  }

  clear(sessionID: string): void {
    if (!this.bySession[sessionID]) return
    this.bySession = { ...this.bySession, [sessionID]: [] }
  }

  async send(sessionID: string, raw: string): Promise<boolean> {
    const text = raw.trim()
    if (!text || !sessionID) return false
    const client = connection.client
    const model = models.ref()
    const agent = models.selectedAgent || undefined

    try {
      if (text.startsWith('!')) {
        const result = await client.session.shell({
          path: { id: sessionID },
          body: { agent: agent ?? 'build', model, command: text.slice(1).trim() },
        })
        if (result.error) throw result.error
        return true
      }

      if (text.startsWith('/')) {
        const withoutSlash = text.slice(1)
        const spaceIndex = withoutSlash.search(/\s/)
        const name = spaceIndex === -1 ? withoutSlash : withoutSlash.slice(0, spaceIndex)
        const command = models.findCommand(name)
        if (command) {
          const args = spaceIndex === -1 ? '' : withoutSlash.slice(spaceIndex + 1)
          const result = await client.session.command({
            path: { id: sessionID },
            body: { command: name, arguments: args, agent: command.agent ?? agent },
          })
          if (result.error) throw result.error
          return true
        }
      }

      const parts: TextPartInput[] = [{ type: 'text', text }]
      const result = await client.session.promptAsync({
        path: { id: sessionID },
        body: { parts, model, agent },
      })
      if (result.error) throw result.error
      return true
    } catch (error) {
      ui.toast(errorMessage(error), 'error', 'Send failed')
      return false
    }
  }

  async abort(sessionID: string): Promise<void> {
    await sessions.abort(sessionID)
  }

  async revert(sessionID: string, messageID: string): Promise<void> {
    try {
      const result = await connection.client.session.revert({ path: { id: sessionID }, body: { messageID } })
      if (result.error) throw result.error
      await this.reload(sessionID)
      ui.toast('Reverted', 'success')
    } catch (error) {
      ui.toast(errorMessage(error), 'error', 'Revert failed')
    }
  }

  async unrevert(sessionID: string): Promise<void> {
    try {
      const result = await connection.client.session.unrevert({ path: { id: sessionID } })
      if (result.error) throw result.error
      await this.reload(sessionID)
      ui.toast('Restored', 'success')
    } catch (error) {
      ui.toast(errorMessage(error), 'error', 'Restore failed')
    }
  }
}

export const chat = new Chat()
