import { AnimatePresence, motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { db } from '../../db/db'
import type { Category, FamilyMember, Transaction } from '../../db/types'
import { formatDate, useMoney } from '../../lib/format'
import { useSettings } from '../../store/useSettings'
import { useUI } from '../../store/useUI'
import { Icon } from '../ui/Icon'

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
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const memMap = new Map(members.map((m) => [m.id, m]))

  return (
    <ul className="space-y-2">
      <AnimatePresence initial={false}>
        {transactions.map((t) => {
          const cat = catMap.get(t.categoryId)
          const mem = memMap.get(t.memberId)
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
              className="group flex items-center gap-3 rounded-[calc(var(--radius)*0.7)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
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
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => openTxnModal(t.type, t)}
                  aria-label="Edit"
                  className="rounded-full p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => t.id && db.transactions.delete(t.id)}
                  aria-label="Delete"
                  className="rounded-full p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-danger)]/15 hover:text-[var(--color-danger)]"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.li>
          )
        })}
      </AnimatePresence>
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
