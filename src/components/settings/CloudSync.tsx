import { useEffect, useState } from 'react'
import { Bell, CloudDownload, LogIn, LogOut, WifiOff } from 'lucide-react'
import { useAuth } from '../../store/useAuth'
import { useUI } from '../../store/useUI'
import { restoreFromCloud } from '../../lib/cloud'
import { withSyncSuspended } from '../../db/db'
import { pendingSyncCount, resetSyncState } from '../../lib/sync'
import {
  getPushSubscription,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from '../../lib/push'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { SettingRow } from './controls'

export function CloudSync() {
  const { user, family, logout } = useAuth()
  const openLogin = useUI((s) => s.openLogin)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [pushOn, setPushOn] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)
  const [pending, setPending] = useState(0)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    if (!user || !pushSupported()) return
    getPushSubscription().then((sub) => setPushOn(Boolean(sub)))
  }, [user])

  useEffect(() => {
    if (!user) return
    const tick = () => pendingSyncCount().then(setPending)
    tick()
    const id = setInterval(tick, 3000)
    return () => clearInterval(id)
  }, [user])

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const togglePush = async () => {
    setPushBusy(true)
    setMessage(null)
    try {
      if (pushOn) {
        await unsubscribeFromPush()
        setPushOn(false)
        setMessage('Push reminders disabled on this device.')
      } else {
        await subscribeToPush()
        setPushOn(true)
        setMessage('Push reminders enabled on this device.')
      }
    } catch (err) {
      setMessage(`Push setup failed: ${(err as Error).message}`)
    } finally {
      setPushBusy(false)
    }
  }

  const onForceRefresh = async () => {
    if (
      !confirm(
        'Replace all local data on this device with the latest data from the server?',
      )
    )
      return
    setBusy(true)
    setMessage(null)
    try {
      await withSyncSuspended(() => restoreFromCloud())
      // Local ids were just renumbered by the restore, so previous
      // server-id mappings and any queued changes no longer apply.
      await resetSyncState()
      setMessage('Local data refreshed from the server.')
    } catch (err) {
      setMessage(`Refresh failed: ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="mb-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xl">☁️</span>
        <h3 className="font-bold">Cloud Sync</h3>
      </div>

      {!user ? (
        <div className="flex flex-col items-start gap-3 py-2">
          <p className="text-xs text-[var(--color-text-muted)]">
            You're using the app as a guest. Sign in to back up your data,
            sync across devices, and get bill &amp; budget reminders.
          </p>
          <Button size="sm" onClick={openLogin}>
            <LogIn size={16} /> Sign in
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-border)]">
          <SettingRow
            label={`Signed in as ${user.email}`}
            hint={family ? `Family: ${family.name}` : undefined}
          >
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut size={16} /> Sign out
            </Button>
          </SettingRow>

          <SettingRow
            label={online ? 'Synced automatically' : 'Offline'}
            hint={
              !online
                ? `${pending} change${pending === 1 ? '' : 's'} queued — will sync when you're back online`
                : pending > 0
                  ? `${pending} change${pending === 1 ? '' : 's'} syncing…`
                  : 'Every change is saved to the cloud in real time'
            }
          >
            {!online ? (
              <WifiOff size={18} className="text-[var(--color-text-muted)]" />
            ) : pending > 0 ? (
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--color-warning)]" />
            ) : (
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-success)]" />
            )}
          </SettingRow>

          <SettingRow
            label="Force refresh from server"
            hint="Replace this device's data with the latest from the server"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onForceRefresh}
              disabled={busy}
            >
              <CloudDownload size={16} />
              {busy ? 'Refreshing…' : 'Refresh'}
            </Button>
          </SettingRow>

          <SettingRow
            label="Push reminders (this device)"
            hint={
              pushSupported()
                ? 'Get bill & budget alerts even when the app is closed'
                : 'Not supported on this browser'
            }
          >
            <Button
              variant="outline"
              size="sm"
              onClick={togglePush}
              disabled={pushBusy || !pushSupported()}
            >
              <Bell size={16} />
              {pushBusy ? 'Working…' : pushOn ? 'Disable' : 'Enable'}
            </Button>
          </SettingRow>

          {message && (
            <p className="py-2 text-xs font-semibold text-[var(--color-primary)]">
              {message}
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
