import { motion } from 'framer-motion'

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 flex items-end justify-between gap-3"
    >
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </motion.div>
  )
}
