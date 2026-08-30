import { useState } from 'react'
import { useAuth } from '../store/useAuth'
import { Button } from './ui/Button'
import { Field, Input } from './ui/Input'

type Mode = 'login' | 'register'

/** Shared login / register form used by the startup gate and the login modal. */
export function AuthForm({
  onSuccess,
  showGuest,
  onGuest,
}: {
  onSuccess?: () => void
  showGuest?: boolean
  onGuest?: () => void
}) {
  const { login, register, loading, error } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [familyName, setFamilyName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (mode === 'login') await login(email, password)
      else await register(familyName, name, email, password)
      onSuccess?.()
    } catch {
      // error surfaced from the store
    }
  }

  return (
    <div>
      <div className="mx-auto mb-4 flex w-fit gap-1 rounded-full bg-[var(--color-surface-2)] p-1">
        {(['login', 'register'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={
              'rounded-full px-4 py-1.5 text-xs font-semibold ' +
              (mode === m
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-text-muted)]')
            }
          >
            {m === 'login' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
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

        <Button
          type="submit"
          className="w-full justify-center"
          disabled={loading}
        >
          {loading
            ? 'Please wait…'
            : mode === 'login'
              ? 'Sign in'
              : 'Create account'}
        </Button>
      </form>

      {showGuest && (
        <>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-text-muted)]">or</span>
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>
          <Button
            variant="outline"
            className="mt-4 w-full justify-center"
            onClick={onGuest}
          >
            Continue as guest
          </Button>
          <p className="mt-2 text-center text-[11px] text-[var(--color-text-muted)]">
            Guest mode works offline. Cloud sync, backup, and reminders need an
            account.
          </p>
        </>
      )}
    </div>
  )
}
