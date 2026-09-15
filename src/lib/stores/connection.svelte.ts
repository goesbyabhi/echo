import type { OpencodeClient } from '@opencode-ai/sdk/client'
import { createClient, defaultSettings, probe, type Settings } from '../api'

const STORAGE_KEY = 'opencode-ui:settings'

function load(): Settings {
  if (typeof localStorage === 'undefined') return { ...defaultSettings }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultSettings }
    return { ...defaultSettings, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    return { ...defaultSettings }
  }
}

export type ConnectionStatus = 'connecting' | 'online' | 'offline'

class Connection {
  settings = $state<Settings>(load())
  status = $state<ConnectionStatus>('connecting')
  version = $state('')
  error = $state('')
  lastChecked = $state(0)

  client = $derived<OpencodeClient>(createClient(this.settings))

  update(patch: Partial<Settings>): void {
    this.settings = { ...this.settings, ...patch }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings))
      } catch {
        /* ignore quota errors */
      }
    }
  }

  async refresh(): Promise<boolean> {
    this.status = 'connecting'
    this.error = ''
    const result = await probe(this.settings)
    this.status = result.ok ? 'online' : 'offline'
    this.version = result.version
    this.error = result.error ?? ''
    this.lastChecked = Date.now()
    return result.ok
  }
}

export const connection = new Connection()
