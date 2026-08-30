import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '../../lib/utils'

interface Props extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  interactive?: boolean
  padded?: boolean
}

export function Card({
  className,
  interactive,
  padded = true,
  children,
  ...props
}: Props) {
  return (
    <motion.div
      className={cn(
        'glassable rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]',
        padded && 'p-4 sm:p-5',
        interactive &&
          'cursor-pointer transition-shadow hover:shadow-[var(--shadow-md)]',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
