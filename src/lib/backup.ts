import { db } from '../db/db'

const TABLES = [
  'transactions',
  'categories',
  'members',
  'accounts',
  'budgets',
  'goals',
  'bills',
  'shoppingLists',
  'shoppingItems',
  'notes',
] as const

export async function exportJSON() {
  const data: Record<string, unknown[]> = {}
  for (const name of TABLES) {
    data[name] = await db.table(name).toArray()
  }
  download(
    JSON.stringify({ version: 1, exportedAt: Date.now(), data }, null, 2),
    `expense-backup-${new Date().toISOString().slice(0, 10)}.json`,
    'application/json',
  )
}

export async function importJSON(file: File) {
  const text = await file.text()
  const parsed = JSON.parse(text)
  const data = parsed.data ?? parsed
  await db.transaction('rw', db.tables, async () => {
    for (const name of TABLES) {
      if (!Array.isArray(data[name])) continue
      await db.table(name).clear()
      await db.table(name).bulkAdd(data[name])
    }
  })
}

export async function exportCSV() {
  const txns = await db.transactions.toArray()
  const cats = new Map((await db.categories.toArray()).map((c) => [c.id, c.name]))
  const headers = ['Date', 'Type', 'Amount', 'Category', 'Description', 'Merchant', 'Payment']
  const rows = txns.map((t) =>
    [
      t.date,
      t.type,
      t.amount,
      cats.get(t.categoryId) ?? '',
      t.description ?? '',
      t.merchant ?? '',
      t.paymentMethod ?? '',
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  )
  download(
    [headers.join(','), ...rows].join('\n'),
    `expenses-${new Date().toISOString().slice(0, 10)}.csv`,
    'text/csv',
  )
}

export async function clearAllData() {
  await db.transaction('rw', db.tables, async () => {
    for (const name of TABLES) {
      await db.table(name).clear()
    }
  })
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
