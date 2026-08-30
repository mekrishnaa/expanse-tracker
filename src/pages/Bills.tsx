import { useState } from 'react'
import { CheckCircle2, Circle, Plus } from 'lucide-react'
import { db } from '../db/db'
import type { Bill, BillFrequency } from '../db/types'
import { useBills, useCategories } from '../lib/hooks'
import { formatDate, todayISO, useMoney } from '../lib/format'
import { useSettings } from '../store/useSettings'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'

const FREQ: BillFrequency[] = ['monthly', 'weekly', 'quarterly', 'yearly', 'once']

function advance(date: string, freq: BillFrequency): string {
  const d = new Date(date + 'T00:00:00')
  if (freq === 'weekly') d.setDate(d.getDate() + 7)
  else if (freq === 'monthly') d.setMonth(d.getMonth() + 1)
  else if (freq === 'quarterly') d.setMonth(d.getMonth() + 3)
  else if (freq === 'yearly') d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

export function Bills() {
  const money = useMoney()
  const bills = useBills()
  const categories = useCategories()
  const dateFormat = useSettings((s) => s.dateFormat)
  const [open, setOpen] = useState(false)

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState(todayISO())
  const [frequency, setFrequency] = useState<BillFrequency>('monthly')
  const [isEmi, setIsEmi] = useState(false)
  const [emiMonths, setEmiMonths] = useState('')

  const save = async () => {
    if (!name || !amount) return
    await db.bills.add({
      name,
      amount: Number(amount),
      dueDate,
      frequency,
      isEmi,
      emiTotalMonths: isEmi ? Number(emiMonths) : undefined,
      emiPaidMonths: isEmi ? 0 : undefined,
      autoRepeat: frequency !== 'once',
      paid: false,
      createdAt: Date.now(),
    })
    setOpen(false)
    setName('')
    setAmount('')
    setEmiMonths('')
    setIsEmi(false)
  }

  const markPaid = async (bill: Bill) => {
    if (!bill.id) return
    if (bill.autoRepeat && bill.frequency !== 'once') {
      await db.bills.update(bill.id, {
        dueDate: advance(bill.dueDate, bill.frequency),
        paid: false,
        emiPaidMonths: bill.isEmi
          ? (bill.emiPaidMonths ?? 0) + 1
          : undefined,
      })
    } else {
      await db.bills.update(bill.id, { paid: !bill.paid })
    }
    // Optionally record as an expense
    await db.transactions.add({
      type: 'expense',
      amount: bill.amount,
      categoryId: bill.categoryId,
      description: bill.name,
      date: todayISO(),
      createdAt: Date.now(),
    })
  }

  const today = todayISO()
  const catMap = new Map(categories.map((c) => [c.id, c]))

  return (
    <div>
      <PageHeader
        title="Bills & EMI"
        subtitle={`${bills.length} recurring payments`}
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus size={18} /> Add bill
          </Button>
        }
      />

      {bills.length ? (
        <div className="space-y-3">
          {bills.map((b) => {
            const overdue = !b.paid && b.dueDate < today
            const cat = catMap.get(b.categoryId)
            return (
              <Card key={b.id} className="flex items-center gap-3">
                <button
                  onClick={() => markPaid(b)}
                  aria-label="Mark paid"
                  className="shrink-0"
                >
                  {b.paid ? (
                    <CheckCircle2
                      size={26}
                      className="text-[var(--color-success)]"
                    />
                  ) : (
                    <Circle size={26} className="text-[var(--color-text-muted)]" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {cat?.emoji} {b.name}
                    {b.isEmi && (
                      <span className="ml-2 rounded-full bg-[var(--color-secondary)]/15 px-2 py-0.5 text-xs text-[var(--color-secondary)]">
                        EMI {b.emiPaidMonths ?? 0}/{b.emiTotalMonths}
                      </span>
                    )}
                  </p>
                  <p
                    className={`text-xs ${
                      overdue
                        ? 'font-semibold text-[var(--color-danger)]'
                        : 'text-[var(--color-text-muted)]'
                    }`}
                  >
                    {overdue ? 'Overdue · ' : 'Due '}
                    {formatDate(b.dueDate, dateFormat)} · {b.frequency}
                  </p>
                </div>
                <p className="font-bold">{money(b.amount)}</p>
                <button
                  onClick={() => b.id && db.bills.delete(b.id)}
                  className="ml-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                >
                  ✕
                </button>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon="ReceiptText"
            title="No bills yet"
            subtitle="Track recurring bills and EMIs with due-date reminders."
            action={
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus size={18} /> Add bill
              </Button>
            }
          />
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add bill / EMI">
        <div className="space-y-4">
          <Field label="Name">
            <Input
              placeholder="e.g. Electricity"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <Field label="Due date">
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Frequency">
            <Select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as BillFrequency)}
            >
              {FREQ.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={isEmi}
              onChange={(e) => setIsEmi(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            This is an EMI / installment plan
          </label>
          {isEmi && (
            <Field label="Total months">
              <Input
                type="number"
                placeholder="12"
                value={emiMonths}
                onChange={(e) => setEmiMonths(e.target.value)}
              />
            </Field>
          )}
          <Button className="w-full" onClick={save}>
            Add bill
          </Button>
        </div>
      </Modal>
    </div>
  )
}
