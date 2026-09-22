import { FlexWidget, ImageWidget, OverlapWidget, TextWidget } from 'react-native-android-widget';
import type { NextMaintenanceInfo } from './nextMaintenance';

interface NextMaintenanceWidgetProps {
  info: NextMaintenanceInfo | null;
}

export function NextMaintenanceWidget({ info }: NextMaintenanceWidgetProps) {
  const hasPhoto = Boolean(info?.photo);
  const textColor = hasPhoto ? '#FFFFFF' : '#1C1F26';
  const mutedTextColor = hasPhoto ? 'rgba(255, 255, 255, 0.85)' : '#6B7280';

  return (
    <OverlapWidget
      clickAction={info ? 'OPEN_URI' : 'OPEN_APP'}
      clickActionData={info ? { uri: `tiaogaragem://vehicle/${info.vehicleId}` } : undefined}
      style={{ height: 'match_parent', width: 'match_parent', borderRadius: 16, overflow: 'hidden' }}
    >
      {info?.photo ? (
        <ImageWidget
          image={info.photo.uri as `data:image${string}`}
          imageWidth={info.photo.width}
          imageHeight={info.photo.height}
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
          backgroundColor: hasPhoto ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0)',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 14,
        }}
      >
        <TextWidget
          text={info?.vehicleName ?? 'TiaoGaragem'}
          style={{ fontSize: 22, fontWeight: 'bold', color: textColor }}
          maxLines={1}
        />

        {info ? (
          <FlexWidget style={{ flexDirection: 'column' }}>
            <TextWidget text={info.title} style={{ fontSize: 15, fontWeight: 'bold', color: textColor }} maxLines={1} />
            <TextWidget text={info.detail} style={{ fontSize: 14, color: mutedTextColor, marginTop: 2 }} maxLines={2} />
          </FlexWidget>
        ) : (
          <TextWidget text="Tudo em dia por aqui" style={{ fontSize: 16, color: textColor }} />
        )}

        {info && <TextWidget text="TiaoGaragem" style={{ fontSize: 11, color: mutedTextColor }} />}
      </FlexWidget>
    </OverlapWidget>
  );
}
