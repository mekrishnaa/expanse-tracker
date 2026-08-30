import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function uid() {
  return Math.random().toString(36).slice(2, 10)
}

/** Convert a hex color to an "r g b" string usable in rgb()/color-mix. */
export function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  const num = parseInt(full, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `${r} ${g} ${b}`
}

/** Choose readable text color (black/white) for a given hex background. */
export function contrastText(hex: string): string {
  const [r, g, b] = hexToRgb(hex).split(' ').map(Number)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#0f172a' : '#ffffff'
}
