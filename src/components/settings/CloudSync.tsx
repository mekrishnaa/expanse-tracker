import { useEffect, useState } from 'react'
import { Bell, CloudDownload, CloudUpload, LogIn, LogOut } from 'lucide-react'
import { useAuth } from '../../store/useAuth'
import { useUI } from '../../store/useUI'
import { restoreFromCloud, syncToCloud } from '../../lib/cloud'
import {
  getPushSubscription,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from '../../lib/push'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { SettingRow, Toggle } from './controls'

export function CloudSync() {
  const { user, family, logout, autoSync, lastAutoSync, setAutoSync } =
    useAuth()
  const openLogin = useUI((s) => s.openLogin)
  const [busy, setBusy] = useState<null | 'sync' | 'restore'>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pushOn, setPushOn] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)

  useEffect(() => {
    if (!user || !pushSupported()) return
    getPushSubscription().then((sub) => setPushOn(Boolean(sub)))
  }, [user])

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

  const onSync = async () => {
    if (!confirm('Upload all local data to the cloud, replacing cloud data?'))
      return
    setBusy('sync')
    setMessage(null)
    try {
      const inserted = await syncToCloud()
      const total = Object.values(inserted).reduce((a, b) => a + b, 0)
      setMessage(`Synced ${total} records to the cloud.`)
    } catch (err) {
      setMessage(`Sync failed: ${(err as Error).message}`)
    } finally {
      setBusy(null)
    }
  }

  const onRestore = async () => {
    if (
      !confirm('Download cloud data and REPLACE all local data on this device?')
    )
      return
    setBusy('restore')
    setMessage(null)
    try {
      await restoreFromCloud()
      setMessage('Local data restored from the cloud.')
    } catch (err) {
      setMessage(`Restore failed: ${(err as Error).message}`)
    } finally {
      setBusy(null)
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
            label="Sync to cloud"
            hint="Upload this device's data, replacing cloud data"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onSync}
              disabled={busy !== null}
            >
              <CloudUpload size={16} />
              {busy === 'sync' ? 'Syncing…' : 'Sync'}
            </Button>
          </SettingRow>

          <SettingRow
            label="Restore from cloud"
            hint="Replace this device's data with cloud data"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onRestore}
              disabled={busy !== null}
            >
              <CloudDownload size={16} />
              {busy === 'restore' ? 'Restoring…' : 'Restore'}
            </Button>
          </SettingRow>

          <SettingRow
            label="Nightly auto-sync"
            hint={
              lastAutoSync
                ? `Last auto-sync: ${lastAutoSync}`
                : 'Automatically upload data to the cloud overnight'
            }
          >
            <Toggle checked={autoSync} onChange={setAutoSync} />
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
