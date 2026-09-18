import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { StatusBadge } from '../../../src/components/StatusBadge';
import { getVehicle } from '../../../src/db/vehicles';
import { listOilChanges } from '../../../src/db/oilChanges';
import { listChecklists } from '../../../src/db/checklists';
import { colors } from '../../../src/theme/colors';
import { formatDateBR } from '../../../src/utils/date';
import { getChecklistState, getDocumentState, getOilChangeState } from '../../../src/utils/status';
import {
  checklistUrgencyKind,
  checklistUrgencyLabel,
  documentUrgencyKind,
  documentUrgencyLabel,
  itemStatusKind,
  itemStatusLabel,
  maintenanceUrgencyKind,
  maintenanceUrgencyLabel,
  vehicleTypeIcon,
  vehicleTypeLabel,
} from '../../../src/utils/labels';
import type { Checklist, OilChange, Vehicle } from '../../../src/types';

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [oilChanges, setOilChanges] = useState<OilChange[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [v, changes, lists] = await Promise.all([getVehicle(id), listOilChanges(id), listChecklists(id)]);
        if (cancelled) return;
        setVehicle(v);
        setOilChanges(changes);
        setChecklists(lists);
      })();
      return () => {
        cancelled = true;
      };
    }, [id]),
  );

  if (!vehicle) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const lastOilChange = oilChanges[0] ?? null;
  const lastChecklist = checklists[0] ?? null;
  const oilState = getOilChangeState(vehicle, lastOilChange);
  const checklistState = getChecklistState(lastChecklist?.date ?? null);
  const ipvaState = getDocumentState(vehicle.ipvaDueDate);
  const licensingState = getDocumentState(vehicle.licensingDueDate);

  return (
    <>
      <Stack.Screen
        options={{
          title: vehicle.name,
          headerRight: () => (
            <Link href={`/vehicle/${id}/edit`} asChild>
              <Pressable hitSlop={8}>
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </Pressable>
            </Link>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.headerCard}>
          <MaterialCommunityIcons name={vehicleTypeIcon(vehicle.type)} size={32} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.vehicleName}>{vehicle.name}</Text>
            <Text style={styles.vehicleMeta}>
              {vehicleTypeLabel(vehicle.type)}
              {vehicle.plate ? ` • ${vehicle.plate}` : ''} • {vehicle.odometer.toLocaleString('pt-BR')} km
            </Text>
          </View>
        </Card>

        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Troca de óleo</Text>
            <StatusBadge label={maintenanceUrgencyLabel(oilState.urgency)} kind={maintenanceUrgencyKind(oilState.urgency)} />
          </View>
          {lastOilChange ? (
            <Text style={styles.statusDetail}>
              Última troca: {formatDateBR(lastOilChange.date)} • {lastOilChange.odometer.toLocaleString('pt-BR')} km
              {'\n'}Próxima: {formatDateBR(lastOilChange.nextDueDate)} ou {lastOilChange.nextDueOdometer.toLocaleString('pt-BR')} km
            </Text>
          ) : (
            <Text style={styles.statusDetail}>Nenhuma troca registrada ainda.</Text>
          )}
          <Button label="Registrar troca de óleo" onPress={() => router.push(`/vehicle/${id}/oil-change`)} />
        </Card>

        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Checklist semanal</Text>
            <StatusBadge label={checklistUrgencyLabel(checklistState.urgency)} kind={checklistUrgencyKind(checklistState.urgency)} />
          </View>
          {lastChecklist ? (
            <Text style={styles.statusDetail}>Último checklist: {formatDateBR(lastChecklist.date)}</Text>
          ) : (
            <Text style={styles.statusDetail}>Nenhum checklist registrado ainda.</Text>
          )}
          <Button label="Novo checklist" onPress={() => router.push(`/vehicle/${id}/checklist`)} />
        </Card>

        <Card style={styles.statusCard}>
          <Text style={styles.statusTitle}>IPVA e licenciamento</Text>
          <View style={styles.documentRow}>
            <Text style={styles.statusDetail}>IPVA</Text>
            <StatusBadge label={documentUrgencyLabel(ipvaState.urgency)} kind={documentUrgencyKind(ipvaState.urgency)} />
          </View>
          {vehicle.ipvaDueDate && <Text style={styles.statusDetail}>Vencimento: {formatDateBR(vehicle.ipvaDueDate)}</Text>}
          <View style={styles.documentRow}>
            <Text style={styles.statusDetail}>Licenciamento</Text>
            <StatusBadge
              label={documentUrgencyLabel(licensingState.urgency)}
              kind={documentUrgencyKind(licensingState.urgency)}
            />
          </View>
          {vehicle.licensingDueDate && (
            <Text style={styles.statusDetail}>Vencimento: {formatDateBR(vehicle.licensingDueDate)}</Text>
          )}
          <Button label="Atualizar documentos" onPress={() => router.push(`/vehicle/${id}/documents`)} />
        </Card>

        {checklists.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Histórico de checklist</Text>
            {checklists.map((item) => (
              <Card key={item.id} style={styles.historyCard}>
                <Text style={styles.historyDate}>{formatDateBR(item.date)}</Text>
                <View style={styles.checklistRow}>
                  <ChecklistItemPreview label="Pneus" status={item.tireStatus} photoUri={item.tirePhotoUri} />
                  <ChecklistItemPreview label="Água" status={item.waterStatus} photoUri={item.waterPhotoUri} />
                  <ChecklistItemPreview label="Óleo" status={item.oilStatus} photoUri={item.oilPhotoUri} />
                </View>
                {item.notes ? <Text style={styles.historyNotes}>{item.notes}</Text> : null}
              </Card>
            ))}
          </View>
        )}

        {oilChanges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Histórico de trocas de óleo</Text>
            {oilChanges.map((item) => (
              <Card key={item.id} style={styles.historyCard}>
                <Text style={styles.historyDate}>{formatDateBR(item.date)}</Text>
                <Text style={styles.statusDetail}>{item.odometer.toLocaleString('pt-BR')} km</Text>
                {item.notes ? <Text style={styles.historyNotes}>{item.notes}</Text> : null}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

function ChecklistItemPreview({
  label,
  status,
  photoUri,
}: {
  label: string;
  status: Checklist['tireStatus'];
  photoUri: string | null;
}) {
  return (
    <View style={styles.itemPreview}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.itemThumbnail} />
      ) : (
        <View style={[styles.itemThumbnail, styles.itemThumbnailEmpty]}>
          <Ionicons name="image-outline" size={20} color={colors.textMuted} />
        </View>
      )}
      <Text style={styles.itemLabel}>{label}</Text>
      <StatusBadge label={itemStatusLabel(status)} kind={itemStatusKind(status)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  vehicleMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusCard: {
    gap: 10,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statusDetail: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
  documentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: {
    marginTop: 8,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  historyCard: {
    gap: 8,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  historyNotes: {
    fontSize: 13,
    color: colors.textMuted,
  },
  checklistRow: {
    flexDirection: 'row',
    gap: 12,
  },
  itemPreview: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  itemThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.neutralBg,
  },
  itemThumbnailEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
