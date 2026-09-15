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
  fade: number
  vignette: number
  grain: number
  dither: number
  scanline: number
  bloom: number
  drift: boolean
}

export type Toast = {
  id: number
  title?: string
  message: string
  variant: 'info' | 'success' | 'warning' | 'error'
  timeout: number
}

export type PanelTab = 'files' | 'changes' | 'todos' | 'status' | 'permissions' | 'diff'

export type DiffView = {
  title: string
  before: string
  after: string
}

const STORAGE_KEY = 'opencode-ui:theme:v5'
const LAYOUT_KEY = 'opencode-ui:layout'

export const defaultTheme: ThemeSettings = {
  kind: 'image',
  color1: '#0a0a0b',
  color2: '#101012',
  color3: '#17171b',
  imageUrl: '/wallpaper.svg',
  blur: 0,
  dim: 0.5,
  accent: '#3b82f6',
  panelOpacity: 0.72,
  fade: 0.92,
  vignette: 0.35,
  grain: 0.06,
  dither: 0.16,
  scanline: 0.06,
  bloom: 0.3,
  drift: true,
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
  diffView = $state<DiffView | null>(null)

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
    root.style.setProperty('--fx-fade', String(this.theme.fade))
    root.style.setProperty('--fx-vignette', String(this.theme.vignette))
    root.style.setProperty('--fx-grain', String(this.theme.grain))
    root.style.setProperty('--fx-dither', String(this.theme.dither))
    root.style.setProperty('--fx-scanline', String(this.theme.scanline))
    root.style.setProperty('--fx-bloom', String(this.theme.bloom))
    root.dataset.bg = this.theme.kind
    root.dataset.drift = this.theme.drift ? 'on' : 'off'
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

  openDiff(view: DiffView): void {
    this.diffView = view
    this.openPanel('diff')
  }
}

export const ui = new Ui()
