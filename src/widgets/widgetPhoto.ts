import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const WIDGET_PHOTO_WIDTH = 320;

export async function getWidgetPhotoDataUri(photoUri: string | null): Promise<string | null> {
  if (!photoUri) return null;
  try {
    const context = ImageManipulator.manipulate(photoUri);
    context.resize({ width: WIDGET_PHOTO_WIDTH });
    const rendered = await context.renderAsync();
    const result = await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.5,
      base64: true,
    });
    return result.base64 ? `data:image/jpeg;base64,${result.base64}` : null;
  } catch {
    return null;
  }
}
