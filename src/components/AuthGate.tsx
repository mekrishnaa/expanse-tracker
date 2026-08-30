import { Cloud } from 'lucide-react'
import { useAuth } from '../store/useAuth'
import { AuthForm } from './AuthForm'

/**
 * Startup gate: prompts to sign in / create an account, or continue as a guest.
 * Guests use the app fully offline; signing in enables cloud sync.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, guestMode, continueAsGuest } = useAuth()

  if (user || guestMode) return <>{children}</>

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
        <AuthForm showGuest onGuest={continueAsGuest} />
      </div>
    </div>
  )
}
