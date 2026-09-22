import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, Stack, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../src/components/Card';
import { StatusBadge } from '../src/components/StatusBadge';
import { colors } from '../src/theme/colors';
import { isGoogleConfigured } from '../src/config/google';
import { listVehicles } from '../src/db/vehicles';
import { getLastOilChange } from '../src/db/oilChanges';
import { getLastChecklist } from '../src/db/checklists';
import { getMetadata, ONBOARDING_DONE_KEY, setMetadata, VEHICLE_LIST_VIEW_MODE_KEY } from '../src/db/metadata';
import { getOilChangeState, getChecklistState, getDocumentState, worstDocumentState } from '../src/utils/status';
import {
  checklistUrgencyKind,
  checklistUrgencyLabel,
  documentUrgencyKind,
  documentUrgencyLabel,
  maintenanceUrgencyKind,
  maintenanceUrgencyLabel,
  vehicleTypeIcon,
} from '../src/utils/labels';
import type { Vehicle } from '../src/types';

type ViewMode = 'list' | 'grid';

interface VehicleSummary {
  vehicle: Vehicle;
  oilLabel: string;
  oilKind: ReturnType<typeof maintenanceUrgencyKind>;
  checklistLabel: string;
  checklistKind: ReturnType<typeof checklistUrgencyKind>;
  documentsLabel: string;
  documentsKind: ReturnType<typeof documentUrgencyKind>;
}

export default function VehicleListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [summaries, setSummaries] = useState<VehicleSummary[] | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    if (!isGoogleConfigured()) return;
    getMetadata(ONBOARDING_DONE_KEY).then((done) => {
      if (!done) router.replace('/onboarding');
    });
  }, []);

  useEffect(() => {
    getMetadata(VEHICLE_LIST_VIEW_MODE_KEY).then((value) => {
      if (value === 'grid' || value === 'list') setViewMode(value);
    });
  }, []);

  function toggleViewMode() {
    const next: ViewMode = viewMode === 'list' ? 'grid' : 'list';
    setViewMode(next);
    setMetadata(VEHICLE_LIST_VIEW_MODE_KEY, next);
  }

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const vehicles = await listVehicles();
        const results = await Promise.all(
          vehicles.map(async (vehicle) => {
            const [lastOilChange, lastChecklist] = await Promise.all([
              getLastOilChange(vehicle.id),
              getLastChecklist(vehicle.id),
            ]);
            const oilState = getOilChangeState(vehicle, lastOilChange);
            const checklistState = getChecklistState(lastChecklist?.date ?? null);
            const documentsState = worstDocumentState(
              getDocumentState(vehicle.ipvaDueDate),
              getDocumentState(vehicle.licensingDueDate),
            );
            return {
              vehicle,
              oilLabel: maintenanceUrgencyLabel(oilState.urgency),
              oilKind: maintenanceUrgencyKind(oilState.urgency),
              checklistLabel: checklistUrgencyLabel(checklistState.urgency),
              checklistKind: checklistUrgencyKind(checklistState.urgency),
              documentsLabel: documentUrgencyLabel(documentsState.urgency),
              documentsKind: documentUrgencyKind(documentsState.urgency),
            };
          }),
        );
        if (!cancelled) setSummaries(results);
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  if (summaries === null) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable hitSlop={8} onPress={toggleViewMode}>
                <Ionicons name={viewMode === 'list' ? 'grid-outline' : 'list-outline'} size={22} color={colors.primary} />
              </Pressable>
              <Link href="/settings" asChild>
                <Pressable hitSlop={8}>
                  <Ionicons name="settings-outline" size={22} color={colors.primary} />
                </Pressable>
              </Link>
            </View>
          ),
        }}
      />
      {summaries.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="car-multiple" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Nenhum veículo cadastrado</Text>
          <Text style={styles.emptySubtitle}>Adicione seu carro ou moto para começar a acompanhar as manutenções.</Text>
        </View>
      ) : viewMode === 'list' ? (
        <FlatList
          key="list"
          data={summaries}
          keyExtractor={(item) => item.vehicle.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 88 }]}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/vehicle/${item.vehicle.id}`)}>
              <Card style={styles.card}>
                <View style={styles.cardRow}>
                  {item.vehicle.photoUri ? (
                    <Image source={{ uri: item.vehicle.photoUri }} style={styles.vehiclePhoto} />
                  ) : (
                    <View style={styles.vehiclePhotoPlaceholder}>
                      <MaterialCommunityIcons
                        name={vehicleTypeIcon(item.vehicle.type)}
                        size={36}
                        color={colors.primary}
                      />
                    </View>
                  )}
                  <View style={styles.cardDetails}>
                    <Text style={styles.vehicleName}>{item.vehicle.name}</Text>
                    {item.vehicle.plate ? <Text style={styles.vehiclePlate}>{item.vehicle.plate}</Text> : null}
                    <View style={styles.detailRow}>
                      <Text style={styles.badgeCaption}>Óleo</Text>
                      <StatusBadge label={item.oilLabel} kind={item.oilKind} />
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.badgeCaption}>Checklist</Text>
                      <StatusBadge label={item.checklistLabel} kind={item.checklistKind} />
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.badgeCaption}>Documentos</Text>
                      <StatusBadge label={item.documentsLabel} kind={item.documentsKind} />
                    </View>
                  </View>
                </View>
              </Card>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          key="grid"
          data={summaries}
          numColumns={2}
          keyExtractor={(item) => item.vehicle.id}
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 88 }]}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <Pressable style={styles.gridCard} onPress={() => router.push(`/vehicle/${item.vehicle.id}`)}>
              {item.vehicle.photoUri ? (
                <Image source={{ uri: item.vehicle.photoUri }} style={styles.gridPhoto} />
              ) : (
                <View style={[styles.gridPhoto, styles.gridPhotoPlaceholder]}>
                  <MaterialCommunityIcons name={vehicleTypeIcon(item.vehicle.type)} size={40} color={colors.primary} />
                </View>
              )}
              <Text style={styles.gridName} numberOfLines={1}>
                {item.vehicle.name}
              </Text>
              {item.vehicle.plate ? (
                <Text style={styles.gridPlate} numberOfLines={1}>
                  {item.vehicle.plate}
                </Text>
              ) : null}
            </Pressable>
          )}
        />
      )}

      <Link href="/vehicle/new" asChild>
        <Pressable style={{ ...styles.fab, bottom: insets.bottom + 20 }}>
          <MaterialCommunityIcons name="plus" size={28} color={colors.primaryText} />
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  cardDetails: {
    flex: 1,
    padding: 14,
    gap: 6,
    justifyContent: 'center',
  },
  vehiclePhoto: {
    width: 112,
    height: 112,
    backgroundColor: colors.neutralBg,
  },
  vehiclePhotoPlaceholder: {
    width: 112,
    height: 112,
    backgroundColor: colors.neutralBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  vehiclePlate: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeCaption: {
    fontSize: 12,
    color: colors.textMuted,
    width: 72,
  },
  grid: {
    padding: 16,
    gap: 12,
  },
  gridRow: {
    gap: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 4,
  },
  gridPhoto: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: colors.neutralBg,
  },
  gridPhotoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  gridPlate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
