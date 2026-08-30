import { create } from 'zustand'

const DONE_KEY = 'fet-tour-done'

interface TourState {
  open: boolean
  step: number
  start: () => void
  stop: (markDone?: boolean) => void
  next: () => void
  prev: () => void
  goto: (i: number) => void
  hasSeen: () => boolean
}

export const useTour = create<TourState>((set) => ({
  open: false,
  step: 0,
  start: () => set({ open: true, step: 0 }),
  stop: (markDone = true) => {
    if (markDone) localStorage.setItem(DONE_KEY, '1')
    set({ open: false })
  },
  next: () => set((s) => ({ step: s.step + 1 })),
  prev: () => set((s) => ({ step: Math.max(0, s.step - 1) })),
  goto: (i) => set({ step: i }),
  hasSeen: () => localStorage.getItem(DONE_KEY) === '1',
}))
