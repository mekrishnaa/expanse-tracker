import { useState } from 'react'
import { Plus } from 'lucide-react'
import { db } from '../db/db'
import type { AccountType } from '../db/types'
import { useAccounts, useTransactions } from '../lib/hooks'
import { useMoney } from '../lib/format'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field, Input, Select } from '../components/ui/Input'
import { Icon } from '../components/ui/Icon'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'

const TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: 'cash', label: 'Cash', icon: 'Banknote' },
  { value: 'bank', label: 'Bank', icon: 'Landmark' },
  { value: 'credit', label: 'Credit Card', icon: 'CreditCard' },
  { value: 'upi', label: 'UPI', icon: 'Smartphone' },
  { value: 'wallet', label: 'Wallet', icon: 'Wallet' },
  { value: 'investment', label: 'Investment', icon: 'TrendingUp' },
]
const COLORS = ['#22c55e', '#6366f1', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6']

export function Accounts() {
  const money = useMoney()
  const accounts = useAccounts()
  const txns = useTransactions()
  const [open, setOpen] = useState(false)

  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('bank')
  const [balance, setBalance] = useState('')
  const [color, setColor] = useState('#6366f1')

  const balanceFor = (id?: number) => {
    const base = accounts.find((a) => a.id === id)?.balance ?? 0
    let delta = 0
    for (const t of txns) {
      if (t.accountId === id) {
        if (t.type === 'income') delta += t.amount
        else delta -= t.amount
      }
      if (t.toAccountId === id) delta += t.amount
    }
    return base + delta
  }

  const total = accounts.reduce((a, acc) => a + balanceFor(acc.id), 0)

  const save = async () => {
    if (!name) return
    const t = TYPES.find((x) => x.value === type)!
    await db.accounts.add({
      name,
      type,
      balance: Number(balance) || 0,
      color,
      icon: t.icon,
      createdAt: Date.now(),
    })
    setOpen(false)
    setName('')
    setBalance('')
  }

  return (
    <div>
      <PageHeader
        title="Wallets & Accounts"
        subtitle={`Total balance ${money(total)}`}
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus size={18} /> Add
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => (
          <Card key={a.id}>
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ background: `${a.color}22`, color: a.color }}
              >
                <Icon name={a.icon} size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{a.name}</p>
                <p className="text-xs capitalize text-[var(--color-text-muted)]">
                  {a.type}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xl font-extrabold">{money(balanceFor(a.id))}</p>
            <button
              onClick={() => a.id && db.accounts.delete(a.id)}
              className="mt-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
            >
              Remove
            </button>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add account">
        <div className="space-y-4">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HDFC Savings" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select value={type} onChange={(e) => setType(e.target.value as AccountType)}>
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Opening balance">
              <Input
                type="number"
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Color">
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full ${
                    color === c ? 'ring-2 ring-offset-2 ring-offset-[var(--color-surface)]' : ''
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </Field>
          <Button className="w-full" onClick={save}>
            Add account
          </Button>
        </div>
      </Modal>
    </div>
  )
}
