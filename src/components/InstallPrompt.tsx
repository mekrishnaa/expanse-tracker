import { AnimatePresence, motion } from 'framer-motion'
import { Download, Share, SquarePlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useInstall } from '../store/useInstall'

const DISMISS_KEY = 'fet-install-dismissed'

export function InstallPrompt() {
  const { deferred, installed, isIOS, promptInstall } = useInstall()
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === '1',
  )
  const [showIOS, setShowIOS] = useState(false)

  // On iOS there is no install event, so surface manual instructions instead.
  useEffect(() => {
    if (isIOS && !installed && !dismissed) {
      const t = setTimeout(() => setShowIOS(true), 2500)
      return () => clearTimeout(t)
    }
  }, [isIOS, installed, dismissed])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
    setShowIOS(false)
  }

  const install = async () => {
    const ok = await promptInstall()
    if (ok) dismiss()
  }

  const visible =
    !installed && !dismissed && ((deferred && !isIOS) || (isIOS && showIOS))

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed inset-x-3 bottom-24 z-[75] mx-auto max-w-sm rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-lg)] lg:bottom-6"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white">
              <Download size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Install Family Expense Tracker</p>
              {isIOS ? (
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Tap{' '}
                  <Share size={13} className="inline align-text-bottom" /> Share,
                  then{' '}
                  <SquarePlus
                    size={13}
                    className="inline align-text-bottom"
                  />{' '}
                  <span className="font-semibold">Add to Home Screen</span>.
                </p>
              ) : (
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Add it to your home screen for a full-screen, offline app
                  experience.
                </p>
              )}
              {!isIOS && (
                <button
                  onClick={install}
                  className="mt-3 rounded-full bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white"
                >
                  Install app
                </button>
              )}
            </div>
            <button
              onClick={dismiss}
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
