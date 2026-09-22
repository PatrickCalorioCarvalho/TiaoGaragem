import { getDb } from './database';
import { generateId } from '../utils/id';
import { todayIso } from '../utils/date';
import { deletePhoto } from '../utils/photos';
import type { Vehicle, VehicleType } from '../types';

interface VehicleRow {
  id: string;
  name: string;
  type: VehicleType;
  plate: string | null;
  renavam: string | null;
  uf: string | null;
  odometer: number;
  oil_interval_km: number;
  oil_interval_months: number;
  ipva_due_date: string | null;
  licensing_due_date: string | null;
  photo_uri: string | null;
  fipe_brand_code: string | null;
  fipe_model_code: string | null;
  fipe_year_code: string | null;
  fipe_label: string | null;
  created_at: string;
}

function mapRow(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    plate: row.plate,
    renavam: row.renavam,
    uf: row.uf,
    odometer: row.odometer,
    oilIntervalKm: row.oil_interval_km,
    oilIntervalMonths: row.oil_interval_months,
    ipvaDueDate: row.ipva_due_date,
    licensingDueDate: row.licensing_due_date,
    photoUri: row.photo_uri,
    fipeBrandCode: row.fipe_brand_code,
    fipeModelCode: row.fipe_model_code,
    fipeYearCode: row.fipe_year_code,
    fipeLabel: row.fipe_label,
    createdAt: row.created_at,
  };
}

export interface NewVehicleInput {
  name: string;
  type: VehicleType;
  plate?: string;
  renavam?: string;
  uf?: string;
  odometer: number;
  oilIntervalKm: number;
  oilIntervalMonths: number;
  photoUri?: string | null;
  fipeBrandCode?: string | null;
  fipeModelCode?: string | null;
  fipeYearCode?: string | null;
  fipeLabel?: string | null;
}

export async function listVehicles(): Promise<Vehicle[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<VehicleRow>('SELECT * FROM vehicles ORDER BY created_at DESC');
  return rows.map(mapRow);
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<VehicleRow>('SELECT * FROM vehicles WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function createVehicle(input: NewVehicleInput): Promise<Vehicle> {
  const db = await getDb();
  const id = generateId();
  const createdAt = todayIso();
  await db.runAsync(
    `INSERT INTO vehicles (
       id, name, type, plate, renavam, uf, odometer, oil_interval_km, oil_interval_months,
       photo_uri, fipe_brand_code, fipe_model_code, fipe_year_code, fipe_label, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.type,
      input.plate ?? null,
      input.renavam ?? null,
      input.uf ?? null,
      input.odometer,
      input.oilIntervalKm,
      input.oilIntervalMonths,
      input.photoUri ?? null,
      input.fipeBrandCode ?? null,
      input.fipeModelCode ?? null,
      input.fipeYearCode ?? null,
      input.fipeLabel ?? null,
      createdAt,
    ],
  );
  return {
    id,
    name: input.name,
    type: input.type,
    plate: input.plate ?? null,
    renavam: input.renavam ?? null,
    uf: input.uf ?? null,
    odometer: input.odometer,
    oilIntervalKm: input.oilIntervalKm,
    oilIntervalMonths: input.oilIntervalMonths,
    ipvaDueDate: null,
    licensingDueDate: null,
    photoUri: input.photoUri ?? null,
    fipeBrandCode: input.fipeBrandCode ?? null,
    fipeModelCode: input.fipeModelCode ?? null,
    fipeYearCode: input.fipeYearCode ?? null,
    fipeLabel: input.fipeLabel ?? null,
    createdAt,
  };
}

export async function updateVehicle(id: string, input: NewVehicleInput): Promise<void> {
  const db = await getDb();
  const previous = await getVehicle(id);
  if (previous && previous.photoUri && previous.photoUri !== input.photoUri) {
    await deletePhoto(previous.photoUri);
  }
  await db.runAsync(
    `UPDATE vehicles
     SET name = ?, type = ?, plate = ?, renavam = ?, uf = ?, odometer = ?, oil_interval_km = ?, oil_interval_months = ?,
         photo_uri = ?, fipe_brand_code = ?, fipe_model_code = ?, fipe_year_code = ?, fipe_label = ?
     WHERE id = ?`,
    [
      input.name,
      input.type,
      input.plate ?? null,
      input.renavam ?? null,
      input.uf ?? null,
      input.odometer,
      input.oilIntervalKm,
      input.oilIntervalMonths,
      input.photoUri ?? null,
      input.fipeBrandCode ?? null,
      input.fipeModelCode ?? null,
      input.fipeYearCode ?? null,
      input.fipeLabel ?? null,
      id,
    ],
  );
}

export async function updateVehicleDocuments(
  id: string,
  documents: { ipvaDueDate: string | null; licensingDueDate: string | null },
): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE vehicles SET ipva_due_date = ?, licensing_due_date = ? WHERE id = ?', [
    documents.ipvaDueDate,
    documents.licensingDueDate,
    id,
  ]);
}

export async function deleteVehicle(id: string): Promise<void> {
  const db = await getDb();
  const vehicle = await getVehicle(id);
  await db.runAsync('DELETE FROM vehicles WHERE id = ?', [id]);
  if (vehicle) {
    await deletePhoto(vehicle.photoUri);
  }
}

export async function deleteAllVehicles(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM vehicles');
}

export async function insertVehicleRaw(vehicle: Vehicle): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO vehicles (
       id, name, type, plate, renavam, uf, odometer, oil_interval_km, oil_interval_months, ipva_due_date, licensing_due_date,
       photo_uri, fipe_brand_code, fipe_model_code, fipe_year_code, fipe_label, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      vehicle.id,
      vehicle.name,
      vehicle.type,
      vehicle.plate,
      vehicle.renavam,
      vehicle.uf,
      vehicle.odometer,
      vehicle.oilIntervalKm,
      vehicle.oilIntervalMonths,
      vehicle.ipvaDueDate,
      vehicle.licensingDueDate,
      vehicle.photoUri,
      vehicle.fipeBrandCode,
      vehicle.fipeModelCode,
      vehicle.fipeYearCode,
      vehicle.fipeLabel,
      vehicle.createdAt,
    ],
  );
}

export async function updateOdometer(id: string, odometer: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE vehicles SET odometer = ? WHERE id = ?', [odometer, id]);
}
