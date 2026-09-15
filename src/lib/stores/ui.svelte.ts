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

const STORAGE_KEY = 'opencode-ui:theme:v7'
const LAYOUT_KEY = 'opencode-ui:layout'
const THEME_VERSION = 8

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
  fade: 1,
  vignette: 0.45,
  grain: 0.1,
  dither: 0.2,
  scanline: 0.1,
  bloom: 0.4,
  drift: true,
}

function load(): ThemeSettings {
  if (typeof localStorage === 'undefined') return { ...defaultTheme }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultTheme }
    const parsed = JSON.parse(raw) as Partial<ThemeSettings> & { v?: number }
    const merged: ThemeSettings = { ...defaultTheme, ...parsed }
    if ((parsed.v ?? 0) < THEME_VERSION) {
      merged.fade = defaultTheme.fade
      merged.vignette = defaultTheme.vignette
      merged.grain = defaultTheme.grain
      merged.dither = defaultTheme.dither
      merged.scanline = defaultTheme.scanline
      merged.bloom = defaultTheme.bloom
      merged.drift = defaultTheme.drift
    }
    return merged
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

let analyzeToken = 0

function toneScrim(luminance: number): number {
  return Math.max(0, Math.min(1, (luminance - 0.4) / 0.35))
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...this.theme, v: THEME_VERSION }))
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
    root.style.setProperty('--bg-filter', this.theme.blur > 0 ? `blur(${this.theme.blur}px)` : 'none')
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
    this.analyzeImage()
  }

  private analyzeImage(): void {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const url = this.theme.kind === 'image' ? this.theme.imageUrl : ''
    if (!url) {
      root.style.setProperty('--tone-top', '0')
      root.style.setProperty('--tone-bottom', '0')
      return
    }
    const token = ++analyzeToken
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (token !== analyzeToken) return
      try {
        const size = 48
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)
        let topSum = 0
        let topCount = 0
        let bottomSum = 0
        let bottomCount = 0
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4
            const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255
            if (y < size / 3) {
              topSum += lum
              topCount++
            } else if (y >= (size * 2) / 3) {
              bottomSum += lum
              bottomCount++
            }
          }
        }
        root.style.setProperty('--tone-top', String(toneScrim(topSum / Math.max(1, topCount))))
        root.style.setProperty('--tone-bottom', String(toneScrim(bottomSum / Math.max(1, bottomCount))))
      } catch {
        root.style.setProperty('--tone-top', '0')
        root.style.setProperty('--tone-bottom', '0')
      }
    }
    img.onerror = () => {
      root.style.setProperty('--tone-top', '0')
      root.style.setProperty('--tone-bottom', '0')
    }
    img.src = url
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
