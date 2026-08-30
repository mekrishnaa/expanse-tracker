import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import type { TxnType } from '../db/types'
import { useCategories, useMembers, useTransactions } from '../lib/hooks'
import { useMoney } from '../lib/format'
import { useUI } from '../store/useUI'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input, Select } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { TransactionList } from '../components/transactions/TransactionList'

export function TransactionsPage({ type }: { type: TxnType }) {
  const money = useMoney()
  const [params] = useSearchParams()
  const openTxnModal = useUI((s) => s.openTxnModal)
  const allTxns = useTransactions()
  const categories = useCategories()
  const members = useMembers()

  const [q, setQ] = useState(params.get('q') ?? '')
  const [catFilter, setCatFilter] = useState('')
  const [memFilter, setMemFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')

  // Distinct months (yyyy-mm) that actually have transactions of this type.
  const months = useMemo(() => {
    const set = new Set<string>()
    for (const t of allTxns) {
      if (t.type === type) set.add(t.date.slice(0, 7))
    }
    return [...set].sort().reverse()
  }, [allTxns, type])

  const filtered = useMemo(() => {
    const query = q.toLowerCase()
    return allTxns
      .filter((t) => t.type === type)
      .filter((t) => (monthFilter ? t.date.startsWith(monthFilter) : true))
      .filter((t) => (catFilter ? t.categoryId === Number(catFilter) : true))
      .filter((t) => (memFilter ? t.memberId === Number(memFilter) : true))
      .filter((t) =>
        query
          ? [t.description, t.merchant, t.notes, ...(t.tags ?? [])]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
              .includes(query)
          : true,
      )
  }, [allTxns, type, monthFilter, catFilter, memFilter, q])

  const total = filtered.reduce((a, t) => a + t.amount, 0)
  const cats = categories.filter((c) => c.type === type)

  const monthLabel = (key: string) =>
    new Date(
      Number(key.slice(0, 4)),
      Number(key.slice(5, 7)) - 1,
    ).toLocaleString(undefined, { month: 'short', year: 'numeric' })

  return (
    <div>
      <PageHeader
        title={type === 'income' ? 'Income' : 'Expenses'}
        subtitle={`${filtered.length} transactions · ${money(total)}`}
        action={
          <Button size="sm" onClick={() => openTxnModal(type)}>
            <Plus size={18} /> Add
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </Select>
          <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="">All categories</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </Select>
          <Select value={memFilter} onChange={(e) => setMemFilter(e.target.value)}>
            <option value="">All members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.avatar} {m.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {filtered.length ? (
        <TransactionList
          transactions={filtered}
          categories={categories}
          members={members}
        />
      ) : (
        <Card>
          <EmptyState
            icon={type === 'income' ? 'ArrowUpCircle' : 'ArrowDownCircle'}
            title={`No ${type} yet`}
            subtitle="Tap add to record your first entry."
            action={
              <Button size="sm" onClick={() => openTxnModal(type)}>
                <Plus size={18} /> Add {type}
              </Button>
            }
          />
        </Card>
      )}
    </div>
  )
}

export function Expenses() {
  return <TransactionsPage type="expense" />
}

export function Income() {
  return <TransactionsPage type="income" />
}
