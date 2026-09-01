import { api } from './api'
import {
  db,
  idMapKey,
  onDbSwitch,
  type SyncEntity,
  type SyncQueueItem,
} from '../db/db'

/** Server REST path for each syncable entity (excluding the leading /api). */
const ENTITY_PATH: Record<SyncEntity, string> = {
  categories: '/categories',
  accounts: '/accounts',
  members: '/members',
  budgets: '/budgets',
  goals: '/goals',
  bills: '/bills',
  shoppingLists: '/shopping-lists',
  shoppingItems: '/shopping-lists', // nested: /shopping-lists/:listId/items
  notes: '/notes',
  templates: '/templates',
  transactions: '/transactions',
}

/** Foreign-key fields that reference another local record and must be
 * translated to the server's id before the request is sent. */
const REF_FIELDS: Partial<Record<SyncEntity, Record<string, SyncEntity>>> = {
  budgets: { categoryId: 'categories' },
  bills: { categoryId: 'categories' },
  templates: { categoryId: 'categories', memberId: 'members', accountId: 'accounts' },
  transactions: {
    categoryId: 'categories',
    memberId: 'members',
    accountId: 'accounts',
    toAccountId: 'accounts',
    budgetId: 'budgets',
  },
  shoppingItems: { listId: 'shoppingLists' },
}

const BASE_BACKOFF_MS = 15_000
const MAX_BACKOFF_MS = 30 * 60_000

function backoffFor(attempts: number): number {
  return Math.min(BASE_BACKOFF_MS * 2 ** Math.min(attempts, 6), MAX_BACKOFF_MS)
}

async function getServerId(
  entity: SyncEntity,
  localId: number,
): Promise<string | undefined> {
  const entry = await db.idMap.get(idMapKey(entity, localId))
  return entry?.serverId
}

async function hasPendingCreate(
  entity: SyncEntity,
  localId: number,
): Promise<boolean> {
  const item = await db.syncQueue
    .where({ entity, localId })
    .and((i) => i.op === 'create')
    .first()
  return Boolean(item)
}

/** "Not ready yet" — a dependency hasn't synced, retry this item on a later pass. */
class DeferError extends Error {}

/** Rewrites local numeric foreign keys to server UUIDs; throws DeferError if not ready. */
async function remapRefs(
  entity: SyncEntity,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const refs = REF_FIELDS[entity]
  if (!refs) return payload
  const out = { ...payload }
  for (const [field, refEntity] of Object.entries(refs)) {
    const value = out[field]
    if (value === undefined || value === null) continue
    const serverId = await getServerId(refEntity, value as number)
    if (serverId) {
      out[field] = serverId
    } else if (await hasPendingCreate(refEntity, value as number)) {
      throw new DeferError(`waiting on ${refEntity}:${value}`)
    } else {
      delete out[field]
    }
  }
  return out
}

/** Removes create/update/delete pairs that cancel out (created and deleted while offline). */
async function coalesceQueue(): Promise<void> {
  const items = await db.syncQueue.toArray()
  const byKey = new Map<string, SyncQueueItem[]>()
  for (const item of items) {
    const key = `${item.entity}:${item.localId}`
    const list = byKey.get(key) ?? []
    list.push(item)
    byKey.set(key, list)
  }
  for (const list of byKey.values()) {
    const hasCreate = list.some((i) => i.op === 'create')
    const hasDelete = list.some((i) => i.op === 'delete')
    if (hasCreate && hasDelete) {
      await db.syncQueue.bulkDelete(list.map((i) => i.id!).filter(Boolean))
    }
  }
}

async function processItem(item: SyncQueueItem): Promise<'done' | 'deferred'> {
  const { entity, op, localId } = item

  if (entity === 'shoppingItems') {
    return processShoppingItem(item)
  }

  const path = ENTITY_PATH[entity]

  if (op === 'create') {
    const raw = { ...(item.payload ?? {}) }
    delete raw.id
    let payload: Record<string, unknown>
    try {
      payload = await remapRefs(entity, raw)
    } catch (e) {
      if (e instanceof DeferError) return 'deferred'
      throw e
    }
    const res = (await api.post(path, payload)) as { data: { id: string } }
    await db.idMap.put({
      key: idMapKey(entity, localId),
      entity,
      localId,
      serverId: res.data.id,
    })
    await db.syncQueue.delete(item.id!)
    return 'done'
  }

  const serverId = await getServerId(entity, localId)
  if (!serverId) {
    // Its own create hasn't synced yet; wait for it.
    if (await hasPendingCreate(entity, localId)) return 'deferred'
    await db.syncQueue.delete(item.id!)
    return 'done'
  }

  if (op === 'update') {
    let payload: Record<string, unknown>
    try {
      payload = await remapRefs(entity, item.payload ?? {})
    } catch (e) {
      if (e instanceof DeferError) return 'deferred'
      throw e
    }
    await api.patch(`${path}/${serverId}`, payload)
    await db.syncQueue.delete(item.id!)
    return 'done'
  }

  // delete
  await api.del(`${path}/${serverId}`)
  await db.idMap.delete(idMapKey(entity, localId))
  await db.syncQueue.delete(item.id!)
  return 'done'
}

async function processShoppingItem(
  item: SyncQueueItem,
): Promise<'done' | 'deferred'> {
  const { op, localId } = item

  if (op === 'create') {
    const raw = { ...(item.payload ?? {}) }
    const listLocalId = raw.listId as number
    delete raw.id
    delete raw.listId
    const listServerId = await getServerId('shoppingLists', listLocalId)
    if (!listServerId) {
      if (await hasPendingCreate('shoppingLists', listLocalId)) return 'deferred'
      return 'deferred' // list was never created remotely; nothing sensible to do
    }
    const res = (await api.post(
      `/shopping-lists/${listServerId}/items`,
      raw,
    )) as { data: { id: string } }
    await db.idMap.put({
      key: idMapKey('shoppingItems', localId),
      entity: 'shoppingItems',
      localId,
      serverId: res.data.id,
    })
    await db.syncQueue.delete(item.id!)
    return 'done'
  }

  const serverId = await getServerId('shoppingItems', localId)
  if (!serverId) {
    if (await hasPendingCreate('shoppingItems', localId)) return 'deferred'
    await db.syncQueue.delete(item.id!)
    return 'done'
  }

  // Need the parent list's server id too; look it up from the local item itself.
  const localItem = await db.shoppingItems.get(localId)
  const listLocalId = localItem?.listId
  const listServerId = listLocalId
    ? await getServerId('shoppingLists', listLocalId)
    : undefined
  if (!listServerId) return 'deferred'

  if (op === 'update') {
    const payload = { ...(item.payload ?? {}) }
    delete payload.listId
    await api.patch(`/shopping-lists/${listServerId}/items/${serverId}`, payload)
  } else {
    await api.del(`/shopping-lists/${listServerId}/items/${serverId}`)
    await db.idMap.delete(idMapKey('shoppingItems', localId))
  }
  await db.syncQueue.delete(item.id!)
  return 'done'
}

let flushing = false
let flushTimer: ReturnType<typeof setTimeout> | null = null

/** Attempts to push every due queue item to the server; safe to call anytime. */
export async function flushQueue(): Promise<void> {
  if (flushing) return
  if (!navigator.onLine) return
  flushing = true
  try {
    await coalesceQueue()
    const now = Date.now()
    // Multiple passes let dependency chains (e.g. category -> budget) resolve
    // within a single flush, without needing to wait for the next tick.
    for (let pass = 0; pass < 5; pass++) {
      const due = await db.syncQueue
        .filter((i) => i.nextAttemptAt <= Date.now())
        .sortBy('id')
      if (!due.length) break
      let progressed = false
      for (const item of due) {
        try {
          const result = await processItem(item)
          if (result === 'done') progressed = true
        } catch {
          const attempts = item.attempts + 1
          await db.syncQueue.update(item.id!, {
            attempts,
            nextAttemptAt: now + backoffFor(attempts),
          })
        }
      }
      if (!progressed) break
    }
  } finally {
    flushing = false
  }
}

export function scheduleFlush(delayMs = 400): void {
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => {
    flushTimer = null
    void flushQueue()
  }, delayMs)
}

export async function pendingSyncCount(): Promise<number> {
  return db.syncQueue.count()
}

/** Drops all queued changes and id mappings — use after a destructive full restore. */
export async function resetSyncState(): Promise<void> {
  await db.syncQueue.clear()
  await db.idMap.clear()
}

let started = false

/** Wires up automatic sync triggers: on new queued changes, reconnect, and a periodic sweep. */
export function startSyncEngine(): void {
  if (started) return
  started = true

  const attachQueueTrigger = () => {
    db.syncQueue.hook('creating', () => {
      scheduleFlush()
    })
  }
  attachQueueTrigger()
  onDbSwitch(attachQueueTrigger)

  window.addEventListener('online', () => scheduleFlush(0))
  setInterval(() => {
    if (navigator.onLine) void flushQueue()
  }, 20_000)
}
