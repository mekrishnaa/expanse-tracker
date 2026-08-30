import { useEffect } from 'react'
import { useAuth } from '../store/useAuth'
import { syncToCloud } from './cloud'

// Local hour (24h) from which a daily auto-sync is allowed to run.
const AUTO_SYNC_HOUR = 2

/**
 * Runs a once-per-day cloud sync for logged-in users who enabled auto-sync.
 * Syncs overnight while the app is open, or catches up on the next open.
 */
export function useAutoSync() {
  const user = useAuth((s) => s.user)
  const autoSync = useAuth((s) => s.autoSync)

  useEffect(() => {
    if (!user || !autoSync) return
    let cancelled = false

    const run = async () => {
      const state = useAuth.getState()
      if (!state.user || !state.autoSync) return
      const today = new Date().toISOString().slice(0, 10)
      if (state.lastAutoSync === today) return
      if (new Date().getHours() < AUTO_SYNC_HOUR) return
      try {
        await syncToCloud()
        if (!cancelled) useAuth.getState().markAutoSynced()
      } catch {
        // Ignore failures; the next interval will retry.
      }
    }

    run()
    const id = setInterval(run, 15 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [user, autoSync])
}
