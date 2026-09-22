import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { NextMaintenanceWidget } from './NextMaintenanceWidget';
import { computeNextMaintenance } from './nextMaintenance';

export async function refreshMaintenanceWidget(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    const info = await computeNextMaintenance();
    await requestWidgetUpdate({
      widgetName: 'NextMaintenance',
      renderWidget: () => <NextMaintenanceWidget info={info} />,
    });
  } catch {
    // Widget not added to the home screen yet, or Play Services unavailable — safe to ignore.
  }
}
