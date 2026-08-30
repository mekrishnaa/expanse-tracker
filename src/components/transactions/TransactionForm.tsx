import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Star } from 'lucide-react'
import { db } from '../../db/db'
import type { Template, Transaction, TxnType } from '../../db/types'
import {
  useAccounts,
  useBudgets,
  useCategories,
  useMembers,
  useTemplates,
} from '../../lib/hooks'
import { todayISO } from '../../lib/format'
import { Button } from '../ui/Button'
import { Field, Input, Select, Textarea } from '../ui/Input'

const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Net Banking', 'Wallet', 'Other']

interface FormValues {
  amount: number
  categoryId: string
  budgetId: string
  memberId: string
  accountId: string
  toAccountId: string
  description: string
  merchant: string
  paymentMethod: string
  tags: string
  notes: string
  date: string
  time: string
}

export function TransactionForm({
  type,
  editing,
  onDone,
}: {
  type: TxnType
  editing?: Transaction | null
  onDone: () => void
}) {
  const categories = useCategories()
  const members = useMembers()
  const accounts = useAccounts()
  const templates = useTemplates()
  const [receipt, setReceipt] = useState<string | undefined>(editing?.receipt)

  const filteredCats = categories.filter((c) =>
    type === 'transfer' ? false : c.type === type,
  )
  const typeTemplates = templates.filter((t) => t.type === type)

  const { register, handleSubmit, reset, formState, watch, setValue, getValues } =
    useForm<FormValues>({
    defaultValues: {
      amount: editing?.amount ?? ('' as unknown as number),
      categoryId: editing?.categoryId ? String(editing.categoryId) : '',
      budgetId: editing?.budgetId ? String(editing.budgetId) : '',
      memberId: editing?.memberId ? String(editing.memberId) : '',
      accountId: editing?.accountId ? String(editing.accountId) : '',
      toAccountId: editing?.toAccountId ? String(editing.toAccountId) : '',
      description: editing?.description ?? '',
      merchant: editing?.merchant ?? '',
      paymentMethod: editing?.paymentMethod ?? 'UPI',
      tags: editing?.tags?.join(', ') ?? '',
      notes: editing?.notes ?? '',
      date: editing?.date ?? todayISO(),
      time:
        editing?.time ??
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
    },
  })

  const watchedCategory = watch('categoryId')
  const watchedDate = watch('date')
  const month = (watchedDate || todayISO()).slice(0, 7)
  const monthBudgets = useBudgets(month)
  // Budgets available for the picked category (only useful for expenses).
  const categoryBudgets = monthBudgets.filter(
    (b) => b.categoryId === Number(watchedCategory),
  )

  useEffect(() => {
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  const onReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const r = new FileReader()
    r.onload = () => setReceipt(r.result as string)
    r.readAsDataURL(file)
  }

  const applyTemplate = (t: Template) => {
    if (t.amount != null) setValue('amount', t.amount)
    setValue('categoryId', t.categoryId ? String(t.categoryId) : '')
    setValue('budgetId', t.budgetId ? String(t.budgetId) : '')
    setValue('memberId', t.memberId ? String(t.memberId) : '')
    setValue('accountId', t.accountId ? String(t.accountId) : '')
    setValue('paymentMethod', t.paymentMethod ?? 'UPI')
    setValue('description', t.description ?? '')
    setValue('tags', t.tags?.join(', ') ?? '')
  }

  const saveTemplate = async () => {
    const v = getValues()
    const label = window.prompt('Name this template', v.description || '')
    if (!label) return
    await db.templates.add({
      label,
      type,
      amount: v.amount ? Number(v.amount) : undefined,
      categoryId: v.categoryId ? Number(v.categoryId) : undefined,
      budgetId: v.budgetId ? Number(v.budgetId) : undefined,
      memberId: v.memberId ? Number(v.memberId) : undefined,
      accountId: v.accountId ? Number(v.accountId) : undefined,
      paymentMethod: v.paymentMethod || undefined,
      description: v.description || undefined,
      tags: v.tags
        ? v.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined,
      createdAt: Date.now(),
    })
  }

  const submit = handleSubmit(async (v) => {
    const payload: Transaction = {
      type,
      amount: Number(v.amount),
      categoryId: v.categoryId ? Number(v.categoryId) : undefined,
      budgetId:
        type === 'expense' && v.budgetId ? Number(v.budgetId) : undefined,
      memberId: v.memberId ? Number(v.memberId) : undefined,
      accountId: v.accountId ? Number(v.accountId) : undefined,
      toAccountId:
        type === 'transfer' && v.toAccountId ? Number(v.toAccountId) : undefined,
      description: v.description || undefined,
      merchant: v.merchant || undefined,
      paymentMethod: v.paymentMethod || undefined,
      tags: v.tags
        ? v.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined,
      notes: v.notes || undefined,
      receipt,
      date: v.date,
      time: v.time || undefined,
      createdAt: editing?.createdAt ?? Date.now(),
    }
    if (editing?.id)
      await db.transactions.update(editing.id, payload as Partial<Transaction>)
    else await db.transactions.add(payload)
    onDone()
  })

  return (
    <form onSubmit={submit} className="space-y-4">
      {type !== 'transfer' && typeTemplates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {typeTemplates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t)}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-semibold transition-colors hover:border-[var(--color-primary)]"
            >
              {t.emoji ?? '⭐'} {t.label}
            </button>
          ))}
        </div>
      )}

      <Field label="Amount">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-[var(--color-text-muted)]">
            ₹
          </span>
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            autoFocus
            placeholder="0.00"
            className="w-full rounded-[calc(var(--radius)*0.55)] border border-[var(--color-border)] bg-[var(--color-surface-2)] py-3 pl-8 pr-3 text-2xl font-bold outline-none focus:border-[var(--color-primary)]"
            {...register('amount', { required: true, min: 0.01 })}
          />
        </div>
        {formState.errors.amount && (
          <span className="mt-1 block text-xs text-[var(--color-danger)]">
            Enter a valid amount
          </span>
        )}
      </Field>

      {type === 'transfer' ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="From">
            <Select {...register('accountId', { required: true })}>
              <option value="">Select</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="To">
            <Select {...register('toAccountId', { required: true })}>
              <option value="">Select</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select {...register('categoryId', { required: true })}>
              <option value="">Select</option>
              {filteredCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Account">
            <Select {...register('accountId')}>
              <option value="">Select</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      {type === 'expense' && categoryBudgets.length > 0 && (
        <Field
          label="Budget"
          hint="Which budget should this expense count against?"
        >
          <Select {...register('budgetId')}>
            <option value="">No specific budget</option>
            {categoryBudgets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name || filteredCats.find((c) => c.id === b.categoryId)?.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <Input type="date" {...register('date', { required: true })} />
        </Field>
        <Field label="Time">
          <Input type="time" {...register('time')} />
        </Field>
      </div>

      {type !== 'transfer' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Family member">
            <Select {...register('memberId')}>
              <option value="">Anyone</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.avatar} {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Payment method">
            <Select {...register('paymentMethod')}>
              {PAYMENT_METHODS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      <Field label="Description">
        <Input placeholder="e.g. Weekly groceries" {...register('description')} />
      </Field>

      {type === 'expense' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Merchant">
            <Input placeholder="Store / vendor" {...register('merchant')} />
          </Field>
          <Field label="Tags">
            <Input placeholder="comma, separated" {...register('tags')} />
          </Field>
        </div>
      )}

      <Field label="Notes">
        <Textarea placeholder="Optional notes…" {...register('notes')} />
      </Field>

      <Field label="Receipt">
        <div className="flex items-center gap-3">
          <label className="cursor-pointer rounded-[calc(var(--radius)*0.55)] border border-dashed border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]">
            Upload image
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onReceipt}
            />
          </label>
          {receipt && (
            <img
              src={receipt}
              alt="Receipt preview"
              className="h-12 w-12 rounded-lg object-cover"
            />
          )}
        </div>
      </Field>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          {editing ? 'Save changes' : 'Add'}
        </Button>
      </div>

      {type !== 'transfer' && !editing && (
        <button
          type="button"
          onClick={saveTemplate}
          className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
        >
          <Star size={14} /> Save as quick template
        </button>
      )}
    </form>
  )
}
