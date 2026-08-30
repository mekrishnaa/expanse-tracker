import { api } from './api'
import { applyBackup, collectBackup } from './backup'

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
}
