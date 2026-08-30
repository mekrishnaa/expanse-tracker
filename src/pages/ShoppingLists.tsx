import { useState } from 'react'
import { Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { db } from '../db/db'
import { useShoppingItems, useShoppingLists } from '../lib/hooks'
import { todayISO, useMoney } from '../lib/format'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'

export function ShoppingLists() {
  const money = useMoney()
  const lists = useShoppingLists()
  const [activeId, setActiveId] = useState<number | undefined>()
  const active = lists.find((l) => l.id === activeId) ?? lists[0]
  const items = useShoppingItems(active?.id)

  const [newList, setNewList] = useState('')
  const [itemName, setItemName] = useState('')
  const [itemCost, setItemCost] = useState('')

  const addList = async () => {
    if (!newList) return
    const id = await db.shoppingLists.add({
      name: newList,
      emoji: '🛒',
      createdAt: Date.now(),
    })
    setActiveId(id as number)
    setNewList('')
  }

  const addItem = async () => {
    if (!itemName || !active?.id) return
    await db.shoppingItems.add({
      listId: active.id,
      name: itemName,
      estimatedCost: itemCost ? Number(itemCost) : undefined,
      purchased: false,
      createdAt: Date.now(),
    })
    setItemName('')
    setItemCost('')
  }

  const convertToExpense = async (itemId?: number, name?: string, cost?: number) => {
    if (!itemId) return
    if (cost) {
      await db.transactions.add({
        type: 'expense',
        amount: cost,
        description: name,
        date: todayISO(),
        createdAt: Date.now(),
      })
    }
    await db.shoppingItems.update(itemId, { purchased: true })
  }

  const estimated = items.reduce((a, i) => a + (i.estimatedCost ?? 0), 0)

  return (
    <div>
      <PageHeader title="Shopping Lists" subtitle="Plan family purchases" />

      <Card className="mb-4">
        <div className="flex gap-2">
          <Input
            placeholder="New list name…"
            value={newList}
            onChange={(e) => setNewList(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addList()}
          />
          <Button onClick={addList}>
            <Plus size={18} />
          </Button>
        </div>
        {lists.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {lists.map((l) => (
              <button
                key={l.id}
                onClick={() => setActiveId(l.id)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
                  active?.id === l.id
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]',
                )}
              >
                {l.emoji} {l.name}
              </button>
            ))}
          </div>
        )}
      </Card>

      {active ? (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">{active.name}</h3>
            <span className="text-sm text-[var(--color-text-muted)]">
              Est. {money(estimated)}
            </span>
          </div>
          <div className="mb-3 flex gap-2">
            <Input
              placeholder="Add item…"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
            />
            <Input
              type="number"
              placeholder="₹"
              className="w-24"
              value={itemCost}
              onChange={(e) => setItemCost(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
            />
            <Button onClick={addItem}>
              <Plus size={18} />
            </Button>
          </div>
          <ul className="space-y-2">
            {items.map((i) => (
              <li
                key={i.id}
                className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] p-3"
              >
                <input
                  type="checkbox"
                  checked={i.purchased}
                  onChange={() =>
                    i.id && db.shoppingItems.update(i.id, { purchased: !i.purchased })
                  }
                  className="h-5 w-5 accent-[var(--color-primary)]"
                />
                <span
                  className={cn(
                    'flex-1 text-sm',
                    i.purchased && 'text-[var(--color-text-muted)] line-through',
                  )}
                >
                  {i.name}
                </span>
                {i.estimatedCost ? (
                  <span className="text-sm font-semibold">
                    {money(i.estimatedCost)}
                  </span>
                ) : null}
                {!i.purchased && (
                  <button
                    onClick={() =>
                      convertToExpense(i.id, i.name, i.estimatedCost)
                    }
                    title="Mark bought & add expense"
                    className="text-[var(--color-primary)]"
                  >
                    <ShoppingBag size={16} />
                  </button>
                )}
                <button
                  onClick={() => i.id && db.shoppingItems.delete(i.id)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
            {items.length === 0 && (
              <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">
                No items yet.
              </p>
            )}
          </ul>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon="ShoppingCart"
            title="No lists yet"
            subtitle="Create a shared shopping list for the family."
          />
        </Card>
      )}
    </div>
  )
}
