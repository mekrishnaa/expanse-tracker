import { useState } from 'react'
import { Cloud, CloudDownload, CloudUpload, LogOut } from 'lucide-react'
import { useAuth } from '../../store/useAuth'
import { restoreFromCloud, syncToCloud } from '../../lib/cloud'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Field, Input } from '../ui/Input'
import { SettingRow, Toggle } from './controls'

type Mode = 'login' | 'register'

export function CloudSync() {
  const {
    user,
    family,
    login,
    register,
    logout,
    loading,
    error,
    autoSync,
    lastAutoSync,
    setAutoSync,
  } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [familyName, setFamilyName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState<null | 'sync' | 'restore'>(null)
  const [message, setMessage] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    try {
      if (mode === 'login') await login(email, password)
      else await register(familyName, name, email, password)
    } catch {
      // error is surfaced from the store
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
        <form onSubmit={submit} className="space-y-3 py-2">
          <p className="text-xs text-[var(--color-text-muted)]">
            Sign in to back up your data to the cloud and sync across devices.
            Your app keeps working offline either way.
          </p>

          <div className="flex gap-1 rounded-full bg-[var(--color-surface-2)] p-1 w-fit">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={
                  'rounded-full px-3 py-1.5 text-xs font-semibold capitalize ' +
                  (mode === m
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-text-muted)]')
                }
              >
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          {mode === 'register' && (
            <>
              <Field label="Family name">
                <Input
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="The Smiths"
                  required
                />
              </Field>
              <Field label="Your name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex"
                  required
                />
              </Field>
            </>
          )}

          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </Field>
          <Field label="Password" hint="At least 8 characters">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              required
            />
          </Field>

          {error && (
            <p className="text-xs font-semibold text-[var(--color-danger)]">
              {error}
            </p>
          )}

          <Button type="submit" size="sm" disabled={loading}>
            <Cloud size={16} />
            {loading
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </Button>
        </form>
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
