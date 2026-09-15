import { createOpencodeClient, type OpencodeClient } from '@opencode-ai/sdk/client'

export type Settings = {
  baseUrl: string
  username: string
  password: string
  directory: string
}

export const defaultSettings: Settings = {
  baseUrl: 'http://127.0.0.1:4096',
  username: '',
  password: '',
  directory: '',
}

function basicAuth(settings: Settings): string | null {
  if (!settings.username && !settings.password) return null
  const raw = `${settings.username}:${settings.password}`
  const bytes = new TextEncoder().encode(raw)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return `Basic ${btoa(binary)}`
}

function makeFetch(auth: string | null) {
  return (request: Request): Promise<Response> => {
    if (!auth) return fetch(request)
    const headers = new Headers(request.headers)
    headers.set('authorization', auth)
    return fetch(new Request(request, { headers }))
  }
}

export function createClient(settings: Settings): OpencodeClient {
  const auth = basicAuth(settings)
  return createOpencodeClient({
    baseUrl: settings.baseUrl.replace(/\/+$/, ''),
    directory: settings.directory.trim() || undefined,
    fetch: makeFetch(auth),
  })
}

export type Health = {
  ok: boolean
  version: string
  error?: string
}

function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), ms)
  return controller.signal
}

export async function probe(settings: Settings): Promise<Health> {
  const auth = basicAuth(settings)
  const base = settings.baseUrl.replace(/\/+$/, '')
  try {
    const response = await fetch(`${base}/global/health`, {
      headers: auth ? { authorization: auth } : undefined,
      signal: timeoutSignal(6000),
    })
    if (response.status === 401) {
      return { ok: false, version: '', error: 'Unauthorized — check username/password' }
    }
    if (!response.ok) {
      return { ok: false, version: '', error: `Server responded ${response.status}` }
    }
    const body = (await response.json()) as { healthy?: boolean; version?: string }
    return { ok: Boolean(body.healthy), version: body.version ?? '' }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, version: '', error: message }
  }
}
