import { useSettings } from '../store/useSettings'

export const CURRENCIES: Record<string, { symbol: string; name: string }> = {
  INR: { symbol: '₹', name: 'Indian Rupee' },
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar' },
}

/** Pure formatter (no hook) for use outside components. */
export function formatMoney(
  amount: number,
  currency = 'INR',
  opts: { compact?: boolean; hidden?: boolean } = {},
): string {
  const symbol = CURRENCIES[currency]?.symbol ?? currency
  if (opts.hidden) return `${symbol}••••`
  const abs = Math.abs(amount)
  let value: string
  if (opts.compact && abs >= 1000) {
    const units = [
      { v: 1e7, s: 'Cr' },
      { v: 1e5, s: 'L' },
      { v: 1e3, s: 'K' },
    ]
    const unit = units.find((u) => abs >= u.v)
    value = unit
      ? `${(amount / unit.v).toFixed(1).replace(/\.0$/, '')}${unit.s}`
      : amount.toFixed(0)
  } else {
    value = amount.toLocaleString(undefined, {
      minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })
  }
  return `${symbol}${value}`
}

/** Hook that respects the user's currency + hide-balances setting. */
export function useMoney() {
  const currency = useSettings((s) => s.currency)
  const hideBalances = useSettings((s) => s.hideBalances)
  return (amount: number, opts: { compact?: boolean } = {}) =>
    formatMoney(amount, currency, { ...opts, hidden: hideBalances })
}

export function formatDate(iso: string, fmt = 'DD/MM/YYYY'): string {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  if (isNaN(d.getTime())) return iso
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = String(d.getFullYear())
  switch (fmt) {
    case 'MM/DD/YYYY':
      return `${mm}/${dd}/${yyyy}`
    case 'YYYY-MM-DD':
      return `${yyyy}-${mm}-${dd}`
    default:
      return `${dd}/${mm}/${yyyy}`
  }
}

export function monthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  if (h < 21) return 'Good Evening'
  return 'Good Night'
}
