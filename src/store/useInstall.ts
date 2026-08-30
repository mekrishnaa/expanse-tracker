import { create } from 'zustand'

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function detectStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function detectIOS() {
  const ua = navigator.userAgent
  return (
    /iphone|ipad|ipod/i.test(ua) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  )
}

interface InstallState {
  deferred: BeforeInstallPromptEvent | null
  installed: boolean
  isIOS: boolean
  isStandalone: boolean
  setDeferred: (e: BeforeInstallPromptEvent | null) => void
  setInstalled: (v: boolean) => void
  /** Triggers the native prompt; resolves to true if accepted. */
  promptInstall: () => Promise<boolean>
}

export const useInstall = create<InstallState>((set, get) => ({
  deferred: null,
  installed: detectStandalone(),
  isIOS: detectIOS(),
  isStandalone: detectStandalone(),
  setDeferred: (e) => set({ deferred: e }),
  setInstalled: (v) => set({ installed: v }),
  promptInstall: async () => {
    const e = get().deferred
    if (!e) return false
    await e.prompt()
    const { outcome } = await e.userChoice
    set({ deferred: null })
    return outcome === 'accepted'
  },
}))

/** Wire up global install lifecycle events. Call once at startup. */
export function initInstallListeners() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    useInstall.getState().setDeferred(e as BeforeInstallPromptEvent)
  })
  window.addEventListener('appinstalled', () => {
    useInstall.getState().setDeferred(null)
    useInstall.getState().setInstalled(true)
  })
}
