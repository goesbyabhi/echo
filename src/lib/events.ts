import type { Event, OpencodeClient } from '@opencode-ai/sdk/client'
import { chat } from './stores/chat.svelte'
import { errorMessage } from './stores/models.svelte'
import { permissions } from './stores/permissions.svelte'
import { sessions } from './stores/sessions.svelte'
import { status } from './stores/status.svelte'
import { ui } from './stores/ui.svelte'

let refreshTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRefresh(): void {
  if (refreshTimer) clearTimeout(refreshTimer)
  refreshTimer = setTimeout(() => {
    refreshTimer = null
    void status.refresh()
  }, 600)
}

export function handleEvent(event: Event): void {
  switch (event.type) {
    case 'session.created':
    case 'session.updated':
      sessions.upsert(event.properties.info)
      break
    case 'session.deleted':
      sessions.removeLocal(event.properties.info.id)
      break
    case 'session.status':
      sessions.setStatus(event.properties.sessionID, event.properties.status)
      break
    case 'session.idle':
      sessions.setStatus(event.properties.sessionID, { type: 'idle' })
      break
    case 'session.compacted':
      ui.toast('Session compacted', 'info')
      break
    case 'message.updated':
      chat.upsertMessage(event.properties.info)
      break
    case 'message.removed':
      chat.removeMessage(event.properties.sessionID, event.properties.messageID)
      break
    case 'message.part.updated':
      chat.upsertPart(event.properties.part)
      break
    case 'message.part.removed':
      chat.removePart(event.properties.sessionID, event.properties.messageID, event.properties.partID)
      break
    case 'permission.updated':
      permissions.add(event.properties)
      if (event.properties.sessionID === sessions.current) ui.openPanel('permissions')
      break
    case 'permission.replied':
      permissions.remove(event.properties.permissionID)
      break
    case 'todo.updated':
      status.setTodos(event.properties.sessionID, event.properties.todos)
      break
    case 'session.error': {
      const error = event.properties.error
      if (error) ui.toast(errorMessage(error), 'error', 'Session error')
      break
    }
    case 'file.edited':
      break
    case 'file.watcher.updated':
      scheduleRefresh()
      break
    case 'vcs.branch.updated':
      scheduleRefresh()
      break
    case 'lsp.updated':
      scheduleRefresh()
      break
    default:
      break
  }
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve()
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    function onAbort(): void {
      clearTimeout(timer)
      resolve()
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

export async function startEventStream(client: OpencodeClient, signal: AbortSignal): Promise<void> {
  let attempt = 0
  while (!signal.aborted) {
    try {
      const events = await client.event.subscribe({ signal })
      attempt = 0
      for await (const event of events.stream) {
        if (signal.aborted) break
        handleEvent(event)
      }
    } catch (error) {
      if (signal.aborted) return
      const message = error instanceof Error ? error.message : String(error)
      if (attempt === 0 && !/abort/i.test(message)) {
        ui.toast(message, 'warning', 'Event stream disconnected — reconnecting')
      }
    }
    if (signal.aborted) return
    attempt += 1
    const delay = Math.min(1000 * 2 ** Math.min(attempt, 4), 15000)
    await sleep(delay, signal)
  }
}
