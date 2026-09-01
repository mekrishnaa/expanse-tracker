import { useEffect, useState } from 'react'
import { useAuth } from '../store/useAuth'
import { ensureScopeReady } from './scope'

/**
 * Switches to the correct isolated local database whenever the logged-in
 * account (or guest mode) changes, and returns a version number that changes
 * every time so callers can force a full remount to re-subscribe live
 * queries to the newly active database.
 */
export function useScopeSync() {
  const familyId = useAuth((s) => s.user?.familyId ?? null)
  const [state, setState] = useState({ ready: false, version: 0 })

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ready: false, version: s.version }))
    ensureScopeReady().then(() => {
      if (cancelled) return
      setState((s) => ({ ready: true, version: s.version + 1 }))
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId])

  return state
}
