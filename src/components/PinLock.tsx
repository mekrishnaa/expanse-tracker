import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Delete, Lock } from 'lucide-react'
import { useSettings } from '../store/useSettings'

export function PinLock({ children }: { children: React.ReactNode }) {
  const pinEnabled = useSettings((s) => s.pinEnabled)
  const pin = useSettings((s) => s.pin)
  const [unlocked, setUnlocked] = useState(!pinEnabled)
  const [entry, setEntry] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!pinEnabled) setUnlocked(true)
  }, [pinEnabled])

  useEffect(() => {
    if (entry.length === 4) {
      if (entry === pin) {
        setUnlocked(true)
      } else {
        setError(true)
        setTimeout(() => {
          setEntry('')
          setError(false)
        }, 500)
      }
    }
  }, [entry, pin])

  if (unlocked) return <>{children}</>

  const press = (d: string) => setEntry((e) => (e.length < 4 ? e + d : e))

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[var(--color-bg)] p-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--color-primary)] text-white shadow-[var(--shadow-lg)]">
        <Lock size={28} />
      </div>
      <p className="font-bold">Enter your PIN</p>
      <motion.div
        animate={error ? { x: [-8, 8, -8, 8, 0] } : {}}
        className="flex gap-3"
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full border-2 ${
              entry.length > i
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                : 'border-[var(--color-border)]'
            }`}
          />
        ))}
      </motion.div>
      <div className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            onClick={() => press(d)}
            className="h-16 w-16 rounded-2xl bg-[var(--color-surface)] text-xl font-bold shadow-[var(--shadow-sm)] active:scale-95"
          >
            {d}
          </button>
        ))}
        <span />
        <button
          onClick={() => press('0')}
          className="h-16 w-16 rounded-2xl bg-[var(--color-surface)] text-xl font-bold shadow-[var(--shadow-sm)] active:scale-95"
        >
          0
        </button>
        <button
          onClick={() => setEntry((e) => e.slice(0, -1))}
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-[var(--color-text-muted)]"
        >
          <Delete size={22} />
        </button>
      </div>
    </div>
  )
}
