import { motion } from 'framer-motion'
import { Icon } from './Icon'

export function EmptyState({
  icon = 'Inbox',
  title,
  subtitle,
  action,
}: {
  icon?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--color-surface-2)] text-[var(--color-primary)]">
        <Icon name={icon} size={30} />
      </div>
      <div>
        <p className="text-lg font-bold">{title}</p>
        {subtitle && (
          <p className="mt-1 max-w-xs text-sm text-[var(--color-text-muted)]">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </motion.div>
  )
}
