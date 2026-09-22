import { getDb } from './database';
import { generateId } from '../utils/id';
import type { FipeValue } from '../types';

interface FipeValueRow {
  id: string;
  vehicle_id: string;
  reference_month: string;
  value: number;
  fetched_at: string;
}

function mapRow(row: FipeValueRow): FipeValue {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    referenceMonth: row.reference_month,
    value: row.value,
    fetchedAt: row.fetched_at,
  };
}

export async function listFipeValues(vehicleId: string): Promise<FipeValue[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<FipeValueRow>(
    'SELECT * FROM fipe_values WHERE vehicle_id = ? ORDER BY reference_month ASC',
    [vehicleId],
  );
  return rows.map(mapRow);
}

export async function upsertFipeValue(
  vehicleId: string,
  referenceMonth: string,
  value: number,
  fetchedAt: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO fipe_values (id, vehicle_id, reference_month, value, fetched_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (vehicle_id, reference_month) DO UPDATE SET value = excluded.value, fetched_at = excluded.fetched_at`,
    [generateId(), vehicleId, referenceMonth, value, fetchedAt],
  );
}

export async function listAllFipeValues(): Promise<FipeValue[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<FipeValueRow>('SELECT * FROM fipe_values ORDER BY reference_month ASC');
  return rows.map(mapRow);
}

export async function insertFipeValueRaw(entry: FipeValue): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO fipe_values (id, vehicle_id, reference_month, value, fetched_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (vehicle_id, reference_month) DO UPDATE SET value = excluded.value, fetched_at = excluded.fetched_at`,
    [entry.id, entry.vehicleId, entry.referenceMonth, entry.value, entry.fetchedAt],
  );
}
