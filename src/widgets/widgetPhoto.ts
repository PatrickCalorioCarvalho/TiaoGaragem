import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const WIDGET_PHOTO_WIDTH = 320;

export interface WidgetPhoto {
  uri: string;
  width: number;
  height: number;
}

export async function getWidgetPhoto(photoUri: string | null): Promise<WidgetPhoto | null> {
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
    if (!result.base64) return null;
    return { uri: `data:image/jpeg;base64,${result.base64}`, width: result.width, height: result.height };
  } catch {
    return null;
  }
}
