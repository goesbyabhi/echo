export type BackgroundKind = 'aurora' | 'mesh' | 'solid' | 'gradient' | 'image'

export type ThemeSettings = {
  kind: BackgroundKind
  color1: string
  color2: string
  color3: string
  imageUrl: string
  blur: number
  dim: number
  accent: string
  panelOpacity: number
}

export type Toast = {
  id: number
  title?: string
  message: string
  variant: 'info' | 'success' | 'warning' | 'error'
  timeout: number
}

export type PanelTab = 'files' | 'changes' | 'todos' | 'status' | 'permissions'

const STORAGE_KEY = 'opencode-ui:theme:v2'
const LAYOUT_KEY = 'opencode-ui:layout'

export const defaultTheme: ThemeSettings = {
  kind: 'solid',
  color1: '#f7f6f3',
  color2: '#fbfbfa',
  color3: '#efeee9',
  imageUrl: '',
  blur: 0,
  dim: 0,
  accent: '#1f6c9f',
  panelOpacity: 1,
}

function load(): ThemeSettings {
  if (typeof localStorage === 'undefined') return { ...defaultTheme }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultTheme }
    return { ...defaultTheme, ...(JSON.parse(raw) as Partial<ThemeSettings>) }
  } catch {
    return { ...defaultTheme }
  }
}

type LayoutSettings = {
  panelTab: PanelTab
  panelOpen: boolean
  sidebarOpen: boolean
}

const defaultLayout: LayoutSettings = {
  panelTab: 'files',
  panelOpen: true,
  sidebarOpen: true,
}

function loadLayout(): LayoutSettings {
  if (typeof localStorage === 'undefined') return { ...defaultLayout }
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (!raw) return { ...defaultLayout }
    return { ...defaultLayout, ...(JSON.parse(raw) as Partial<LayoutSettings>) }
  } catch {
    return { ...defaultLayout }
  }
}

let toastId = 0

class Ui {
  theme = $state<ThemeSettings>(load())
  toasts = $state<Toast[]>([])
  panelTab = $state<PanelTab>(loadLayout().panelTab)
  panelOpen = $state(loadLayout().panelOpen)
  sidebarOpen = $state(loadLayout().sidebarOpen)
  settingsOpen = $state(false)

  persistLayout(): void {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(
        LAYOUT_KEY,
        JSON.stringify({
          panelTab: this.panelTab,
          panelOpen: this.panelOpen,
          sidebarOpen: this.sidebarOpen,
        }),
      )
    } catch {
      /* ignore */
    }
  }

  updateTheme(patch: Partial<ThemeSettings>): void {
    this.theme = { ...this.theme, ...patch }
    this.applyTheme()
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.theme))
      } catch {
        /* ignore */
      }
    }
  }

  applyTheme(): void {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.style.setProperty('--bg-1', this.theme.color1)
    root.style.setProperty('--bg-2', this.theme.color2)
    root.style.setProperty('--bg-3', this.theme.color3)
    root.style.setProperty('--bg-image', this.theme.imageUrl ? `url("${this.theme.imageUrl}")` : 'none')
    root.style.setProperty('--bg-blur', `${this.theme.blur}px`)
    root.style.setProperty('--bg-dim', String(this.theme.dim))
    root.style.setProperty('--accent', this.theme.accent)
    root.style.setProperty('--panel-opacity', String(this.theme.panelOpacity))
    root.dataset.bg = this.theme.kind
  }

  toast(message: string, variant: Toast['variant'] = 'info', title?: string): void {
    const id = ++toastId
    const timeout = variant === 'error' ? 8000 : 4500
    this.toasts = [...this.toasts, { id, message, variant, title, timeout }]
    setTimeout(() => this.dismiss(id), timeout)
  }

  dismiss(id: number): void {
    this.toasts = this.toasts.filter((toast) => toast.id !== id)
  }

  openPanel(tab: PanelTab): void {
    this.panelTab = tab
    this.panelOpen = true
  }
}

export const ui = new Ui()
