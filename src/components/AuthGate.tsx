import { useState } from 'react'
import { Cloud, UserRound } from 'lucide-react'
import { useAuth } from '../store/useAuth'
import { Button } from './ui/Button'
import { Field, Input } from './ui/Input'

type Mode = 'login' | 'register'

/**
 * Startup gate: prompts to sign in / create an account, or continue as a guest.
 * Guests use the app fully offline; signing in enables cloud sync.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, guestMode, login, register, continueAsGuest, loading, error } =
    useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [familyName, setFamilyName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (user || guestMode) return <>{children}</>

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (mode === 'login') await login(email, password)
      else await register(familyName, name, email, password)
    } catch {
      // error surfaced from the store
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-[var(--color-bg)] p-4">
      <div className="w-full max-w-sm rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)]">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white">
            <Cloud size={24} />
          </div>
          <h1 className="text-lg font-bold">Family Expense Tracker</h1>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Sign in to sync across devices, or continue as a guest on this
            device.
          </p>
        </div>

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

          <Button type="submit" className="w-full justify-center" disabled={loading}>
            {loading
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </Button>
        </form>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--color-border)]" />
          <span className="text-xs text-[var(--color-text-muted)]">or</span>
          <div className="h-px flex-1 bg-[var(--color-border)]" />
        </div>

        <Button
          variant="outline"
          className="mt-4 w-full justify-center"
          onClick={continueAsGuest}
        >
          <UserRound size={16} /> Continue as guest
        </Button>
        <p className="mt-2 text-center text-[11px] text-[var(--color-text-muted)]">
          Guest mode works offline. Cloud sync stays disabled until you sign in.
        </p>
      </div>
    </div>
  )
}
