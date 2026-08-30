interface Props {
  progress: number // 0..1
  size?: number
  stroke?: number
  color?: string
  track?: string
  children?: React.ReactNode
}

export function ProgressRing({
  progress,
  size = 120,
  stroke = 12,
  color = 'var(--color-primary)',
  track = 'var(--color-surface-2)',
  children,
}: Props) {
  const clamped = Math.max(0, Math.min(1, isFinite(progress) ? progress : 0))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - clamped)
  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}
