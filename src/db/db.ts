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

/** A pending change waiting to be pushed to the server (offline queue). */
export interface SyncQueueItem {
  id?: number
  entity: SyncEntity
  op: 'create' | 'update' | 'delete'
  localId: number
  payload?: Record<string, unknown>
  createdAt: number
  attempts: number
  nextAttemptAt: number
}

export type SyncEntity =
  | 'categories'
  | 'accounts'
  | 'members'
  | 'budgets'
  | 'goals'
  | 'bills'
  | 'shoppingLists'
  | 'shoppingItems'
  | 'notes'
  | 'templates'
  | 'transactions'

/** Maps a local auto-increment id to the server's UUID once an entity has synced. */
export interface IdMapEntry {
  /** `${entity}:${localId}` */
  key: string
  entity: SyncEntity
  localId: number
  serverId: string
}

export function idMapKey(entity: SyncEntity, localId: number): string {
  return `${entity}:${localId}`
}

export const SYNCABLE_TABLES: SyncEntity[] = [
  'categories',
  'accounts',
  'members',
  'budgets',
  'goals',
  'bills',
  'shoppingLists',
  'shoppingItems',
  'notes',
  'templates',
  'transactions',
]

// Sync is only active for a logged-in account's database, and briefly
// suspended while bulk-restoring/seeding so that isn't re-queued as "changes".
let syncActive = false
let syncSuspended = false

export function setSyncActive(value: boolean): void {
  syncActive = value
}

export function withSyncSuspended<T>(fn: () => Promise<T>): Promise<T> {
  syncSuspended = true
  return fn().finally(() => {
    syncSuspended = false
  })
}

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
  syncQueue!: EntityTable<SyncQueueItem, 'id'>
  idMap!: EntityTable<IdMapEntry, 'key'>

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
    this.version(3).stores({
      syncQueue: '++id, entity, localId, nextAttemptAt',
      idMap: 'key, entity',
    })

    for (const entity of SYNCABLE_TABLES) {
      // Cast to `any`: Dexie's overloaded hook() typing doesn't infer cleanly
      // through a dynamically-selected table, so we bypass it here — this is
      // internal plumbing, not part of the app's public data types.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const table = this.table(entity) as any
      const dbInstance = this

      table.hook(
        'creating',
        function (
          this: { onsuccess?: (key: number) => void },
          _primKey: number,
          obj: Record<string, unknown>,
          transaction: any,
        ) {
          if (!syncActive || syncSuspended) return
          // For auto-increment ('++id') tables the real key isn't known yet
          // when 'creating' fires — it's only available via this.onsuccess.
          this.onsuccess = (actualKey: number) => {
            transaction.on('complete', () => {
              void dbInstance.syncQueue.add({
                entity,
                op: 'create',
                localId: actualKey,
                payload: { ...obj, id: actualKey },
                createdAt: Date.now(),
                attempts: 0,
                nextAttemptAt: 0,
              })
            })
          }
        },
      )
      table.hook(
        'updating',
        (
          modifications: Record<string, unknown>,
          primKey: number,
          _obj: Record<string, unknown>,
          transaction: any,
        ) => {
          if (!syncActive || syncSuspended) return
          if (!Object.keys(modifications).length) return
          transaction.on('complete', () => {
            void this.syncQueue.add({
              entity,
              op: 'update',
              localId: primKey,
              payload: modifications,
              createdAt: Date.now(),
              attempts: 0,
              nextAttemptAt: 0,
            })
          })
        },
      )
      table.hook(
        'deleting',
        (primKey: number, _obj: Record<string, unknown>, transaction: any) => {
          if (!syncActive || syncSuspended) return
          transaction.on('complete', () => {
            void this.syncQueue.add({
              entity,
              op: 'delete',
              localId: primKey,
              createdAt: Date.now(),
              attempts: 0,
              nextAttemptAt: 0,
            })
          })
        },
      )
    }
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

/** Permanently deletes a local database (used to wipe an account's data on logout). */
export async function deleteDb(name: string): Promise<void> {
  if (current.name === name) current.close()
  await Dexie.delete(name)
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

