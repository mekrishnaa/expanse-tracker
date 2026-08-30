import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { useUI } from '../../store/useUI'
import { Icon } from '../ui/Icon'
import { BOTTOM_NAV } from './nav'

export function BottomNav() {
  const openTxnModal = useUI((s) => s.openTxnModal)
  const left = BOTTOM_NAV.slice(0, 2)
  const right = BOTTOM_NAV.slice(2)

  const link = (item: (typeof BOTTOM_NAV)[number]) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors',
          isActive
            ? 'text-[var(--color-primary)]'
            : 'text-[var(--color-text-muted)]',
        )
      }
    >
      <Icon name={item.icon} size={22} />
      <span>{item.label.split(' ')[0]}</span>
    </NavLink>
  )

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <div className="glassable relative mx-auto flex max-w-lg items-center border-t border-[var(--color-border)] bg-[var(--color-surface)] px-2 pb-[env(safe-area-inset-bottom)] pt-1">
        {left.map(link)}
        <div className="w-16 shrink-0" />
        {right.map(link)}

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => openTxnModal('expense')}
          aria-label="Add transaction"
          className="absolute -top-6 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-[var(--shadow-lg)] ring-4 ring-[var(--color-bg)]"
        >
          <Plus size={26} />
        </motion.button>
      </div>
    </div>
  )
}
