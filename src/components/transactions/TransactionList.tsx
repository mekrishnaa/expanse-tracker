import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { Category, FamilyMember, Transaction } from '../../db/types'
import { formatDate, useMoney } from '../../lib/format'
import { useAllBudgets } from '../../lib/hooks'
import { useSettings } from '../../store/useSettings'
import { useUI } from '../../store/useUI'
import { Icon } from '../ui/Icon'
import { TransactionDetails } from './TransactionDetails'

export function TransactionList({
  transactions,
  categories,
  members,
}: {
  transactions: Transaction[]
  categories: Category[]
  members: FamilyMember[]
}) {
  const money = useMoney()
  const dateFormat = useSettings((s) => s.dateFormat)
  const openTxnModal = useUI((s) => s.openTxnModal)
  const budgets = useAllBudgets()
  const [detail, setDetail] = useState<Transaction | null>(null)
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const memMap = new Map(members.map((m) => [m.id, m]))
  const budgetMap = new Map(budgets.map((b) => [b.id, b]))

  return (
    <ul className="space-y-2">
      <AnimatePresence initial={false}>
        {transactions.map((t) => {
          const cat = catMap.get(t.categoryId)
          const mem = memMap.get(t.memberId)
          const budget = t.budgetId ? budgetMap.get(t.budgetId) : undefined
          const isIncome = t.type === 'income'
          const isTransfer = t.type === 'transfer'
          const color = cat?.color ?? 'var(--color-secondary)'
          return (
            <motion.li
              layout
              key={t.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={() => setDetail(t)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setDetail(t)}
              className="flex cursor-pointer items-center gap-3 rounded-[calc(var(--radius)*0.7)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-colors hover:bg-[var(--color-surface-2)] active:bg-[var(--color-surface-2)]"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg"
                style={{ background: `${color}22`, color }}
              >
                {cat?.emoji ?? (isTransfer ? '🔁' : '💸')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {t.description || cat?.name || (isTransfer ? 'Transfer' : 'Transaction')}
                </p>
                <p className="truncate text-xs text-[var(--color-text-muted)]">
                  {formatDate(t.date, dateFormat)}
                  {mem && ` · ${mem.avatar} ${mem.name}`}
                  {t.paymentMethod && ` · ${t.paymentMethod}`}
                </p>
                {budget?.name && (
                  <span
                    className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: `${color}22`, color }}
                  >
                    {budget.name}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p
                  className="text-sm font-bold"
                  style={{
                    color: isIncome
                      ? 'var(--color-success)'
                      : isTransfer
                        ? 'var(--color-text)'
                        : 'var(--color-danger)',
                  }}
                >
                  {isIncome ? '+' : isTransfer ? '' : '−'}
                  {money(t.amount)}
                </p>
              </div>
              <ChevronRight
                size={18}
                className="shrink-0 text-[var(--color-text-muted)]"
              />
            </motion.li>
          )
        })}
      </AnimatePresence>

      <TransactionDetails
        txn={detail}
        onClose={() => setDetail(null)}
        onEdit={(t) => {
          setDetail(null)
          openTxnModal(t.type, t)
        }}
      />
    </ul>
  )
}

export function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: string
  label: string
  value: string
  color: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-xl"
        style={{ background: `${color}22`, color }}
      >
        <Icon name={icon} size={16} />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
        <p className="text-sm font-bold">{value}</p>
      </div>
    </div>
  )
}
