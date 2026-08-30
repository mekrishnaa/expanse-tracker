import { Eye, EyeOff, Menu, Moon, Plus, Search, Sun } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../../store/useSettings'
import { useUI } from '../../store/useUI'
import { Button } from '../ui/Button'

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const mode = useSettings((s) => s.mode)
  const setSetting = useSettings((s) => s.set)
  const hideBalances = useSettings((s) => s.hideBalances)
  const openTxnModal = useUI((s) => s.openTxnModal)

  const toggleTheme = () =>
    setSetting('mode', mode === 'dark' ? 'light' : 'dark')

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) navigate(`/expenses?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <header className="glassable sticky top-0 z-30 flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 px-3 py-2.5 sm:px-5">
      <button
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="rounded-full p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] lg:hidden"
      >
        <Menu size={22} />
      </button>

      <form
        onSubmit={submitSearch}
        data-tour="search"
        className="relative flex-1 max-w-md"
      >
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search transactions…"
          className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] py-2 pl-10 pr-3 text-sm outline-none focus:border-[var(--color-primary)]"
        />
      </form>

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={() => setSetting('hideBalances', !hideBalances)}
          aria-label="Toggle hide balances"
          className="rounded-full p-2.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
        >
          {hideBalances ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          data-tour="theme"
          className="rounded-full p-2.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
        >
          {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <Button
          size="sm"
          data-tour="add"
          className="hidden sm:inline-flex"
          onClick={() => openTxnModal('expense')}
        >
          <Plus size={18} /> Add
        </Button>
      </div>
    </header>
  )
}
