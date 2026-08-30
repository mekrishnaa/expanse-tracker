import { motion } from 'framer-motion'
import { ChevronLeft, Wallet } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { useUI } from '../../store/useUI'
import { Icon } from '../ui/Icon'
import { NAV_ITEMS } from './nav'

export function Sidebar() {
  const collapsed = useUI((s) => s.sidebarCollapsed)
  const toggle = useUI((s) => s.toggleSidebar)

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-svh shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-[width] duration-300 lg:flex',
        collapsed ? 'w-20' : 'w-64',
      )}
    >
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-[var(--shadow-md)]">
          <Wallet size={22} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold leading-tight">
              Family Expenses
            </p>
            <p className="truncate text-xs text-[var(--color-text-muted)]">
              Budget together
            </p>
          </div>
        )}
      </div>

      <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-2" data-tour="nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            title={item.label}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-[calc(var(--radius)*0.6)] px-3 py-2.5 text-sm font-semibold transition-colors',
                isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]',
                collapsed && 'justify-center',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="side-active"
                    className="absolute inset-0 -z-0 rounded-[calc(var(--radius)*0.6)] bg-[var(--color-primary)]/12"
                  />
                )}
                <Icon name={item.icon} size={20} className="relative z-10" />
                {!collapsed && (
                  <span className="relative z-10 truncate">{item.label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={toggle}
        className="m-3 flex items-center justify-center gap-2 rounded-[calc(var(--radius)*0.6)] py-2.5 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)]"
      >
        <ChevronLeft
          size={18}
          className={cn('transition-transform', collapsed && 'rotate-180')}
        />
        {!collapsed && 'Collapse'}
      </button>
    </aside>
  )
}
