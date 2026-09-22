import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { NextMaintenanceWidget } from './NextMaintenanceWidget';
import { computeNextMaintenance } from './nextMaintenance';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== 'NextMaintenance') return;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const info = await computeNextMaintenance();
      props.renderWidget(<NextMaintenanceWidget info={info} />);
      break;
    }
    default:
      break;
  }
}
