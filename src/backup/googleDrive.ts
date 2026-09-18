import { getValidAccessToken } from '../auth/googleAuth';

const DRIVE_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/drive/v3/files';

export interface DriveFile {
  id: string;
  name: string;
}

async function authorizedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await getValidAccessToken();
  if (!token) {
    throw new Error('NOT_SIGNED_IN');
  }
  const response = await fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Falha na requisição ao Drive (${response.status}): ${text}`);
  }
  return response;
}

export async function listAppDataFiles(): Promise<DriveFile[]> {
  const url = `${DRIVE_FILES_ENDPOINT}?spaces=appDataFolder&fields=${encodeURIComponent('files(id,name)')}&pageSize=1000`;
  const response = await authorizedFetch(url);
  const json = await response.json();
  return (json.files as DriveFile[]) ?? [];
}

async function createAppDataFile(name: string, mimeType: string): Promise<string> {
  const response = await authorizedFetch(DRIVE_FILES_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parents: ['appDataFolder'], mimeType }),
  });
  const json = await response.json();
  return json.id as string;
}

export async function saveAppDataFile(
  name: string,
  mimeType: string,
  body: BodyInit,
  existingFileId?: string,
): Promise<void> {
  const fileId = existingFileId ?? (await createAppDataFile(name, mimeType));
  await authorizedFetch(`${DRIVE_UPLOAD_ENDPOINT}/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { 'Content-Type': mimeType },
    body,
  });
}

export async function downloadAppDataFileText(fileId: string): Promise<string> {
  const response = await authorizedFetch(`${DRIVE_FILES_ENDPOINT}/${fileId}?alt=media`);
  return response.text();
}

export async function downloadAppDataFileBytes(fileId: string): Promise<Uint8Array> {
  const response = await authorizedFetch(`${DRIVE_FILES_ENDPOINT}/${fileId}?alt=media`);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}
