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
  'templates',
] as const

/** Gather every table into a single serializable backup object. */
export async function collectBackup() {
  const data: Record<string, unknown[]> = {}
  for (const name of TABLES) {
    data[name] = await db.table(name).toArray()
  }
  return { version: 1, exportedAt: Date.now(), data }
}

/** Replace all local data with the contents of a backup object. */
export async function applyBackup(
  parsed: { data?: Record<string, unknown[]> } | Record<string, unknown[]>,
) {
  const data = (parsed as { data?: Record<string, unknown[]> }).data ??
    (parsed as Record<string, unknown[]>)
  await db.transaction('rw', db.tables, async () => {
    for (const name of TABLES) {
      if (!Array.isArray(data[name])) continue
      await db.table(name).clear()
      await db.table(name).bulkAdd(data[name] as unknown[])
    }
  })
}

export async function exportJSON() {
  const backup = await collectBackup()
  download(
    JSON.stringify(backup, null, 2),
    `expense-backup-${new Date().toISOString().slice(0, 10)}.json`,
    'application/json',
  )
}

export async function importJSON(file: File) {
  const parsed = JSON.parse(await file.text())
  await applyBackup(parsed)
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

export function downloadCSVTemplate() {
  const headers = [
    'Date',
    'Type',
    'Amount',
    'Category',
    'Description',
    'Merchant',
    'Payment',
  ]
  const sample = [
    '2026-01-15,expense,1200,Groceries,Weekly shopping,More Supermart,UPI',
    '2026-01-01,income,50000,Salary,Monthly salary,,Bank',
  ]
  download(
    [headers.join(','), ...sample].join('\n'),
    'transactions-template.csv',
    'text/csv',
  )
}

/** Import transactions from a CSV that matches the export/template columns. */
export async function importTransactionsCSV(file: File): Promise<number> {
  const text = await file.text()
  const rows = parseCSV(text)
  if (rows.length < 2) return 0
  const header = rows[0].map((h) => h.trim().toLowerCase())
  const col = (name: string) => header.indexOf(name)
  const iDate = col('date')
  const iType = col('type')
  const iAmount = col('amount')
  const iCategory = col('category')
  const iDesc = col('description')
  const iMerchant = col('merchant')
  const iPayment = col('payment')

  const cats = await db.categories.toArray()
  const catByName = new Map(cats.map((c) => [c.name.toLowerCase(), c.id]))

  let added = 0
  await db.transaction('rw', db.transactions, async () => {
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r]
      if (!row.length || !row[iAmount]) continue
      const amount = Number(row[iAmount])
      if (!isFinite(amount) || amount <= 0) continue
      const rawType = (row[iType] ?? '').toLowerCase()
      const type =
        rawType === 'income' || rawType === 'transfer' ? rawType : 'expense'
      await db.transactions.add({
        type,
        amount,
        categoryId: catByName.get((row[iCategory] ?? '').toLowerCase()),
        description: row[iDesc] || undefined,
        merchant: row[iMerchant] || undefined,
        paymentMethod: row[iPayment] || undefined,
        date: normalizeDate(row[iDate]),
        createdAt: Date.now(),
      })
      added++
    }
  })
  return added
}

function normalizeDate(v: string): string {
  if (!v) return new Date().toISOString().slice(0, 10)
  const d = new Date(v)
  return isNaN(d.getTime())
    ? new Date().toISOString().slice(0, 10)
    : d.toISOString().slice(0, 10)
}

/** Minimal CSV parser supporting quoted fields and escaped quotes. */
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += ch
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((c) => c !== '')) rows.push(row)
      row = []
    } else field += ch
  }
  if (field !== '' || row.length) {
    row.push(field)
    if (row.some((c) => c !== '')) rows.push(row)
  }
  return rows
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
