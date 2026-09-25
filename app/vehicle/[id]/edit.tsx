import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VehicleForm } from '../../../src/components/VehicleForm';
import { deleteVehicle, getVehicle, NewVehicleInput, updateVehicle } from '../../../src/db/vehicles';
import { refreshMaintenanceWidget } from '../../../src/widgets/refreshWidget';
import { useTheme } from '../../../src/theme/ThemeContext';
import {
  cancelDocumentReminders,
  ipvaMetadataKey,
  licensingMetadataKey,
} from '../../../src/notifications/documentReminders';
import type { Vehicle } from '../../../src/types';

export default function EditVehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    getVehicle(id).then(setVehicle);
  }, [id]);

  async function handleSubmit(input: NewVehicleInput) {
    await updateVehicle(id, input);
    refreshMaintenanceWidget();
    router.back();
  }

  async function handleDelete() {
    await Promise.all([cancelDocumentReminders(ipvaMetadataKey(id)), cancelDocumentReminders(licensingMetadataKey(id))]);
    await deleteVehicle(id);
    refreshMaintenanceWidget();
    router.replace('/');
  }

  if (!vehicle) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <VehicleForm
      submitLabel="Salvar alterações"
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      initial={{
        name: vehicle.name,
        type: vehicle.type,
        plate: vehicle.plate ?? undefined,
        renavam: vehicle.renavam ?? undefined,
        uf: vehicle.uf ?? undefined,
        odometer: vehicle.odometer,
        oilIntervalKm: vehicle.oilIntervalKm,
        oilIntervalMonths: vehicle.oilIntervalMonths,
        photoUri: vehicle.photoUri,
        fipeBrandCode: vehicle.fipeBrandCode,
        fipeModelCode: vehicle.fipeModelCode,
        fipeYearCode: vehicle.fipeYearCode,
        fipeLabel: vehicle.fipeLabel,
      }}
    />
  );
}
