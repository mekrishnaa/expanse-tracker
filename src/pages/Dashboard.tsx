import { motion } from 'framer-motion'
import {
  ArrowLeftRight,
  ArrowUpCircle,
  PiggyBank,
  Plus,
  ReceiptText,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Area,
  AreaChart,
  Tooltip,
  XAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import {
  useBudgets,
  useCategories,
  useMembers,
  useMonthTransactions,
  useTransactions,
} from '../lib/hooks'
import { greeting, monthKey, useMoney } from '../lib/format'
import { dailySeries, totalsByCategory, totalsFor } from '../lib/stats'
import { useUI } from '../store/useUI'
import { Card } from '../components/ui/Card'
import { ProgressRing } from '../components/ui/ProgressRing'
import { TransactionList } from '../components/transactions/TransactionList'
import { EmptyState } from '../components/ui/EmptyState'

export function Dashboard() {
  const money = useMoney()
  const openTxnModal = useUI((s) => s.openTxnModal)
  const monthTxns = useMonthTransactions()
  const allTxns = useTransactions()
  const categories = useCategories()
  const members = useMembers()
  const budgets = useBudgets()

  const { income, expense, balance } = totalsFor(monthTxns)
  const totalBudget = budgets.reduce((a, b) => a + b.limit, 0)
  const budgetUsed = totalBudget > 0 ? expense / totalBudget : 0
  const savings = Math.max(0, income - expense)

  const daily = dailySeries(monthTxns, monthKey())
  const catTotals = totalsByCategory(
    monthTxns.filter((t) => t.type === 'expense'),
  ).slice(0, 6)
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const pieData = catTotals.map((c) => ({
    name: catMap.get(c.categoryId)?.name ?? 'Other',
    value: c.total,
    color: catMap.get(c.categoryId)?.color ?? '#94a3b8',
  }))

  const now = new Date()
  const monthName = now.toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  const quickActions = [
    { label: 'Expense', icon: Plus, action: () => openTxnModal('expense') },
    { label: 'Income', icon: ArrowUpCircle, action: () => openTxnModal('income') },
    { label: 'Transfer', icon: ArrowLeftRight, action: () => openTxnModal('transfer') },
  ]

  const summary = [
    { label: 'Income', value: income, icon: TrendingUp, color: 'var(--color-success)', to: '/income' },
    { label: 'Expenses', value: expense, icon: TrendingDown, color: 'var(--color-danger)', to: '/expenses' },
    { label: 'Savings', value: savings, icon: PiggyBank, color: 'var(--color-secondary)', to: '/savings' },
    { label: 'Balance', value: balance, icon: Wallet, color: 'var(--color-primary)', to: '/reports' },
  ]

  return (
    <div className="space-y-5">
      {/* Greeting hero */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[var(--radius)] p-5 text-white shadow-[var(--shadow-md)] sm:p-7"
        style={{
          background:
            'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
        }}
      >
        <div className="relative z-10">
          <p className="text-sm/relaxed opacity-90">
            {greeting()}, Family 👋
          </p>
          <p className="mt-0.5 text-xs opacity-75">
            {now.toLocaleDateString(undefined, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-75">
                Wallet balance
              </p>
              <p className="text-3xl font-extrabold sm:text-4xl">
                {money(balance)}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-3 backdrop-blur">
              <ProgressRing
                progress={budgetUsed}
                size={64}
                stroke={7}
                color="#ffffff"
                track="rgba(255,255,255,0.25)"
              >
                <span className="text-sm font-bold">
                  {Math.round(budgetUsed * 100)}%
                </span>
              </ProgressRing>
              <div className="text-xs">
                <p className="opacity-75">Budget used</p>
                <p className="font-bold">{monthName}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 right-16 h-48 w-48 rounded-full bg-white/5" />
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map((a) => (
          <button
            key={a.label}
            onClick={a.action}
            className="surface flex flex-col items-center gap-2 p-4 transition-transform active:scale-95"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
              <a.icon size={20} />
            </span>
            <span className="text-xs font-semibold">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to={s.to}>
              <Card interactive className="h-full">
                <div className="flex items-center justify-between">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: `${s.color}22`, color: s.color }}
                  >
                    <s.icon size={18} />
                  </span>
                </div>
                <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                  {s.label}
                </p>
                <p className="text-lg font-extrabold">{money(s.value)}</p>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold">Spending trend</h3>
            <span className="text-xs text-[var(--color-text-muted)]">
              {monthName}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={daily} margin={{ left: 0, right: 0, top: 8 }}>
              <defs>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                interval={4}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v) => money(Number(v))}
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                fill="url(#expGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="mb-2 font-bold">Expense breakdown</h3>
          {pieData.length ? (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {pieData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => money(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {pieData.slice(0, 4).map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: d.color }}
                    />
                    <span className="flex-1 truncate">{d.name}</span>
                    <span className="font-semibold">{money(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-[var(--color-text-muted)]">
              No expenses yet this month.
            </p>
          )}
        </Card>
      </div>

      {/* Shortcuts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { to: '/bills', label: 'Bills & EMI', icon: ReceiptText },
          { to: '/savings', label: 'Savings Goals', icon: Target },
          { to: '/budget', label: 'Budget', icon: PiggyBank },
          { to: '/members', label: 'Members', icon: Wallet },
        ].map((s) => (
          <Link key={s.to} to={s.to}>
            <Card interactive className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-secondary)]/15 text-[var(--color-secondary)]">
                <s.icon size={18} />
              </span>
              <span className="text-sm font-semibold">{s.label}</span>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent transactions */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold">Recent transactions</h3>
          <Link
            to="/expenses"
            className="text-xs font-semibold text-[var(--color-primary)]"
          >
            View all
          </Link>
        </div>
        {allTxns.length ? (
          <TransactionList
            transactions={allTxns.slice(0, 6)}
            categories={categories}
            members={members}
          />
        ) : (
          <EmptyState
            icon="Receipt"
            title="No transactions yet"
            subtitle="Add your first expense or income to get started."
            action={
              <button
                onClick={() => openTxnModal('expense')}
                className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
              >
                Add transaction
              </button>
            }
          />
        )}
      </Card>
    </div>
  )
}
