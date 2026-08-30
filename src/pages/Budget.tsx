import { useState } from 'react'
import { AlertTriangle, Plus } from 'lucide-react'
import { db } from '../db/db'
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

export function Budget() {
  const money = useMoney()
  const month = monthKey()
  const budgets = useBudgets(month)
  const categories = useCategories()
  const txns = useMonthTransactions(month)
  const [open, setOpen] = useState(false)
  const [catId, setCatId] = useState('')
  const [name, setName] = useState('')
  const [limit, setLimit] = useState('')

  const expenseTxns = txns.filter((t) => t.type === 'expense')
  const spentByCat = new Map(
    totalsByCategory(expenseTxns).map((c) => [c.categoryId, c.total]),
  )
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const expenseCats = categories.filter((c) => c.type === 'expense')

  // When a category has more than one budget, count only expenses explicitly
  // assigned to this budget; a lone budget owns all spending in its category.
  const spentForBudget = (b: (typeof budgets)[number]) => {
    const sameCat = budgets.filter((x) => x.categoryId === b.categoryId)
    if (sameCat.length <= 1) return spentByCat.get(b.categoryId) ?? 0
    return expenseTxns
      .filter((t) => t.budgetId === b.id)
      .reduce((a, t) => a + t.amount, 0)
  }

  const totalLimit = budgets.reduce((a, b) => a + b.limit, 0)
  const totalSpent = budgets.reduce((a, b) => a + spentForBudget(b), 0)

  const save = async (keepOpen = false) => {
    if (!catId || !limit) return
    const trimmedName = name.trim()
    const existing = budgets.find(
      (b) =>
        b.categoryId === Number(catId) &&
        (b.name ?? '') === trimmedName,
    )
    if (existing?.id) {
      await db.budgets.update(existing.id, {
        limit: Number(limit),
        name: trimmedName || undefined,
      })
    } else {
      await db.budgets.add({
        categoryId: Number(catId),
        month,
        limit: Number(limit),
        name: trimmedName || undefined,
      })
    }
    // Keep the category selected so adding several budgets for it is quick.
    setName('')
    setLimit('')
    if (!keepOpen) {
      setOpen(false)
      setCatId('')
    }
  }

  return (
    <div>
      <PageHeader
        title="Budget"
        subtitle={`${money(totalSpent)} of ${money(totalLimit)} spent this month`}
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus size={18} /> Set budget
          </Button>
        }
      />

      {budgets.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {budgets.map((b) => {
            const cat = catMap.get(b.categoryId)
            const spent = spentForBudget(b)
            const ratio = b.limit ? spent / b.limit : 0
            const over = spent > b.limit
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
                        {money(spent)} / {money(b.limit)}
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
                      ? `${money(spent - b.limit)} over`
                      : `${money(b.limit - spent)} left`}
                  </span>
                </div>
                <button
                  onClick={() => b.id && db.budgets.delete(b.id)}
                  className="mt-2 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                >
                  Remove
                </button>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon="PiggyBank"
            title="No budgets set"
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
