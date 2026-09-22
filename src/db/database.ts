import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('car', 'moto')),
      plate TEXT,
      renavam TEXT,
      odometer INTEGER NOT NULL DEFAULT 0,
      oil_interval_km INTEGER NOT NULL DEFAULT 3000,
      oil_interval_months INTEGER NOT NULL DEFAULT 6,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS oil_changes (
      id TEXT PRIMARY KEY NOT NULL,
      vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      odometer INTEGER NOT NULL,
      next_due_odometer INTEGER NOT NULL,
      next_due_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS checklists (
      id TEXT PRIMARY KEY NOT NULL,
      vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      tire_status TEXT NOT NULL CHECK (tire_status IN ('ok', 'atencao', 'critico')),
      tire_photo_uri TEXT,
      water_status TEXT NOT NULL CHECK (water_status IN ('ok', 'atencao', 'critico')),
      water_photo_uri TEXT,
      oil_status TEXT NOT NULL CHECK (oil_status IN ('ok', 'atencao', 'critico')),
      oil_photo_uri TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_oil_changes_vehicle ON oil_changes(vehicle_id, date DESC);
    CREATE INDEX IF NOT EXISTS idx_checklists_vehicle ON checklists(vehicle_id, date DESC);

    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fipe_values (
      id TEXT PRIMARY KEY NOT NULL,
      vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      reference_month TEXT NOT NULL,
      value REAL NOT NULL,
      fetched_at TEXT NOT NULL,
      UNIQUE (vehicle_id, reference_month)
    );

    CREATE INDEX IF NOT EXISTS idx_fipe_values_vehicle ON fipe_values(vehicle_id, reference_month ASC);
  `);

  await ensureColumn(db, 'vehicles', 'uf', 'TEXT');
  await ensureColumn(db, 'vehicles', 'ipva_due_date', 'TEXT');
  await ensureColumn(db, 'vehicles', 'licensing_due_date', 'TEXT');
  await ensureColumn(db, 'vehicles', 'photo_uri', 'TEXT');
  await ensureColumn(db, 'vehicles', 'fipe_brand_code', 'TEXT');
  await ensureColumn(db, 'vehicles', 'fipe_model_code', 'TEXT');
  await ensureColumn(db, 'vehicles', 'fipe_year_code', 'TEXT');
  await ensureColumn(db, 'vehicles', 'fipe_label', 'TEXT');
}

async function ensureColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some((c) => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('tiaogaragem.db');
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}
