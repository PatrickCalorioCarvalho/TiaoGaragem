import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getMetadata, setMetadata } from '../db/metadata';

const ANDROID_CHANNEL_ID = 'checklist-reminder';
const NOTIFICATION_ID_KEY = 'checklist_reminder_notification_id';
export const CHECKLIST_REMINDER_ENABLED_KEY = 'checklist_reminder_enabled';

const WEEKDAY_SUNDAY = 1;
const HOUR = 9;
const MINUTE = 0;

async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Checklist semanal',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function isChecklistReminderEnabled(): Promise<boolean> {
  return (await getMetadata(CHECKLIST_REMINDER_ENABLED_KEY)) === 'true';
}

export async function setChecklistReminderEnabled(enabled: boolean): Promise<boolean> {
  const existingId = await getMetadata(NOTIFICATION_ID_KEY);
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId).catch(() => undefined);
    await setMetadata(NOTIFICATION_ID_KEY, '');
  }

  if (!enabled) {
    await setMetadata(CHECKLIST_REMINDER_ENABLED_KEY, 'false');
    return true;
  }

  const granted = await ensurePermission();
  if (!granted) {
    await setMetadata(CHECKLIST_REMINDER_ENABLED_KEY, 'false');
    return false;
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Checklist semanal',
      body: 'Hora de conferir pneu, água e óleo dos seus veículos.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: WEEKDAY_SUNDAY,
      hour: HOUR,
      minute: MINUTE,
      channelId: ANDROID_CHANNEL_ID,
    },
  });
  await setMetadata(NOTIFICATION_ID_KEY, id);
  await setMetadata(CHECKLIST_REMINDER_ENABLED_KEY, 'true');
  return true;
}
