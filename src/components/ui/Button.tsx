import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface Props extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: Variant
  size?: Size
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--color-primary)] text-white shadow-[var(--shadow-md)] hover:brightness-110',
  secondary:
    'bg-[var(--color-secondary)] text-white shadow-[var(--shadow-md)] hover:brightness-110',
  outline:
    'border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)]',
  ghost: 'text-[var(--color-text)] hover:bg-[var(--color-surface-2)]',
  danger: 'bg-[var(--color-danger)] text-white hover:brightness-110',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-6 text-base gap-2',
  icon: 'h-10 w-10 justify-center',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={cn(
        'inline-flex items-center rounded-[calc(var(--radius)*0.6)] font-semibold transition-[filter,background-color,transform] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
}
