import { getDb } from './database';
import { generateId } from '../utils/id';
import { todayIso } from '../utils/date';
import { deletePhoto } from '../utils/photos';
import type { Checklist, ItemStatus } from '../types';

interface ChecklistRow {
  id: string;
  vehicle_id: string;
  date: string;
  tire_status: ItemStatus;
  tire_photo_uri: string | null;
  water_status: ItemStatus;
  water_photo_uri: string | null;
  oil_status: ItemStatus;
  oil_photo_uri: string | null;
  notes: string | null;
  created_at: string;
}

function mapRow(row: ChecklistRow): Checklist {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    date: row.date,
    tireStatus: row.tire_status,
    tirePhotoUri: row.tire_photo_uri,
    waterStatus: row.water_status,
    waterPhotoUri: row.water_photo_uri,
    oilStatus: row.oil_status,
    oilPhotoUri: row.oil_photo_uri,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export interface NewChecklistInput {
  date: string;
  tireStatus: ItemStatus;
  tirePhotoUri: string | null;
  waterStatus: ItemStatus;
  waterPhotoUri: string | null;
  oilStatus: ItemStatus;
  oilPhotoUri: string | null;
  notes?: string;
}

export async function listChecklists(vehicleId: string): Promise<Checklist[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ChecklistRow>(
    'SELECT * FROM checklists WHERE vehicle_id = ? ORDER BY date DESC, created_at DESC',
    [vehicleId],
  );
  return rows.map(mapRow);
}

export async function getLastChecklist(vehicleId: string): Promise<Checklist | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ChecklistRow>(
    'SELECT * FROM checklists WHERE vehicle_id = ? ORDER BY date DESC, created_at DESC LIMIT 1',
    [vehicleId],
  );
  return row ? mapRow(row) : null;
}

export async function createChecklist(vehicleId: string, input: NewChecklistInput): Promise<Checklist> {
  const db = await getDb();
  const id = generateId();
  const createdAt = todayIso();

  await db.runAsync(
    `INSERT INTO checklists (
       id, vehicle_id, date, tire_status, tire_photo_uri, water_status, water_photo_uri, oil_status, oil_photo_uri, notes, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      vehicleId,
      input.date,
      input.tireStatus,
      input.tirePhotoUri,
      input.waterStatus,
      input.waterPhotoUri,
      input.oilStatus,
      input.oilPhotoUri,
      input.notes ?? null,
      createdAt,
    ],
  );

  return {
    id,
    vehicleId,
    date: input.date,
    tireStatus: input.tireStatus,
    tirePhotoUri: input.tirePhotoUri,
    waterStatus: input.waterStatus,
    waterPhotoUri: input.waterPhotoUri,
    oilStatus: input.oilStatus,
    oilPhotoUri: input.oilPhotoUri,
    notes: input.notes ?? null,
    createdAt,
  };
}

export async function deleteChecklist(checklist: Checklist): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM checklists WHERE id = ?', [checklist.id]);
  await deletePhoto(checklist.tirePhotoUri);
  await deletePhoto(checklist.waterPhotoUri);
  await deletePhoto(checklist.oilPhotoUri);
}

export async function listAllChecklists(): Promise<Checklist[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ChecklistRow>('SELECT * FROM checklists ORDER BY date DESC, created_at DESC');
  return rows.map(mapRow);
}

export async function insertChecklistRaw(checklist: Checklist): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO checklists (
       id, vehicle_id, date, tire_status, tire_photo_uri, water_status, water_photo_uri, oil_status, oil_photo_uri, notes, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      checklist.id,
      checklist.vehicleId,
      checklist.date,
      checklist.tireStatus,
      checklist.tirePhotoUri,
      checklist.waterStatus,
      checklist.waterPhotoUri,
      checklist.oilStatus,
      checklist.oilPhotoUri,
      checklist.notes,
      checklist.createdAt,
    ],
  );
}
