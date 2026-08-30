import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useCategories, useMembers, useTransactions } from '../lib/hooks'
import { useMoney } from '../lib/format'
import { monthlyTrend, totalsByCategory } from '../lib/stats'
import { Card } from '../components/ui/Card'
import { Select } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'

const RANGES = [
  { label: 'Last 3 months', months: 3 },
  { label: 'Last 6 months', months: 6 },
  { label: 'Last 12 months', months: 12 },
]

export function Reports() {
  const money = useMoney()
  const txns = useTransactions()
  const categories = useCategories()
  const members = useMembers()
  const [rangeIdx, setRangeIdx] = useState(1)
  const [memberFilter, setMemberFilter] = useState('')

  const months = RANGES[rangeIdx].months
  const cutoff = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - months + 1)
    d.setDate(1)
    return d.toISOString().slice(0, 7)
  }, [months])

  const filtered = txns
    .filter((t) => t.date.slice(0, 7) >= cutoff)
    .filter((t) => (memberFilter ? t.memberId === Number(memberFilter) : true))

  const trend = monthlyTrend(filtered, months)
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const expenseByCat = totalsByCategory(
    filtered.filter((t) => t.type === 'expense'),
  )
    .slice(0, 8)
    .map((c) => ({
      name: catMap.get(c.categoryId)?.name ?? 'Other',
      value: c.total,
      color: catMap.get(c.categoryId)?.color ?? '#94a3b8',
    }))

  const byMember = members.map((m) => ({
    name: m.name,
    value: filtered
      .filter((t) => t.type === 'expense' && t.memberId === m.id)
      .reduce((a, t) => a + t.amount, 0),
    color: m.color,
  }))

  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((a, t) => a + t.amount, 0)
  const totalExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((a, t) => a + t.amount, 0)

  const tooltipStyle = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 12,
    fontSize: 12,
  }

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Understand your money" />

      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            value={rangeIdx}
            onChange={(e) => setRangeIdx(Number(e.target.value))}
          >
            {RANGES.map((r, i) => (
              <option key={r.label} value={i}>
                {r.label}
              </option>
            ))}
          </Select>
          <Select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
          >
            <option value="">All members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.avatar} {m.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Card>
          <p className="text-xs text-[var(--color-text-muted)]">Total income</p>
          <p className="text-xl font-extrabold text-[var(--color-success)]">
            {money(totalIncome)}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--color-text-muted)]">Total expense</p>
          <p className="text-xl font-extrabold text-[var(--color-danger)]">
            {money(totalExpense)}
          </p>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <p className="text-xs text-[var(--color-text-muted)]">Net savings</p>
          <p className="text-xl font-extrabold text-[var(--color-primary)]">
            {money(totalIncome - totalExpense)}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-bold">Income vs Expense</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => money(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" fill="var(--color-success)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" fill="var(--color-danger)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="mb-3 font-bold">Savings trend</h3>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart
              data={trend.map((t) => ({ ...t, savings: t.income - t.expense }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => money(Number(v))} />
              <Line type="monotone" dataKey="savings" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="mb-3 font-bold">Category breakdown</h3>
          {expenseByCat.length ? (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={expenseByCat} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {expenseByCat.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => money(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-[var(--color-text-muted)]">
              No expense data for this range.
            </p>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 font-bold">Spending by member</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={byMember} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => money(Number(v))} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {byMember.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
