import Dexie from 'dexie'
import {
  db,
  deleteDb,
  ExpenseDB,
  GUEST_DB_NAME,
  LEGACY_DB_NAME,
  familyDbName,
  setSyncActive,
  switchDb,
  withSyncSuspended,
} from '../db/db'
import { seedIfEmpty } from '../db/seed'
import { runReminderChecks } from './notifications'
import { useAuth } from '../store/useAuth'
import { useSettings } from '../store/useSettings'
import { restoreFromCloud } from './cloud'
import { flushQueue, startSyncEngine } from './sync'

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
 * account (or guest sandbox). Guarantees:
 *  - authenticated users always see their own account's data, fetched fresh
 *    from the server the first time it's opened after a login;
 *  - logging out wipes all local data and drops back to a clean guest state;
 *  - guest data and account data never mix.
 * Safe to call repeatedly; only does work when the scope actually changed.
 */
export async function ensureScopeReady(): Promise<void> {
  startSyncEngine()

  const { user } = useAuth.getState()
  const scopeKey = scopeKeyFor(user)
  if (scopeKey === readyForScope) return

  const wasLoggedIn = readyForScope?.startsWith('family:') ?? false
  const loggingOut = wasLoggedIn && scopeKey === 'guest'

  await migrateLegacyDatabaseOnce()

  if (loggingOut) {
    // Requirement: logging out clears every trace of the account's data from
    // this device and drops back to a fresh, empty guest state.
    setSyncActive(false)
    const previousFamilyDb = readyForScope!.slice('family:'.length)
    await deleteDb(familyDbName(previousFamilyDb))
    await deleteDb(GUEST_DB_NAME)
    switchDb(GUEST_DB_NAME)
    readyForScope = scopeKey
    return
  }

  if (user) {
    const targetName = familyDbName(user.familyId)
    const isFirstUseOnDevice = !(await databaseHasData(targetName))
    switchDb(targetName)
    setSyncActive(true)

    if (isFirstUseOnDevice) {
      // The server is the source of truth for an authenticated account.
      try {
        await withSyncSuspended(() => restoreFromCloud())
      } catch {
        // offline right after login — fall through to local guest migration/seed
      }

      // If the account truly has nothing yet, this may be a guest who just
      // signed up on this device — carry their local work into the account
      // (it will sync to the server normally, like any other change).
      if ((await db.categories.count()) === 0) {
        const guestHasData = await databaseHasData(GUEST_DB_NAME)
        if (guestHasData) await copyDatabase(GUEST_DB_NAME, targetName)
      }

      await seedIfEmpty()
    } else {
      // Returning to an account that's still cached locally (no logout in
      // between) — push anything that didn't make it out before we closed.
      void flushQueue()
    }
  } else {
    setSyncActive(false)
    switchDb(GUEST_DB_NAME)
    await seedIfEmpty()
  }

  readyForScope = scopeKey

  if (user && useSettings.getState().remindersEnabled) {
    runReminderChecks()
  }
}
