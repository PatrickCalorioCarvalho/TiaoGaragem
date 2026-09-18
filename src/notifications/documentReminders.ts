import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getMetadata, setMetadata } from '../db/metadata';

const ANDROID_CHANNEL_ID = 'document-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const OFFSET_DAYS_BEFORE_AND_AFTER = [-15, 0, 5];

export function ipvaMetadataKey(vehicleId: string): string {
  return `notif_ipva_${vehicleId}`;
}

export function licensingMetadataKey(vehicleId: string): string {
  return `notif_licensing_${vehicleId}`;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Documentos do veículo',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelDocumentReminders(metadataKey: string): Promise<void> {
  const raw = await getMetadata(metadataKey);
  if (!raw) return;
  const ids: string[] = JSON.parse(raw);
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
  await setMetadata(metadataKey, JSON.stringify([]));
}

export async function scheduleDocumentReminders(
  metadataKey: string,
  title: string,
  body: string,
  dueDateIso: string | null,
): Promise<void> {
  await cancelDocumentReminders(metadataKey);
  if (!dueDateIso) return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const due = new Date(`${dueDateIso}T09:00:00`);
  const ids: string[] = [];

  for (const offset of OFFSET_DAYS_BEFORE_AND_AFTER) {
    const fireDate = new Date(due);
    fireDate.setDate(fireDate.getDate() + offset);
    if (fireDate.getTime() <= Date.now()) continue;

    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
    ids.push(id);
  }

  await setMetadata(metadataKey, JSON.stringify(ids));
}
