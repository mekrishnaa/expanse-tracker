import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCategories, useMembers, useTransactions } from '../lib/hooks'
import { useMoney } from '../lib/format'
import { cn } from '../lib/utils'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { TransactionList } from '../components/transactions/TransactionList'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function Calendar() {
  const money = useMoney()
  const txns = useTransactions()
  const categories = useCategories()
  const members = useMembers()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [selected, setSelected] = useState<string | null>(null)

  const monthKeyStr = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}`

  const dayTotals = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>()
    for (const t of txns) {
      if (!t.date.startsWith(monthKeyStr)) continue
      const cur = map.get(t.date) ?? { income: 0, expense: 0 }
      if (t.type === 'income') cur.income += t.amount
      else if (t.type === 'expense') cur.expense += t.amount
      map.set(t.date, cur)
    }
    return map
  }, [txns, monthKeyStr])

  const firstDay = new Date(cursor.year, cursor.month, 1).getDay()
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const shift = (delta: number) => {
    setSelected(null)
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const selectedTxns = selected
    ? txns.filter((t) => t.date === selected)
    : []
  const today = new Date().toISOString().slice(0, 10)
  const monthLabel = new Date(cursor.year, cursor.month).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div>
      <PageHeader title="Calendar" subtitle="Tap a day to see its transactions" />

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => shift(-1)}
            className="rounded-full p-2 hover:bg-[var(--color-surface-2)]"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="font-bold">{monthLabel}</h3>
          <button
            onClick={() => shift(1)}
            className="rounded-full p-2 hover:bg-[var(--color-surface-2)]"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="py-1 text-xs font-semibold text-[var(--color-text-muted)]">
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />
            const iso = `${monthKeyStr}-${String(day).padStart(2, '0')}`
            const t = dayTotals.get(iso)
            const isToday = iso === today
            const isSelected = iso === selected
            return (
              <button
                key={i}
                onClick={() => setSelected(iso)}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-sm transition-colors',
                  isSelected
                    ? 'bg-[var(--color-primary)] text-white'
                    : isToday
                      ? 'bg-[var(--color-primary)]/15 font-bold text-[var(--color-primary)]'
                      : 'hover:bg-[var(--color-surface-2)]',
                )}
              >
                <span>{day}</span>
                <span className="flex gap-0.5">
                  {t?.expense ? (
                    <span className="h-1 w-1 rounded-full bg-[var(--color-danger)]" />
                  ) : null}
                  {t?.income ? (
                    <span className="h-1 w-1 rounded-full bg-[var(--color-success)]" />
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {selected && (
        <Card className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">
              {new Date(selected + 'T00:00:00').toLocaleDateString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h3>
            {(() => {
              const t = dayTotals.get(selected)
              return t ? (
                <span className="text-sm">
                  <span className="text-[var(--color-success)]">
                    +{money(t.income)}
                  </span>{' '}
                  <span className="text-[var(--color-danger)]">
                    −{money(t.expense)}
                  </span>
                </span>
              ) : null
            })()}
          </div>
          {selectedTxns.length ? (
            <TransactionList
              transactions={selectedTxns}
              categories={categories}
              members={members}
            />
          ) : (
            <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">
              No transactions on this day.
            </p>
          )}
        </Card>
      )}
    </div>
  )
}
