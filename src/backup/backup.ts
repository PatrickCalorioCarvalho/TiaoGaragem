import { Directory, File, Paths } from 'expo-file-system';
import { deleteAllVehicles, insertVehicleRaw, listVehicles } from '../db/vehicles';
import { insertOilChangeRaw, listAllOilChanges } from '../db/oilChanges';
import { insertChecklistRaw, listAllChecklists } from '../db/checklists';
import { downloadAppDataFileBytes, downloadAppDataFileText, listAppDataFiles, saveAppDataFile } from './googleDrive';
import type { Checklist, ItemStatus, OilChange, Vehicle } from '../types';

const MANIFEST_NAME = 'tiaogaragem-backup.json';
const photosDirectory = new Directory(Paths.document, 'photos');

interface BackupChecklist {
  id: string;
  vehicleId: string;
  date: string;
  tireStatus: ItemStatus;
  tirePhotoName: string | null;
  waterStatus: ItemStatus;
  waterPhotoName: string | null;
  oilStatus: ItemStatus;
  oilPhotoName: string | null;
  notes: string | null;
  createdAt: string;
}

interface BackupManifest {
  version: 1;
  exportedAt: string;
  vehicles: Vehicle[];
  oilChanges: OilChange[];
  checklists: BackupChecklist[];
}

function photoNameOf(uri: string | null): string | null {
  return uri ? new File(uri).name : null;
}

export interface BackupInfo {
  exportedAt: string;
  vehicleCount: number;
}

export async function getBackupInfo(): Promise<BackupInfo | null> {
  const existingFiles = await listAppDataFiles();
  const manifestEntry = existingFiles.find((file) => file.name === MANIFEST_NAME);
  if (!manifestEntry) return null;

  const manifest = JSON.parse(await downloadAppDataFileText(manifestEntry.id)) as BackupManifest;
  return { exportedAt: manifest.exportedAt, vehicleCount: manifest.vehicles.length };
}

export async function performBackup(): Promise<{ photosUploaded: number }> {
  const [vehicles, oilChanges, checklists] = await Promise.all([
    listVehicles(),
    listAllOilChanges(),
    listAllChecklists(),
  ]);

  const manifest: BackupManifest = {
    version: 1,
    exportedAt: new Date().toISOString(),
    vehicles,
    oilChanges,
    checklists: checklists.map((checklist) => ({
      id: checklist.id,
      vehicleId: checklist.vehicleId,
      date: checklist.date,
      tireStatus: checklist.tireStatus,
      tirePhotoName: photoNameOf(checklist.tirePhotoUri),
      waterStatus: checklist.waterStatus,
      waterPhotoName: photoNameOf(checklist.waterPhotoUri),
      oilStatus: checklist.oilStatus,
      oilPhotoName: photoNameOf(checklist.oilPhotoUri),
      notes: checklist.notes,
      createdAt: checklist.createdAt,
    })),
  };

  const existingFiles = await listAppDataFiles();
  const existingByName = new Map(existingFiles.map((file) => [file.name, file.id]));

  await saveAppDataFile(
    MANIFEST_NAME,
    'application/json',
    JSON.stringify(manifest),
    existingByName.get(MANIFEST_NAME),
  );

  const photoNames = new Set<string>();
  for (const checklist of manifest.checklists) {
    if (checklist.tirePhotoName) photoNames.add(checklist.tirePhotoName);
    if (checklist.waterPhotoName) photoNames.add(checklist.waterPhotoName);
    if (checklist.oilPhotoName) photoNames.add(checklist.oilPhotoName);
  }

  let photosUploaded = 0;
  for (const name of photoNames) {
    if (existingByName.has(name)) continue;
    const file = new File(photosDirectory, name);
    if (!file.exists) continue;
    const bytes = await file.bytes();
    await saveAppDataFile(name, file.type || 'image/jpeg', bytes);
    photosUploaded += 1;
  }

  return { photosUploaded };
}

export async function performRestore(): Promise<{ photosRestored: number }> {
  const existingFiles = await listAppDataFiles();
  const manifestEntry = existingFiles.find((file) => file.name === MANIFEST_NAME);
  if (!manifestEntry) {
    throw new Error('Nenhum backup encontrado no Google Drive.');
  }

  const manifest = JSON.parse(await downloadAppDataFileText(manifestEntry.id)) as BackupManifest;

  if (!photosDirectory.exists) {
    photosDirectory.create({ intermediates: true });
  }

  const filesByName = new Map(existingFiles.map((file) => [file.name, file.id]));
  let photosRestored = 0;

  async function restorePhoto(name: string | null): Promise<string | null> {
    if (!name) return null;
    const destination = new File(photosDirectory, name);
    if (!destination.exists) {
      const fileId = filesByName.get(name);
      if (!fileId) return null;
      const bytes = await downloadAppDataFileBytes(fileId);
      destination.create({ overwrite: true, intermediates: true });
      destination.write(bytes);
      photosRestored += 1;
    }
    return destination.uri;
  }

  await deleteAllVehicles();

  for (const vehicle of manifest.vehicles) {
    await insertVehicleRaw(vehicle);
  }
  for (const oilChange of manifest.oilChanges) {
    await insertOilChangeRaw(oilChange);
  }
  for (const checklist of manifest.checklists) {
    const restored: Checklist = {
      id: checklist.id,
      vehicleId: checklist.vehicleId,
      date: checklist.date,
      tireStatus: checklist.tireStatus,
      tirePhotoUri: await restorePhoto(checklist.tirePhotoName),
      waterStatus: checklist.waterStatus,
      waterPhotoUri: await restorePhoto(checklist.waterPhotoName),
      oilStatus: checklist.oilStatus,
      oilPhotoUri: await restorePhoto(checklist.oilPhotoName),
      notes: checklist.notes,
      createdAt: checklist.createdAt,
    };
    await insertChecklistRaw(restored);
  }

  return { photosRestored };
}
