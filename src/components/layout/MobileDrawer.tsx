import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { Icon } from '../ui/Icon'
import { NAV_ITEMS } from './nav'

export function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-y-0 left-0 flex w-72 flex-col bg-[var(--color-surface)] shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <p className="font-extrabold">Menu</p>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="rounded-full p-2 hover:bg-[var(--color-surface-2)]"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto px-3 pb-6">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-[calc(var(--radius)*0.6)] px-3 py-3 text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-[var(--color-primary)]/12 text-[var(--color-primary)]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]',
                    )
                  }
                >
                  <Icon name={item.icon} size={20} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
