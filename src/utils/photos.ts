import { Directory, File, Paths } from 'expo-file-system';

const photosDirectory = new Directory(Paths.document, 'photos');

function ensurePhotosDirectory() {
  if (!photosDirectory.exists) {
    photosDirectory.create({ intermediates: true });
  }
}

export async function persistPhoto(temporaryUri: string): Promise<string> {
  ensurePhotosDirectory();
  const source = new File(temporaryUri);
  const extension = source.extension || '.jpg';
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e6)}${extension}`;
  const destination = new File(photosDirectory, filename);
  await source.copy(destination);
  return destination.uri;
}

export async function deletePhoto(uri: string | null | undefined): Promise<void> {
  if (!uri) return;
  const file = new File(uri);
  if (file.exists) {
    file.delete();
  }
}
