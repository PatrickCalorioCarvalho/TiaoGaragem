import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../../src/components/Button';
import { FormField } from '../../../src/components/FormField';
import { ItemStatusPicker } from '../../../src/components/ItemStatusPicker';
import { PhotoField } from '../../../src/components/PhotoField';
import { createChecklist } from '../../../src/db/checklists';
import { getLastOilChange } from '../../../src/db/oilChanges';
import { getVehicle, updateOdometer } from '../../../src/db/vehicles';
import { refreshMaintenanceWidget } from '../../../src/widgets/refreshWidget';
import { getOilChangeState } from '../../../src/utils/status';
import { useTheme } from '../../../src/theme/ThemeContext';
import type { ThemeColors } from '../../../src/theme/colors';
import { formatDateBR, parseDateBR, todayIso } from '../../../src/utils/date';
import type { ItemStatus, Vehicle } from '../../../src/types';

export default function ChecklistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [date, setDate] = useState(formatDateBR(todayIso()));
  const [odometer, setOdometer] = useState('');
  const [tireStatus, setTireStatus] = useState<ItemStatus>('ok');
  const [tirePhoto, setTirePhoto] = useState<string | null>(null);
  const [waterStatus, setWaterStatus] = useState<ItemStatus>('ok');
  const [waterPhoto, setWaterPhoto] = useState<string | null>(null);
  const [oilStatus, setOilStatus] = useState<ItemStatus>('ok');
  const [oilPhoto, setOilPhoto] = useState<string | null>(null);
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
      Alert.alert('Quilometragem inválida', 'Informe a quilometragem atual do veículo.');
      return;
    }

    setSaving(true);
    try {
      await createChecklist(vehicle.id, {
        date: isoDate,
        tireStatus,
        tirePhotoUri: tirePhoto,
        waterStatus,
        waterPhotoUri: waterPhoto,
        oilStatus,
        oilPhotoUri: oilPhoto,
        odometer: parsedOdometer,
        notes: notes.trim() || undefined,
      });

      let updatedOdometer = vehicle.odometer;
      if (parsedOdometer > vehicle.odometer) {
        await updateOdometer(vehicle.id, parsedOdometer);
        updatedOdometer = parsedOdometer;
      }

      refreshMaintenanceWidget();

      const lastOilChange = await getLastOilChange(vehicle.id);
      const oilState = getOilChangeState({ ...vehicle, odometer: updatedOdometer }, lastOilChange);

      if (oilState.urgency === 'vencida' || oilState.urgency === 'atencao') {
        Alert.alert(
          'Troca de óleo se aproximando',
          oilState.urgency === 'vencida'
            ? 'Com essa quilometragem, a troca de óleo já está vencida.'
            : 'Com essa quilometragem, a troca de óleo está próxima.',
          [{ text: 'Ok', onPress: () => router.back() }],
        );
      } else {
        router.back();
      }
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
      <FormField label="Data do checklist" value={date} onChangeText={setDate} placeholder="dd/mm/aaaa" />
      <FormField label="Quilometragem atual" value={odometer} onChangeText={setOdometer} keyboardType="number-pad" />
      <Text style={styles.hint}>Usamos essa leitura para manter a previsão da próxima troca de óleo em dia.</Text>

      <ItemStatusPicker label="Pneus" value={tireStatus} onChange={setTireStatus} />
      <PhotoField label="Foto dos pneus" uri={tirePhoto} onChange={setTirePhoto} />

      <ItemStatusPicker label="Água / arrefecimento" value={waterStatus} onChange={setWaterStatus} />
      <PhotoField label="Foto da água" uri={waterPhoto} onChange={setWaterPhoto} />

      <ItemStatusPicker label="Óleo" value={oilStatus} onChange={setOilStatus} />
      <PhotoField label="Foto do óleo" uri={oilPhoto} onChange={setOilPhoto} />

      <FormField label="Observações" value={notes} onChangeText={setNotes} placeholder="Opcional" multiline />

      <Button label="Salvar checklist" onPress={handleSubmit} loading={saving} />
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      padding: 20,
    },
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hint: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: -8,
      marginBottom: 16,
    },
  });
}
