import type { ThemeSettings } from './stores/ui.svelte'

export type WallpaperPreset = {
  id: string
  name: string
  patch: Partial<ThemeSettings>
}

export const wallpapers: WallpaperPreset[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    patch: {
      kind: 'image',
      imageUrl: '/wallpaper.svg',
      color1: '#0a0a0b',
      color2: '#101012',
      color3: '#17171b',
      accent: '#3b82f6',
      dim: 0.5,
    },
  },
  {
    id: 'orbit',
    name: 'Orbit',
    patch: {
      kind: 'image',
      imageUrl: '/wallpaper-orbit.svg',
      color1: '#0c0a12',
      color2: '#141018',
      color3: '#1c1626',
      accent: '#a78bfa',
      dim: 0.5,
    },
  },
  {
    id: 'contour',
    name: 'Contour',
    patch: {
      kind: 'image',
      imageUrl: '/wallpaper-contour.svg',
      color1: '#081014',
      color2: '#0e1c22',
      color3: '#142a33',
      accent: '#67e8f9',
      dim: 0.55,
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    patch: {
      kind: 'aurora',
      color1: '#140d0a',
      color2: '#20130d',
      color3: '#2e1b12',
      accent: '#f59e0b',
      dim: 0.55,
    },
  },
  {
    id: 'graphite',
    name: 'Graphite',
    patch: {
      kind: 'mesh',
      color1: '#0a0a0b',
      color2: '#101012',
      color3: '#17171b',
      accent: '#3b82f6',
      dim: 0.5,
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    patch: {
      kind: 'mesh',
      color1: '#0b0f14',
      color2: '#111820',
      color3: '#1a222c',
      accent: '#58a6ff',
      dim: 0.5,
    },
  },
  {
    id: 'nebula',
    name: 'Nebula',
    patch: {
      kind: 'gradient',
      color1: '#0f0a1a',
      color2: '#1a1030',
      color3: '#2a1a4a',
      accent: '#a78bfa',
      dim: 0.55,
    },
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    patch: {
      kind: 'solid',
      color1: '#0c0c0e',
      color2: '#0c0c0e',
      color3: '#141418',
      accent: '#9aa0ae',
      dim: 0.6,
    },
  },
]

export function matchesPreset(preset: WallpaperPreset, theme: ThemeSettings): boolean {
  return Object.entries(preset.patch).every(([key, value]) => theme[key as keyof ThemeSettings] === value)
}

export const currentPresetId = (theme: ThemeSettings): string | undefined =>
  wallpapers.find((preset) => matchesPreset(preset, theme))?.id