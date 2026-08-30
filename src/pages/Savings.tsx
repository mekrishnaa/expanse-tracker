import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trophy } from 'lucide-react'
import { db } from '../db/db'
import type { SavingsGoal } from '../db/types'
import { useGoals } from '../lib/hooks'
import { formatDate, useMoney } from '../lib/format'
import { useSettings } from '../store/useSettings'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { ProgressRing } from '../components/ui/ProgressRing'

const EMOJIS = ['🏖️', '🚗', '🏠', '🎓', '🛟', '💍', '🎉', '📱', '💻', '✈️']

export function Savings() {
  const money = useMoney()
  const goals = useGoals()
  const dateFormat = useSettings((s) => s.dateFormat)
  const [open, setOpen] = useState(false)
  const [addFor, setAddFor] = useState<SavingsGoal | null>(null)
  const [contribution, setContribution] = useState('')

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏖️')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState('')

  const createGoal = async () => {
    if (!name || !target) return
    await db.goals.add({
      name,
      emoji,
      targetAmount: Number(target),
      currentAmount: 0,
      deadline: deadline || undefined,
      color: 'var(--color-primary)',
      createdAt: Date.now(),
    })
    setOpen(false)
    setName('')
    setTarget('')
    setDeadline('')
  }

  const contribute = async () => {
    if (!addFor?.id || !contribution) return
    const next = addFor.currentAmount + Number(contribution)
    await db.goals.update(addFor.id, {
      currentAmount: next,
      completedAt: next >= addFor.targetAmount ? Date.now() : undefined,
    })
    setAddFor(null)
    setContribution('')
  }

  return (
    <div>
      <PageHeader
        title="Savings Goals"
        subtitle={`${goals.length} goals`}
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus size={18} /> New goal
          </Button>
        }
      />

      {goals.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => {
            const ratio = g.targetAmount ? g.currentAmount / g.targetAmount : 0
            const done = g.currentAmount >= g.targetAmount
            return (
              <Card key={g.id} className="flex flex-col items-center text-center">
                {done && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mb-2 flex items-center gap-1 rounded-full bg-[var(--color-success)]/15 px-3 py-1 text-xs font-semibold text-[var(--color-success)]"
                  >
                    <Trophy size={13} /> Goal reached!
                  </motion.div>
                )}
                <ProgressRing progress={ratio} size={130} stroke={12}>
                  <span className="text-3xl">{g.emoji}</span>
                  <span className="mt-1 text-sm font-bold">
                    {Math.round(ratio * 100)}%
                  </span>
                </ProgressRing>
                <p className="mt-3 font-bold">{g.name}</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {money(g.currentAmount)} / {money(g.targetAmount)}
                </p>
                {g.deadline && (
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    By {formatDate(g.deadline, dateFormat)}
                  </p>
                )}
                <div className="mt-3 flex w-full gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => setAddFor(g)}
                  >
                    Add funds
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => g.id && db.goals.delete(g.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon="Target"
            title="No savings goals"
            subtitle="Create a goal like Vacation or Emergency Fund and watch it grow."
            action={
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus size={18} /> New goal
              </Button>
            }
          />
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New savings goal">
        <div className="space-y-4">
          <Field label="Goal name">
            <Input
              placeholder="e.g. Family Vacation"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Icon">
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-colors ${
                    emoji === e
                      ? 'bg-[var(--color-primary)]/15 ring-2 ring-[var(--color-primary)]'
                      : 'bg-[var(--color-surface-2)]'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target amount">
              <Input
                type="number"
                placeholder="0.00"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </Field>
            <Field label="Deadline">
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </Field>
          </div>
          <Button className="w-full" onClick={createGoal}>
            Create goal
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!addFor}
        onClose={() => setAddFor(null)}
        title={`Add funds to ${addFor?.name ?? ''}`}
      >
        <div className="space-y-4">
          <Field label="Contribution">
            <Input
              type="number"
              placeholder="0.00"
              autoFocus
              value={contribution}
              onChange={(e) => setContribution(e.target.value)}
            />
          </Field>
          <Button className="w-full" onClick={contribute}>
            Add to goal
          </Button>
        </div>
      </Modal>
    </div>
  )
}
