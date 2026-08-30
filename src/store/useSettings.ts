import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface Palette {
  name: string
  primary: string
  secondary: string
  accent: string
}

export const PALETTES: Palette[] = [
  { name: 'Emerald', primary: '#10b981', secondary: '#6366f1', accent: '#f59e0b' },
  { name: 'Blue Ocean', primary: '#0ea5e9', secondary: '#6366f1', accent: '#06b6d4' },
  { name: 'Purple', primary: '#8b5cf6', secondary: '#ec4899', accent: '#f59e0b' },
  { name: 'Rose', primary: '#f43f5e', secondary: '#8b5cf6', accent: '#fb7185' },
  { name: 'Orange', primary: '#f97316', secondary: '#0ea5e9', accent: '#f59e0b' },
  { name: 'Forest', primary: '#16a34a', secondary: '#65a30d', accent: '#ca8a04' },
  { name: 'Midnight', primary: '#6366f1', secondary: '#0ea5e9', accent: '#a855f7' },
  { name: 'Minimal Gray', primary: '#475569', secondary: '#64748b', accent: '#0ea5e9' },
]

export const FONTS = [
  'Inter',
  'Poppins',
  'Roboto',
  'Nunito',
  'Open Sans',
  'Lato',
  'System',
]

export interface AppSettings {
  // Theme
  mode: ThemeMode
  primary: string
  secondary: string
  accent: string
  success: string
  warning: string
  danger: string

  // Typography
  fontFamily: string
  fontScale: number
  fontWeight: number
  letterSpacing: number
  lineHeight: number

  // UI style
  radius: number
  shadow: number
  spacing: 'compact' | 'comfortable'
  animSpeed: number
  glass: boolean
  material: boolean

  // Preferences
  currency: string
  dateFormat: string
  language: string

  // Privacy
  pinEnabled: boolean
  pin: string
  hideBalances: boolean

  // Accessibility
  highContrast: boolean
  largeText: boolean
  reduceMotion: boolean

  // Notifications
  remindersEnabled: boolean
  reminderTime: string

  set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  applyPalette: (p: Palette) => void
  reset: () => void
}

const defaults = {
  mode: 'system' as ThemeMode,
  primary: '#10b981',
  secondary: '#6366f1',
  accent: '#f59e0b',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  fontFamily: 'Inter',
  fontScale: 1,
  fontWeight: 400,
  letterSpacing: 0,
  lineHeight: 1.5,
  radius: 18,
  shadow: 1,
  spacing: 'comfortable' as const,
  animSpeed: 1,
  glass: false,
  material: false,
  currency: 'INR',
  dateFormat: 'DD/MM/YYYY',
  language: 'en',
  pinEnabled: false,
  pin: '',
  hideBalances: false,
  highContrast: false,
  largeText: false,
  reduceMotion: false,
  remindersEnabled: true,
  reminderTime: '20:00',
}

export const useSettings = create<AppSettings>()(
  persist(
    (set) => ({
      ...defaults,
      set: (key, value) => set({ [key]: value } as Partial<AppSettings>),
      applyPalette: (p) =>
        set({ primary: p.primary, secondary: p.secondary, accent: p.accent }),
      reset: () => set({ ...defaults }),
    }),
    { name: 'fet-settings' },
  ),
)

const FONT_STACK: Record<string, string> = {
  Inter: "'Inter', system-ui, sans-serif",
  Poppins: "'Poppins', system-ui, sans-serif",
  Roboto: "'Roboto', system-ui, sans-serif",
  Nunito: "'Nunito', system-ui, sans-serif",
  'Open Sans': "'Open Sans', system-ui, sans-serif",
  Lato: "'Lato', system-ui, sans-serif",
  System: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
}

let fontLinkEl: HTMLLinkElement | null = null

function loadWebFont(family: string) {
  if (family === 'System') return
  const id = 'google-font-' + family.replace(/\s/g, '-')
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(
    /\s/g,
    '+',
  )}:wght@300;400;500;600;700;800&display=swap`
  document.head.appendChild(link)
  fontLinkEl = link
}

/** Applies the settings to the document root. Call on change + on load. */
export function applyTheme(s: AppSettings) {
  const root = document.documentElement
  const isDark =
    s.mode === 'dark' ||
    (s.mode === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  root.classList.toggle('dark', isDark)
  root.classList.toggle('glass', s.glass)
  root.classList.toggle('reduce-motion', s.reduceMotion)

  const v = root.style
  v.setProperty('--color-primary', s.primary)
  v.setProperty('--color-secondary', s.secondary)
  v.setProperty('--color-accent', s.accent)
  v.setProperty('--color-success', s.success)
  v.setProperty('--color-warning', s.warning)
  v.setProperty('--color-danger', s.danger)

  loadWebFont(s.fontFamily)
  v.setProperty('--font-family', FONT_STACK[s.fontFamily] ?? FONT_STACK.Inter)
  v.setProperty('--font-scale', String(s.fontScale * (s.largeText ? 1.15 : 1)))
  v.setProperty('--font-weight', String(s.fontWeight))
  v.setProperty('--letter-spacing', `${s.letterSpacing}px`)
  v.setProperty('--line-height', String(s.lineHeight))

  v.setProperty('--radius', `${s.radius}px`)
  v.setProperty('--shadow-strength', String(s.shadow))
  v.setProperty('--space', s.spacing === 'compact' ? '0.75' : '1')
  v.setProperty('--anim-speed', String(s.animSpeed))

  if (s.highContrast) {
    root.classList.add('high-contrast')
  } else {
    root.classList.remove('high-contrast')
  }

  const themeMeta = document.querySelector('meta[name="theme-color"]')
  themeMeta?.setAttribute('content', isDark ? '#0b1220' : s.primary)
}

// keep the reference alive for linters
void fontLinkEl
