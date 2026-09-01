import { api } from './api'
import { applyBackup, collectBackup } from './backup'
import { db, idMapKey, SYNCABLE_TABLES } from '../db/db'

/** Push all local data to the server, replacing the family's cloud data. */
export async function syncToCloud(): Promise<Record<string, number>> {
  const backup = await collectBackup()
  const res = (await api.post('/migration/import?mode=replace', backup)) as {
    data?: { inserted?: Record<string, number> }
  }
  return res?.data?.inserted ?? {}
}

/** Pull the family's cloud data and replace local data with it. */
export async function restoreFromCloud(): Promise<void> {
  const backup = await api.get('/migration/export')
  await applyBackup(backup as { data?: Record<string, unknown[]> })
  await linkRestoredRecordsToServerIds()
}

/**
 * Every restored row carries its real server id in `serverId`. Without
 * recording that mapping, a later edit/delete of a restored (pre-existing)
 * record would have no server id to target and would silently be dropped.
 */
async function linkRestoredRecordsToServerIds(): Promise<void> {
  for (const entity of SYNCABLE_TABLES) {
    const rows = (await db.table(entity).toArray()) as Array<{
      id: number
      serverId?: string
    }>
    for (const row of rows) {
      if (!row.serverId) continue
      await db.idMap.put({
        key: idMapKey(entity, row.id),
        entity,
        localId: row.id,
        serverId: row.serverId,
      })
    }
  }
}

