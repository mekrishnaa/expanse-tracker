import { useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { db } from '../db/db'
import type { Budget as BudgetT, Transaction } from '../db/types'
import { useBudgets, useCategories, useMonthTransactions } from '../lib/hooks'
import { monthKey, useMoney } from '../lib/format'
import { totalsByCategory } from '../lib/stats'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { ProgressBar } from '../components/ui/ProgressBar'

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function computeSpent(
  b: BudgetT,
  budgets: BudgetT[],
  expenseTxns: Transaction[],
  spentByCat: Map<number | undefined, number>,
): number {
  const sameCat = budgets.filter((x) => x.categoryId === b.categoryId)
  if (sameCat.length <= 1) return spentByCat.get(b.categoryId) ?? 0
  return expenseTxns
    .filter((t) => t.budgetId === b.id)
    .reduce((a, t) => a + t.amount, 0)
}

export function Budget() {
  const money = useMoney()
  const [month, setMonth] = useState(monthKey())
  const prevMonth = shiftMonth(month, -1)
  const budgets = useBudgets(month)
  const prevBudgets = useBudgets(prevMonth)
  const categories = useCategories()
  const txns = useMonthTransactions(month)
  const prevTxns = useMonthTransactions(prevMonth)
  const [open, setOpen] = useState(false)
  const [catId, setCatId] = useState('')
  const [name, setName] = useState('')
  const [limit, setLimit] = useState('')
  const [rollover, setRollover] = useState(false)

  const expenseTxns = txns.filter((t) => t.type === 'expense')
  const prevExpenseTxns = prevTxns.filter((t) => t.type === 'expense')
  const spentByCat = new Map(
    totalsByCategory(expenseTxns).map((c) => [c.categoryId, c.total]),
  )
  const prevSpentByCat = new Map(
    totalsByCategory(prevExpenseTxns).map((c) => [c.categoryId, c.total]),
  )
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const expenseCats = categories.filter((c) => c.type === 'expense')

  const spentForBudget = (b: BudgetT) =>
    computeSpent(b, budgets, expenseTxns, spentByCat)

  // Leftover carried from last month's matching budget when rollover is on.
  const rolloverFor = (b: BudgetT): number => {
    if (!b.rollover) return 0
    const prev = prevBudgets.find(
      (p) => p.categoryId === b.categoryId && (p.name ?? '') === (b.name ?? ''),
    )
    if (!prev) return 0
    const prevSpent = computeSpent(prev, prevBudgets, prevExpenseTxns, prevSpentByCat)
    return Math.max(0, prev.limit - prevSpent)
  }

  const effectiveLimit = (b: BudgetT) => b.limit + rolloverFor(b)

  const totalLimit = budgets.reduce((a, b) => a + effectiveLimit(b), 0)
  const totalSpent = budgets.reduce((a, b) => a + spentForBudget(b), 0)

  const monthLabel = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5, 7)) - 1,
  ).toLocaleString(undefined, { month: 'long', year: 'numeric' })
  const isCurrentMonth = month === monthKey()

  const save = async (keepOpen = false) => {
    if (!catId || !limit) return
    const trimmedName = name.trim()
    const sameCat = budgets.filter((b) => b.categoryId === Number(catId))
    const existing = sameCat.find((b) => (b.name ?? '') === trimmedName)
    // Guard: a second budget in the same category needs a distinguishing name.
    if (!existing && !trimmedName && sameCat.length >= 1) {
      alert(
        'This category already has a budget. Add a name (e.g. "Rent – Downtown") to keep them separate.',
      )
      return
    }
    if (existing?.id) {
      if (
        !window.confirm(
          `A budget named "${trimmedName || catMap.get(Number(catId))?.name}" already exists for this category. Update its limit?`,
        )
      )
        return
      await db.budgets.update(existing.id, {
        limit: Number(limit),
        name: trimmedName || undefined,
        rollover,
      })
    } else {
      await db.budgets.add({
        categoryId: Number(catId),
        month,
        limit: Number(limit),
        name: trimmedName || undefined,
        rollover,
      })
    }
    // Keep the category selected so adding several budgets for it is quick.
    setName('')
    setLimit('')
    if (!keepOpen) {
      setOpen(false)
      setCatId('')
      setRollover(false)
    }
  }

  // Warn when a category has multiple budgets but some lack a distinguishing name.
  const ambiguousCats = expenseCats.filter((c) => {
    const inCat = budgets.filter((b) => b.categoryId === c.id)
    return inCat.length > 1 && inCat.some((b) => !b.name)
  })

  return (
    <div>
      <PageHeader
        title="Budget"
        subtitle={`${money(totalSpent)} of ${money(totalLimit)} spent`}
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus size={18} /> Set budget
          </Button>
        }
      />

      <Card className="mb-4 flex items-center justify-between !py-2">
        <button
          onClick={() => setMonth(shiftMonth(month, -1))}
          aria-label="Previous month"
          className="rounded-full p-2 hover:bg-[var(--color-surface-2)]"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold">{monthLabel}</span>
        <button
          onClick={() => setMonth(shiftMonth(month, 1))}
          aria-label="Next month"
          className="rounded-full p-2 hover:bg-[var(--color-surface-2)]"
        >
          <ChevronRight size={18} />
        </button>
      </Card>

      {ambiguousCats.length > 0 && (
        <Card className="mb-4 !bg-[var(--color-warning)]/10 border-[var(--color-warning)]/40">
          <p className="text-xs font-semibold text-[var(--color-warning)]">
            ⚠️ {ambiguousCats.map((c) => c.name).join(', ')} have multiple budgets
            with no name — add names so each is easy to identify and assign
            expenses to.
          </p>
        </Card>
      )}

      {budgets.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {budgets.map((b) => {
            const cat = catMap.get(b.categoryId)
            const spent = spentForBudget(b)
            const roll = rolloverFor(b)
            const effLimit = b.limit + roll
            const ratio = effLimit ? spent / effLimit : 0
            const over = spent > effLimit
            const color = over ? 'var(--color-danger)' : cat?.color ?? 'var(--color-primary)'
            return (
              <Card key={b.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cat?.emoji ?? '📦'}</span>
                    <div>
                      <p className="font-semibold">
                        {b.name || cat?.name || 'Category'}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {b.name ? `${cat?.name ?? ''} · ` : ''}
                        {money(spent)} / {money(effLimit)}
                        {roll > 0 && ` · +${money(roll)} rolled over`}
                      </p>
                    </div>
                  </div>
                  {over && (
                    <span className="flex items-center gap-1 rounded-full bg-[var(--color-danger)]/15 px-2 py-1 text-xs font-semibold text-[var(--color-danger)]">
                      <AlertTriangle size={12} /> Over
                    </span>
                  )}
                </div>
                <ProgressBar value={ratio} color={color} className="mt-3" />
                <div className="mt-2 flex justify-between text-xs text-[var(--color-text-muted)]">
                  <span>{Math.round(ratio * 100)}% used</span>
                  <span>
                    {over
                      ? `${money(spent - effLimit)} over`
                      : `${money(effLimit - spent)} left`}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  {b.rollover && (
                    <span className="rounded-full bg-[var(--color-secondary)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-secondary)]">
                      Rollover on
                    </span>
                  )}
                  <button
                    onClick={() => b.id && db.budgets.delete(b.id)}
                    className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                  >
                    Remove
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon="PiggyBank"
            title={isCurrentMonth ? 'No budgets set' : 'No budgets this month'}
            subtitle="Set monthly limits per category and track overspending."
            action={
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus size={18} /> Set budget
              </Button>
            }
          />
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Set category budget">
        <div className="space-y-4">
          <Field label="Category">
            <Select value={catId} onChange={(e) => setCatId(e.target.value)}>
              <option value="">Select category</option>
              {expenseCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Budget name (optional)"
            hint="Add a label to keep several budgets in the same category, e.g. Rent – Downtown."
          >
            <Input
              placeholder="e.g. Rent – Downtown"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Monthly limit">
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={rollover}
              onChange={(e) => setRollover(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            Roll over unused amount to next month
          </label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => save(true)}
            >
              Save &amp; add another
            </Button>
            <Button className="flex-1" onClick={() => save(false)}>
              Save budget
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
