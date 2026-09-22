import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { NextMaintenanceInfo } from './nextMaintenance';

interface NextMaintenanceWidgetProps {
  info: NextMaintenanceInfo | null;
}

export function NextMaintenanceWidget({ info }: NextMaintenanceWidgetProps) {
  return (
    <FlexWidget
      clickAction={info ? 'OPEN_URI' : 'OPEN_APP'}
      clickActionData={info ? { uri: `tiaogaragem://vehicle/${info.vehicleId}` } : undefined}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <TextWidget text="TiaoGaragem" style={{ fontSize: 12, color: '#6B7280' }} />
      {info ? (
        <FlexWidget style={{ flexDirection: 'column', marginTop: 4 }}>
          <TextWidget
            text={info.vehicleName}
            style={{ fontSize: 18, fontWeight: 'bold', color: '#1C1F26' }}
            maxLines={1}
          />
          <TextWidget
            text={`${info.title} · ${info.detail}`}
            style={{ fontSize: 14, color: '#2563EB', marginTop: 2 }}
            maxLines={2}
          />
        </FlexWidget>
      ) : (
        <TextWidget text="Tudo em dia por aqui" style={{ fontSize: 16, color: '#1C1F26', marginTop: 4 }} />
      )}
    </FlexWidget>
  );
}
