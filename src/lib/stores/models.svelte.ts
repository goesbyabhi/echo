import type { Agent, Command, Provider } from '@opencode-ai/sdk/client'
import { connection } from './connection.svelte'

const MODEL_KEY = 'opencode-ui:model'
const AGENT_KEY = 'opencode-ui:agent'

export type ModelRef = {
  providerID: string
  modelID: string
  name: string
}

function readStored(key: string): string {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem(key) ?? ''
}

function writeStored(key: string, value: string): void {
  if (typeof localStorage === 'undefined') return
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

class Models {
  providers = $state<Provider[]>([])
  agents = $state<Agent[]>([])
  commands = $state<Command[]>([])
  selected = $state<string>(readStored(MODEL_KEY))
  selectedAgent = $state<string>(readStored(AGENT_KEY))
  loading = $state(false)

  get modelOptions(): ModelRef[] {
    const options: ModelRef[] = []
    for (const provider of this.providers) {
      for (const model of Object.values(provider.models ?? {})) {
        options.push({
          providerID: provider.id,
          modelID: model.id,
          name: `${provider.name} · ${model.name}`,
        })
      }
    }
    return options.sort((a, b) => a.name.localeCompare(b.name))
  }

  get current(): ModelRef | undefined {
    if (!this.selected) return undefined
    return this.modelOptions.find((option) => `${option.providerID}/${option.modelID}` === this.selected)
  }

  get primaryAgents(): Agent[] {
    return this.agents.filter((agent) => agent.mode !== 'subagent').sort((a, b) => a.name.localeCompare(b.name))
  }

  async load(): Promise<void> {
    this.loading = true
    try {
      const [providers, agents, commands] = await Promise.all([
        connection.client.config.providers(),
        connection.client.app.agents(),
        connection.client.command.list(),
      ])
      if (providers.data) this.providers = providers.data.providers ?? []
      if (agents.data) this.agents = agents.data
      if (commands.data) this.commands = commands.data
      this.ensureSelection()
    } catch {
      /* non fatal */
    } finally {
      this.loading = false
    }
  }

  ensureSelection(): void {
    const options = this.modelOptions
    if (this.selected && !options.some((o) => `${o.providerID}/${o.modelID}` === this.selected)) {
      this.selected = ''
    }
    if (!this.selected && options.length > 0) {
      this.selected = `${options[0].providerID}/${options[0].modelID}`
      writeStored(MODEL_KEY, this.selected)
    }
    const agentNames = this.primaryAgents.map((agent) => agent.name)
    if (this.selectedAgent && !agentNames.includes(this.selectedAgent)) {
      this.selectedAgent = ''
    }
    if (!this.selectedAgent && agentNames.length > 0) {
      this.selectedAgent = agentNames.includes('build') ? 'build' : agentNames[0]
      writeStored(AGENT_KEY, this.selectedAgent)
    }
  }

  setModel(providerID: string, modelID: string): void {
    this.selected = `${providerID}/${modelID}`
    writeStored(MODEL_KEY, this.selected)
  }

  setAgent(name: string): void {
    this.selectedAgent = name
    writeStored(AGENT_KEY, name)
  }

  ref(): { providerID: string; modelID: string } | undefined {
    const current = this.current
    return current ? { providerID: current.providerID, modelID: current.modelID } : undefined
  }

  findCommand(name: string): Command | undefined {
    return this.commands.find((command) => command.name === name)
  }
}

export const models = new Models()

export function errorMessage(error: unknown): string {
  if (!error) return 'Request failed'
  if (typeof error === 'string') return error
  if (typeof error === 'object') {
    const record = error as Record<string, unknown>
    if (typeof record.message === 'string') return record.message
    if (record.data && typeof record.data === 'object') {
      const data = record.data as Record<string, unknown>
      if (typeof data.message === 'string') return data.message
    }
    if (typeof record.name === 'string') return record.name
  }
  return JSON.stringify(error)
}
