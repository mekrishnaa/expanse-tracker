import { useState } from 'react'
import { Plus } from 'lucide-react'
import { db } from '../db/db'
import type { TxnType } from '../db/types'
import { useCategories } from '../lib/hooks'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field, Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'

const EMOJIS = ['🛒', '🏠', '💡', '🍽️', '🛍️', '⛽', '🩺', '🎓', '🎬', '✈️', '🚌', '🐾', '💼', '📈', '🎁', '💰', '📦', '☕', '🎮', '👕']
const COLORS = ['#22c55e', '#6366f1', '#f59e0b', '#ef4444', '#0ea5e9', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#64748b']

export function Categories() {
  const categories = useCategories()
  const [tab, setTab] = useState<TxnType>('expense')
  const [open, setOpen] = useState(false)

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🛒')
  const [color, setColor] = useState('#22c55e')

  const list = categories.filter((c) => c.type === tab && !c.archived)

  const save = async () => {
    if (!name) return
    await db.categories.add({
      name,
      type: tab,
      icon: 'Tag',
      color,
      emoji,
      order: categories.length,
    })
    setOpen(false)
    setName('')
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Organize your income and spending"
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus size={18} /> Add
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-[var(--color-surface-2)] p-1 sm:max-w-xs">
        {(['expense', 'income'] as TxnType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-full py-2 text-sm font-semibold capitalize transition-colors',
              tab === t
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-text-muted)]',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((c) => (
          <Card key={c.id} className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl"
              style={{ background: `${c.color}22` }}
            >
              {c.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{c.name}</p>
            </div>
            <button
              onClick={() => c.id && db.categories.delete(c.id)}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
            >
              ✕
            </button>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={`Add ${tab} category`}>
        <div className="space-y-4">
          <Field label="Name">
            <Input
              placeholder="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Emoji">
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl text-lg',
                    emoji === e
                      ? 'ring-2 ring-[var(--color-primary)]'
                      : 'bg-[var(--color-surface-2)]',
                  )}
                >
                  {e}
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
                  className={cn(
                    'h-8 w-8 rounded-full',
                    color === c && 'ring-2 ring-offset-2 ring-offset-[var(--color-surface)]',
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </Field>
          <Button className="w-full" onClick={save}>
            Add category
          </Button>
        </div>
      </Modal>
    </div>
  )
}
