import { getDb } from './database';

export const ONBOARDING_DONE_KEY = 'onboarding_done';
export const LAST_BACKUP_AT_KEY = 'last_backup_at';
export const VEHICLE_LIST_VIEW_MODE_KEY = 'vehicle_list_view_mode';

export async function getMetadata(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_metadata WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function setMetadata(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO app_metadata (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
}
