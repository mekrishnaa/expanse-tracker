import { useState } from 'react'
import { Plus } from 'lucide-react'
import { db } from '../db/db'
import type { MemberRole } from '../db/types'
import { useMembers, useTransactions } from '../lib/hooks'
import { monthKey, useMoney } from '../lib/format'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field, Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'

const ROLES: MemberRole[] = [
  'admin',
  'parent',
  'spouse',
  'child',
  'sibling',
  'grandparent',
  'uncle',
  'aunt',
  'cousin',
  'friend',
  'guest',
  'other',
]
const AVATARS = ['🙂', '👩', '👨', '👧', '👦', '👵', '👴', '🧑', '👶', '🐶']
const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#0ea5e9', '#ec4899', '#8b5cf6']

export function Members() {
  const money = useMoney()
  const members = useMembers()
  const txns = useTransactions()
  const [open, setOpen] = useState(false)
  const month = monthKey()

  const [name, setName] = useState('')
  const [role, setRole] = useState<MemberRole>('parent')
  const [avatar, setAvatar] = useState('🙂')
  const [color, setColor] = useState('#6366f1')

  const save = async () => {
    if (!name) return
    await db.members.add({ name, role, avatar, color, createdAt: Date.now() })
    setOpen(false)
    setName('')
  }

  const statsFor = (id?: number) => {
    const mine = txns.filter((t) => t.memberId === id && t.date.startsWith(month))
    const expense = mine
      .filter((t) => t.type === 'expense')
      .reduce((a, t) => a + t.amount, 0)
    const income = mine
      .filter((t) => t.type === 'income')
      .reduce((a, t) => a + t.amount, 0)
    return { expense, income }
  }

  return (
    <div>
      <PageHeader
        title="Family Members"
        subtitle={`${members.length} members`}
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus size={18} /> Add member
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => {
          const s = statsFor(m.id)
          return (
            <Card key={m.id}>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                  style={{ background: `${m.color}22` }}
                >
                  {m.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{m.name}</p>
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
                    style={{ background: `${m.color}22`, color: m.color }}
                  >
                    {m.role}
                  </span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--color-border)] pt-3">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Spent</p>
                  <p className="font-bold text-[var(--color-danger)]">
                    {money(s.expense)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Earned</p>
                  <p className="font-bold text-[var(--color-success)]">
                    {money(s.income)}
                  </p>
                </div>
              </div>
              {m.role !== 'admin' && (
                <button
                  onClick={() => m.id && db.members.delete(m.id)}
                  className="mt-2 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                >
                  Remove
                </button>
              )}
            </Card>
          )
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add family member">
        <div className="space-y-4">
          <Field label="Name">
            <Input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Role">
            <Select value={role} onChange={(e) => setRole(e.target.value as MemberRole)}>
              {ROLES.map((r) => (
                <option key={r} value={r} className="capitalize">
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Avatar">
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${
                    avatar === a
                      ? 'ring-2 ring-[var(--color-primary)]'
                      : 'bg-[var(--color-surface-2)]'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </Field>
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
            Add member
          </Button>
        </div>
      </Modal>
    </div>
  )
}
