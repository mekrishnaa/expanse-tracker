import Dexie from 'dexie'
import {
  db,
  ExpenseDB,
  GUEST_DB_NAME,
  LEGACY_DB_NAME,
  familyDbName,
  switchDb,
} from '../db/db'
import { seedIfEmpty } from '../db/seed'
import { runReminderChecks } from './notifications'
import { useAuth } from '../store/useAuth'
import { useSettings } from '../store/useSettings'
import { restoreFromCloud, syncToCloud } from './cloud'

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

/** Copies every row from one local database into another (used for one-time migrations). */
async function copyDatabase(fromName: string, toName: string): Promise<void> {
  const from = new ExpenseDB(fromName)
  const to = new ExpenseDB(toName)
  try {
    // Read everything first: awaiting a foreign db mid-transaction would
    // cause Dexie's `to` transaction to auto-commit early.
    const data: Partial<Record<(typeof TABLES)[number], unknown[]>> = {}
    for (const name of TABLES) {
      data[name] = await from.table(name).toArray()
    }
    await to.transaction('rw', to.tables, async () => {
      for (const name of TABLES) {
        const rows = data[name]
        if (rows && rows.length) await to.table(name).bulkAdd(rows)
      }
    })
  } finally {
    from.close()
    to.close()
  }
}

async function databaseHasData(name: string): Promise<boolean> {
  const probe = new ExpenseDB(name)
  try {
    return (await probe.categories.count()) > 0
  } finally {
    probe.close()
  }
}

/**
 * Migrates data from the old single shared database (used before per-account
 * isolation existed) into the guest sandbox, exactly once.
 */
async function migrateLegacyDatabaseOnce(): Promise<void> {
  const key = 'legacy-db-migrated'
  if (localStorage.getItem(key)) return
  localStorage.setItem(key, '1')
  const legacyExists = (await Dexie.exists(LEGACY_DB_NAME)) as boolean
  if (!legacyExists) return
  const guestHasData = await databaseHasData(GUEST_DB_NAME)
  if (guestHasData) return
  await copyDatabase(LEGACY_DB_NAME, GUEST_DB_NAME)
}

let readyForScope: string | null = null

function scopeKeyFor(user: { familyId: string } | null): string {
  return user ? `family:${user.familyId}` : 'guest'
}

/**
 * Points local storage at the correct isolated database for the current
 * account (or guest sandbox), migrating/seeding data the first time it's used
 * on this device. Safe to call repeatedly; only does work when the scope
 * actually changed.
 */
export async function ensureScopeReady(): Promise<void> {
  const { user } = useAuth.getState()
  const scopeKey = scopeKeyFor(user)
  if (scopeKey === readyForScope) return

  await migrateLegacyDatabaseOnce()

  if (user) {
    const targetName = familyDbName(user.familyId)
    const isFirstUseOnDevice = !(await databaseHasData(targetName))
    switchDb(targetName)

    if (isFirstUseOnDevice) {
      // Prefer the account's existing cloud data (e.g. synced from another device).
      try {
        await restoreFromCloud()
      } catch {
        // offline or no cloud data yet — fall through to local guest migration
      }

      // If still empty, this may be a guest who just created/logged into an
      // account on this device — bring their local guest work along and back it up.
      if ((await db.categories.count()) === 0) {
        const guestHasData = await databaseHasData(GUEST_DB_NAME)
        if (guestHasData) {
          await copyDatabase(GUEST_DB_NAME, targetName)
          try {
            await syncToCloud()
          } catch {
            // will sync later via manual/auto sync
          }
        }
      }
    }
  } else {
    switchDb(GUEST_DB_NAME)
  }

  await seedIfEmpty()
  readyForScope = scopeKey

  if (user && useSettings.getState().remindersEnabled) {
    runReminderChecks()
  }
}
