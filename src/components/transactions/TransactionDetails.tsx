import { Pencil, Trash2 } from 'lucide-react'
import type { Transaction } from '../../db/types'
import { db } from '../../db/db'
import { formatDate, useMoney } from '../../lib/format'
import {
  useAccounts,
  useAllBudgets,
  useCategories,
  useMembers,
} from '../../lib/hooks'
import { useSettings } from '../../store/useSettings'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-xs font-semibold text-[var(--color-text-muted)]">
        {label}
      </span>
      <span className="max-w-[65%] text-right text-sm font-medium">{value}</span>
    </div>
  )
}

export function TransactionDetails({
  txn,
  onClose,
  onEdit,
}: {
  txn: Transaction | null
  onClose: () => void
  onEdit: (t: Transaction) => void
}) {
  const money = useMoney()
  const dateFormat = useSettings((s) => s.dateFormat)
  const categories = useCategories()
  const members = useMembers()
  const accounts = useAccounts()
  const budgets = useAllBudgets()

  if (!txn) return null

  const cat = categories.find((c) => c.id === txn.categoryId)
  const mem = members.find((m) => m.id === txn.memberId)
  const account = accounts.find((a) => a.id === txn.accountId)
  const toAccount = accounts.find((a) => a.id === txn.toAccountId)
  const budget = budgets.find((b) => b.id === txn.budgetId)

  const isIncome = txn.type === 'income'
  const isTransfer = txn.type === 'transfer'
  const amountColor = isIncome
    ? 'var(--color-success)'
    : isTransfer
      ? 'var(--color-text)'
      : 'var(--color-danger)'

  const remove = async () => {
    if (!txn.id) return
    if (!window.confirm('Delete this transaction?')) return
    await db.transactions.delete(txn.id)
    onClose()
  }

  return (
    <Modal open={!!txn} onClose={onClose} title="Transaction details">
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-1 py-2 text-center">
          <div
            className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
            style={{
              background: `${cat?.color ?? 'var(--color-secondary)'}22`,
              color: cat?.color ?? 'var(--color-secondary)',
            }}
          >
            {cat?.emoji ?? (isTransfer ? '🔁' : '💸')}
          </div>
          <p className="text-3xl font-extrabold" style={{ color: amountColor }}>
            {isIncome ? '+' : isTransfer ? '' : '−'}
            {money(txn.amount)}
          </p>
          <span className="rounded-full bg-[var(--color-surface-2)] px-3 py-0.5 text-xs font-semibold capitalize text-[var(--color-text-muted)]">
            {txn.type}
          </span>
        </div>

        <div className="divide-y divide-[var(--color-border)] rounded-[calc(var(--radius)*0.7)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4">
          <Row label="Description" value={txn.description} />
          <Row
            label="Category"
            value={cat ? `${cat.emoji ?? ''} ${cat.name}` : undefined}
          />
          <Row label="Budget" value={budget?.name} />
          <Row
            label="Member"
            value={mem ? `${mem.avatar ?? ''} ${mem.name}` : undefined}
          />
          <Row
            label={isTransfer ? 'From' : 'Account'}
            value={account?.name}
          />
          <Row label="To" value={toAccount?.name} />
          <Row label="Payment method" value={txn.paymentMethod} />
          <Row label="Merchant" value={txn.merchant} />
          <Row label="Date" value={formatDate(txn.date, dateFormat)} />
          <Row label="Time" value={txn.time} />
          <Row label="Location" value={txn.location} />
          <Row
            label="Tags"
            value={
              txn.tags?.length ? (
                <span className="flex flex-wrap justify-end gap-1">
                  {txn.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </span>
              ) : undefined
            }
          />
          <Row label="Notes" value={txn.notes} />
        </div>

        {txn.receipt && (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-[var(--color-text-muted)]">
              Receipt
            </p>
            <img
              src={txn.receipt}
              alt="Receipt"
              className="max-h-64 w-full rounded-[calc(var(--radius)*0.6)] object-contain"
            />
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="danger" className="flex-1" onClick={remove}>
            <Trash2 size={16} /> Delete
          </Button>
          <Button className="flex-1" onClick={() => onEdit(txn)}>
            <Pencil size={16} /> Edit
          </Button>
        </div>
      </div>
    </Modal>
  )
}
