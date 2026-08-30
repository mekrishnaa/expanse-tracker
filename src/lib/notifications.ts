import { db } from '../db/db'
import { monthKey, todayISO } from './format'
import { totalsByCategory } from './stats'

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission(): NotificationPermission {
  return notificationsSupported() ? Notification.permission : 'denied'
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

function notify(title: string, body: string, tag: string) {
  if (notificationPermission() !== 'granted') return
  // Avoid repeating the same reminder more than once per day.
  const key = `notif:${tag}:${todayISO()}`
  if (localStorage.getItem(key)) return
  localStorage.setItem(key, '1')
  try {
    new Notification(title, { body, tag, icon: '/icons/icon-192.png' })
  } catch {
    /* ignore */
  }
}

/**
 * Checks bills due soon and budgets that are exceeded, firing at most one
 * notification per item per day. Safe to call on every app start.
 */
export async function runReminderChecks(reminderDays = 3) {
  if (notificationPermission() !== 'granted') return

  const today = todayISO()
  const soon = new Date()
  soon.setDate(soon.getDate() + reminderDays)
  const soonISO = soon.toISOString().slice(0, 10)

  const bills = await db.bills.toArray()
  for (const b of bills) {
    if (b.paid) continue
    if (b.dueDate < today) {
      notify('Bill overdue', `${b.name} was due on ${b.dueDate}.`, `bill-${b.id}`)
    } else if (b.dueDate <= soonISO) {
      notify('Bill due soon', `${b.name} is due on ${b.dueDate}.`, `bill-${b.id}`)
    }
  }

  const month = monthKey()
  const budgets = await db.budgets.where('month').equals(month).toArray()
  if (budgets.length) {
    const txns = await db.transactions
      .filter((t) => t.type === 'expense' && t.date.startsWith(month))
      .toArray()
    const spentByCat = new Map(
      totalsByCategory(txns).map((c) => [c.categoryId, c.total]),
    )
    const cats = await db.categories.toArray()
    const catName = new Map(cats.map((c) => [c.id, c.name]))
    for (const b of budgets) {
      const sameCat = budgets.filter((x) => x.categoryId === b.categoryId)
      const spent =
        sameCat.length <= 1
          ? spentByCat.get(b.categoryId) ?? 0
          : txns
              .filter((t) => t.budgetId === b.id)
              .reduce((a, t) => a + t.amount, 0)
      if (spent > b.limit) {
        const label = b.name || catName.get(b.categoryId) || 'Budget'
        notify(
          'Budget exceeded',
          `${label} is over by ${(spent - b.limit).toFixed(0)}.`,
          `budget-${b.id}`,
        )
      }
    }
  }
}
