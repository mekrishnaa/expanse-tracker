import { cn } from '../../lib/utils'

export function ProgressBar({
  value,
  color = 'var(--color-primary)',
  className,
  height = 8,
}: {
  value: number // 0..1
  color?: string
  className?: string
  height?: number
}) {
  const pct = Math.max(0, Math.min(1, isFinite(value) ? value : 0)) * 100
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]',
        className,
      )}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}
