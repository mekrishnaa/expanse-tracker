import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../ui/Button'
import { useTour } from '../../store/useTour'

interface Step {
  title: string
  body: string
  selector: string | null // null = centered, no highlight
}

const STEPS: Step[] = [
  {
    title: 'Welcome to Family Expense Tracker 👋',
    body: 'Track your family’s money together — expenses, income, budgets, savings and more. Here’s a quick 20-second tour.',
    selector: null,
  },
  {
    title: 'Add anything, fast',
    body: 'Use this button to add an expense, income or transfer. On phones, tap the big ➕ in the bottom bar.',
    selector: '[data-tour="add"]',
  },
  {
    title: 'Search everything',
    body: 'Instantly find any transaction by note, merchant, amount or tag.',
    selector: '[data-tour="search"]',
  },
  {
    title: 'Light or dark, your way',
    body: 'Switch themes anytime. You can fully customize colors, fonts and shapes in Settings.',
    selector: '[data-tour="theme"]',
  },
  {
    title: 'Everything is one tap away',
    body: 'Jump between Dashboard, Budgets, Reports, Bills and more from here.',
    selector: '[data-tour="nav"]',
  },
  {
    title: 'You’re all set 🎉',
    body: 'Add your first expense to watch the charts come alive. You can replay this tour anytime from Settings.',
    selector: null,
  },
]

const CARD_W = 320

function findTarget(selector: string): HTMLElement | null {
  const els = Array.from(
    document.querySelectorAll<HTMLElement>(selector),
  )
  return (
    els.find((el) => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0
    }) ?? null
  )
}

export function Tour() {
  const { open, step, next, prev, stop } = useTour()
  const [rect, setRect] = useState<DOMRect | null>(null)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const measure = useCallback(() => {
    if (!open || !current) return
    if (!current.selector) {
      setRect(null)
      return
    }
    const el = findTarget(current.selector)
    if (!el) {
      setRect(null)
      return
    }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setRect(el.getBoundingClientRect())
  }, [open, current])

  useLayoutEffect(() => {
    measure()
    // Re-measure shortly after in case of scroll/layout settle.
    const t = setTimeout(measure, 260)
    return () => clearTimeout(t)
  }, [measure, step])

  useEffect(() => {
    if (!open) return
    const onChange = () => measure()
    window.addEventListener('resize', onChange)
    window.addEventListener('scroll', onChange, true)
    return () => {
      window.removeEventListener('resize', onChange)
      window.removeEventListener('scroll', onChange, true)
    }
  }, [open, measure])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stop()
      else if (e.key === 'ArrowRight') !isLast ? next() : stop()
      else if (e.key === 'ArrowLeft') prev()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, isLast, next, prev, stop])

  if (!open || !current) return null

  const pad = 8
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Tooltip position
  let cardStyle: React.CSSProperties
  if (!rect) {
    cardStyle = {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    }
  } else {
    const below = rect.bottom + 12
    const placeBelow = below + 190 < vh
    const top = placeBelow ? below : Math.max(12, rect.top - 190 - 12)
    let left = rect.left + rect.width / 2 - CARD_W / 2
    left = Math.max(12, Math.min(left, vw - CARD_W - 12))
    cardStyle = { left, top }
  }

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      {/* Click-catcher blocks the app while touring */}
      <div className="absolute inset-0" onClick={() => stop()} />

      {/* Spotlight highlight */}
      {rect && (
        <motion.div
          initial={false}
          animate={{
            left: rect.left - pad,
            top: rect.top - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
          }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="pointer-events-none absolute rounded-2xl border-2 border-[var(--color-primary)]"
          style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' }}
        />
      )}
      {!rect && <div className="absolute inset-0 bg-black/60" />}

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="absolute w-[min(320px,calc(100vw-24px))] rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-lg)]"
          style={cardStyle}
        >
          <div className="mb-3 flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? 'w-5 bg-[var(--color-primary)]'
                    : 'w-1.5 bg-[var(--color-border)]'
                }`}
              />
            ))}
          </div>
          <h3 className="text-base font-bold">{current.title}</h3>
          <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
            {current.body}
          </p>
          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={() => stop()}
              className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Skip
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <Button size="sm" variant="outline" onClick={prev}>
                  Back
                </Button>
              )}
              <Button size="sm" onClick={() => (isLast ? stop() : next())}>
                {isLast ? 'Get started' : 'Next'}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body,
  )
}
