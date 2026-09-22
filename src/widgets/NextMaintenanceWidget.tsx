import { FlexWidget, ImageWidget, OverlapWidget, TextWidget } from 'react-native-android-widget';
import type { NextMaintenanceInfo } from './nextMaintenance';

interface NextMaintenanceWidgetProps {
  info: NextMaintenanceInfo | null;
}

export function NextMaintenanceWidget({ info }: NextMaintenanceWidgetProps) {
  const hasPhoto = Boolean(info?.photoDataUri);
  const textColor = hasPhoto ? '#FFFFFF' : '#1C1F26';

  return (
    <OverlapWidget
      clickAction={info ? 'OPEN_URI' : 'OPEN_APP'}
      clickActionData={info ? { uri: `tiaogaragem://vehicle/${info.vehicleId}` } : undefined}
      style={{ height: 'match_parent', width: 'match_parent', borderRadius: 16, overflow: 'hidden' }}
    >
      {info?.photoDataUri ? (
        <ImageWidget
          image={info.photoDataUri as `data:image${string}`}
          imageWidth={320}
          imageHeight={200}
          resizeMode="cover"
          style={{ height: 'match_parent', width: 'match_parent' }}
        />
      ) : (
        <FlexWidget style={{ height: 'match_parent', width: 'match_parent', backgroundColor: '#EFF4FF' }} />
      )}

      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: hasPhoto ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0)',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <TextWidget text="TiaoGaragem" style={{ fontSize: 11, color: textColor }} />
        {info ? (
          <FlexWidget style={{ flexDirection: 'column', alignItems: 'center', marginTop: 4 }}>
            <TextWidget
              text={info.vehicleName}
              style={{ fontSize: 18, fontWeight: 'bold', color: textColor, textAlign: 'center' }}
              maxLines={1}
            />
            <TextWidget
              text={`${info.title} · ${info.detail}`}
              style={{ fontSize: 13, color: textColor, marginTop: 2, textAlign: 'center' }}
              maxLines={2}
            />
          </FlexWidget>
        ) : (
          <TextWidget text="Tudo em dia por aqui" style={{ fontSize: 16, color: textColor, marginTop: 4 }} />
        )}
      </FlexWidget>
    </OverlapWidget>
  );
}
