import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { ShoppingItem } from '../db/types'
import { monthKey } from './format'

export function useCategories() {
  return (
    useLiveQuery(() => db.categories.orderBy('order').toArray(), []) ?? []
  )
}

export function useMembers() {
  return useLiveQuery(() => db.members.toArray(), []) ?? []
}

export function useAccounts() {
  return useLiveQuery(() => db.accounts.toArray(), []) ?? []
}

export function useTransactions() {
  return (
    useLiveQuery(
      () => db.transactions.orderBy('date').reverse().toArray(),
      [],
    ) ?? []
  )
}

export function useMonthTransactions(month = monthKey()) {
  return (
    useLiveQuery(
      () =>
        db.transactions
          .filter((t) => t.date.startsWith(month))
          .toArray(),
      [month],
    ) ?? []
  )
}

export function useBudgets(month = monthKey()) {
  return (
    useLiveQuery(() => db.budgets.where('month').equals(month).toArray(), [
      month,
    ]) ?? []
  )
}

export function useAllBudgets() {
  return useLiveQuery(() => db.budgets.toArray(), []) ?? []
}

export function useTemplates() {
  return (
    useLiveQuery(() => db.templates.orderBy('createdAt').toArray(), []) ?? []
  )
}

export function useGoals() {
  return useLiveQuery(() => db.goals.toArray(), []) ?? []
}

export function useBills() {
  return (
    useLiveQuery(() => db.bills.orderBy('dueDate').toArray(), []) ?? []
  )
}

export function useNotes() {
  return (
    useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().toArray(), []) ??
    []
  )
}

export function useShoppingLists() {
  return useLiveQuery(() => db.shoppingLists.toArray(), []) ?? []
}

export function useShoppingItems(listId?: number) {
  return (
    useLiveQuery(
      () =>
        listId
          ? db.shoppingItems.where('listId').equals(listId).toArray()
          : Promise.resolve([] as ShoppingItem[]),
      [listId],
    ) ?? []
  )
}
