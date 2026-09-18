import { getDb } from './database';
import { generateId } from '../utils/id';
import { addMonthsIso, todayIso } from '../utils/date';
import { updateOdometer } from './vehicles';
import type { OilChange, Vehicle } from '../types';

interface OilChangeRow {
  id: string;
  vehicle_id: string;
  date: string;
  odometer: number;
  next_due_odometer: number;
  next_due_date: string;
  notes: string | null;
  created_at: string;
}

function mapRow(row: OilChangeRow): OilChange {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    date: row.date,
    odometer: row.odometer,
    nextDueOdometer: row.next_due_odometer,
    nextDueDate: row.next_due_date,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export interface NewOilChangeInput {
  date: string;
  odometer: number;
  notes?: string;
}

export async function listOilChanges(vehicleId: string): Promise<OilChange[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<OilChangeRow>(
    'SELECT * FROM oil_changes WHERE vehicle_id = ? ORDER BY date DESC, created_at DESC',
    [vehicleId],
  );
  return rows.map(mapRow);
}

export async function getLastOilChange(vehicleId: string): Promise<OilChange | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<OilChangeRow>(
    'SELECT * FROM oil_changes WHERE vehicle_id = ? ORDER BY date DESC, created_at DESC LIMIT 1',
    [vehicleId],
  );
  return row ? mapRow(row) : null;
}

export async function createOilChange(vehicle: Vehicle, input: NewOilChangeInput): Promise<OilChange> {
  const db = await getDb();
  const id = generateId();
  const createdAt = todayIso();
  const nextDueOdometer = input.odometer + vehicle.oilIntervalKm;
  const nextDueDate = addMonthsIso(input.date, vehicle.oilIntervalMonths);

  await db.runAsync(
    `INSERT INTO oil_changes (id, vehicle_id, date, odometer, next_due_odometer, next_due_date, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, vehicle.id, input.date, input.odometer, nextDueOdometer, nextDueDate, input.notes ?? null, createdAt],
  );

  if (input.odometer > vehicle.odometer) {
    await updateOdometer(vehicle.id, input.odometer);
  }

  return {
    id,
    vehicleId: vehicle.id,
    date: input.date,
    odometer: input.odometer,
    nextDueOdometer,
    nextDueDate,
    notes: input.notes ?? null,
    createdAt,
  };
}

export async function deleteOilChange(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM oil_changes WHERE id = ?', [id]);
}

export async function listAllOilChanges(): Promise<OilChange[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<OilChangeRow>('SELECT * FROM oil_changes ORDER BY date DESC, created_at DESC');
  return rows.map(mapRow);
}

export async function insertOilChangeRaw(oilChange: OilChange): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO oil_changes (id, vehicle_id, date, odometer, next_due_odometer, next_due_date, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      oilChange.id,
      oilChange.vehicleId,
      oilChange.date,
      oilChange.odometer,
      oilChange.nextDueOdometer,
      oilChange.nextDueDate,
      oilChange.notes,
      oilChange.createdAt,
    ],
  );
}
