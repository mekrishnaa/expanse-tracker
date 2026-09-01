import Dexie, { type EntityTable } from 'dexie'
import type {
  Account,
  Bill,
  Budget,
  Category,
  FamilyMember,
  Note,
  SavingsGoal,
  ShoppingItem,
  ShoppingList,
  Template,
  Transaction,
} from './types'

export class ExpenseDB extends Dexie {
  transactions!: EntityTable<Transaction, 'id'>
  categories!: EntityTable<Category, 'id'>
  members!: EntityTable<FamilyMember, 'id'>
  accounts!: EntityTable<Account, 'id'>
  budgets!: EntityTable<Budget, 'id'>
  goals!: EntityTable<SavingsGoal, 'id'>
  bills!: EntityTable<Bill, 'id'>
  shoppingLists!: EntityTable<ShoppingList, 'id'>
  shoppingItems!: EntityTable<ShoppingItem, 'id'>
  notes!: EntityTable<Note, 'id'>
  templates!: EntityTable<Template, 'id'>

  constructor(name: string) {
    super(name)
    this.version(1).stores({
      transactions:
        '++id, type, date, categoryId, memberId, accountId, amount, createdAt',
      categories: '++id, type, order, archived',
      members: '++id, name, role',
      accounts: '++id, type',
      budgets: '++id, month, categoryId, [month+categoryId]',
      goals: '++id, createdAt',
      bills: '++id, dueDate, frequency',
      shoppingLists: '++id, createdAt',
      shoppingItems: '++id, listId, purchased',
      notes: '++id, updatedAt, pinned',
    })
    this.version(2).stores({
      templates: '++id, type, createdAt',
    })
  }
}

/** Legacy pre-multi-account database name, used one-time for migration. */
export const LEGACY_DB_NAME = 'FamilyExpenseTracker'
export const GUEST_DB_NAME = 'FamilyExpenseTracker_guest'
export const familyDbName = (familyId: string) =>
  `FamilyExpenseTracker_family_${familyId}`

let current = new ExpenseDB(GUEST_DB_NAME)
const switchListeners = new Set<() => void>()

/** Notified whenever the active local database changes (login/logout/switch account). */
export function onDbSwitch(listener: () => void): () => void {
  switchListeners.add(listener)
  return () => switchListeners.delete(listener)
}

export function currentDbName(): string {
  return current.name
}

/** Points `db` at a different local database, isolating one account's data from another. */
export function switchDb(name: string): void {
  if (current.name === name) return
  current.close()
  current = new ExpenseDB(name)
  switchListeners.forEach((fn) => fn())
}

// Every existing `import { db } from './db'` call site keeps working unchanged:
// the proxy always forwards to whichever ExpenseDB instance is currently active.
export const db = new Proxy(
  {},
  {
    get(_target, prop, receiver) {
      const value = Reflect.get(current, prop, receiver)
      return typeof value === 'function' ? value.bind(current) : value
    },
  },
) as ExpenseDB

