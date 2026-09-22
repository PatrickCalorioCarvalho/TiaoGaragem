import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../../src/components/Button';
import { FormField } from '../../../src/components/FormField';
import { createOilChange } from '../../../src/db/oilChanges';
import { getVehicle } from '../../../src/db/vehicles';
import { refreshMaintenanceWidget } from '../../../src/widgets/refreshWidget';
import { colors } from '../../../src/theme/colors';
import { formatDateBR, parseDateBR, todayIso } from '../../../src/utils/date';
import type { Vehicle } from '../../../src/types';

export default function OilChangeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [date, setDate] = useState(formatDateBR(todayIso()));
  const [odometer, setOdometer] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getVehicle(id).then((v) => {
      setVehicle(v);
      if (v) setOdometer(String(v.odometer));
    });
  }, [id]);

  async function handleSubmit() {
    if (!vehicle) return;
    const isoDate = parseDateBR(date);
    if (!isoDate) {
      Alert.alert('Data inválida', 'Use o formato dd/mm/aaaa.');
      return;
    }
    const parsedOdometer = Number(odometer.replace(/\D/g, ''));
    if (!Number.isFinite(parsedOdometer) || parsedOdometer <= 0) {
      Alert.alert('Quilometragem inválida', 'Informe a quilometragem no momento da troca.');
      return;
    }

    setSaving(true);
    try {
      await createOilChange(vehicle, { date: isoDate, odometer: parsedOdometer, notes: notes.trim() || undefined });
      refreshMaintenanceWidget();
      router.back();
    } finally {
      setSaving(false);
    }
  }

  if (!vehicle) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.subtitle}>
        Próxima troca prevista para daqui {vehicle.oilIntervalKm} km ou {vehicle.oilIntervalMonths} meses.
      </Text>
      <FormField label="Data da troca" value={date} onChangeText={setDate} placeholder="dd/mm/aaaa" />
      <FormField label="Quilometragem" value={odometer} onChangeText={setOdometer} keyboardType="number-pad" />
      <FormField label="Observações" value={notes} onChangeText={setNotes} placeholder="Opcional" multiline />
      <Button label="Registrar troca de óleo" onPress={handleSubmit} loading={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
  },
});
