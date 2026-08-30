import { AnimatePresence, motion } from 'framer-motion'
import { Download, RefreshCw, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Shows a toast when a new version has been deployed so the user can update
 * on demand, plus a one-time "ready to work offline" confirmation.
 */
export function PWAUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // Check the server for a new version every hour.
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000)
      }
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  const show = offlineReady || needRefresh

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed inset-x-3 bottom-24 z-[80] mx-auto max-w-sm rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-lg)] lg:bottom-6"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
              {needRefresh ? <RefreshCw size={18} /> : <Download size={18} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">
                {needRefresh ? 'Update available' : 'Ready to work offline'}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                {needRefresh
                  ? 'A new version of the app is ready. Reload to get the latest features.'
                  : 'The app is cached and will work without an internet connection.'}
              </p>
              {needRefresh && (
                <button
                  onClick={() => updateServiceWorker(true)}
                  className="mt-3 rounded-full bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white"
                >
                  Reload &amp; update
                </button>
              )}
            </div>
            <button
              onClick={close}
              aria-label="Dismiss"
              className="rounded-full p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
