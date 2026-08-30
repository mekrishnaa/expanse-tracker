import type { Transaction } from '../db/types'

export function sumByType(txns: Transaction[], type: Transaction['type']) {
  return txns
    .filter((t) => t.type === type)
    .reduce((acc, t) => acc + t.amount, 0)
}

export function totalsFor(txns: Transaction[]) {
  const income = sumByType(txns, 'income')
  const expense = sumByType(txns, 'expense')
  return { income, expense, balance: income - expense }
}

export interface CategoryTotal {
  categoryId?: number
  total: number
}

export function totalsByCategory(txns: Transaction[]): CategoryTotal[] {
  const map = new Map<number | undefined, number>()
  for (const t of txns) {
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount)
  }
  return [...map.entries()]
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => b.total - a.total)
}

/** Daily totals for a month, returns [{day, income, expense}]. */
export function dailySeries(txns: Transaction[], month: string) {
  const days = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5, 7)),
    0,
  ).getDate()
  const arr = Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    label: String(i + 1),
    income: 0,
    expense: 0,
  }))
  for (const t of txns) {
    if (!t.date.startsWith(month)) continue
    const d = Number(t.date.slice(8, 10)) - 1
    if (arr[d]) {
      if (t.type === 'income') arr[d].income += t.amount
      else if (t.type === 'expense') arr[d].expense += t.amount
    }
  }
  return arr
}

/** Last N months trend of income & expense. */
export function monthlyTrend(txns: Transaction[], months = 6) {
  const now = new Date()
  const out: { key: string; label: string; income: number; expense: number }[] =
    []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    out.push({
      key,
      label: d.toLocaleString(undefined, { month: 'short' }),
      income: 0,
      expense: 0,
    })
  }
  const idx = new Map(out.map((o, i) => [o.key, i]))
  for (const t of txns) {
    const key = t.date.slice(0, 7)
    const i = idx.get(key)
    if (i === undefined) continue
    if (t.type === 'income') out[i].income += t.amount
    else if (t.type === 'expense') out[i].expense += t.amount
  }
  return out
}
