import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../../src/components/Button';
import { FormField } from '../../../src/components/FormField';
import { ItemStatusPicker } from '../../../src/components/ItemStatusPicker';
import { PhotoField } from '../../../src/components/PhotoField';
import { createChecklist } from '../../../src/db/checklists';
import { refreshMaintenanceWidget } from '../../../src/widgets/refreshWidget';
import { formatDateBR, parseDateBR, todayIso } from '../../../src/utils/date';
import type { ItemStatus } from '../../../src/types';

export default function ChecklistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [date, setDate] = useState(formatDateBR(todayIso()));
  const [tireStatus, setTireStatus] = useState<ItemStatus>('ok');
  const [tirePhoto, setTirePhoto] = useState<string | null>(null);
  const [waterStatus, setWaterStatus] = useState<ItemStatus>('ok');
  const [waterPhoto, setWaterPhoto] = useState<string | null>(null);
  const [oilStatus, setOilStatus] = useState<ItemStatus>('ok');
  const [oilPhoto, setOilPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const isoDate = parseDateBR(date);
    if (!isoDate) {
      Alert.alert('Data inválida', 'Use o formato dd/mm/aaaa.');
      return;
    }

    setSaving(true);
    try {
      await createChecklist(id, {
        date: isoDate,
        tireStatus,
        tirePhotoUri: tirePhoto,
        waterStatus,
        waterPhotoUri: waterPhoto,
        oilStatus,
        oilPhotoUri: oilPhoto,
        notes: notes.trim() || undefined,
      });
      refreshMaintenanceWidget();
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled"
    >
      <FormField label="Data do checklist" value={date} onChangeText={setDate} placeholder="dd/mm/aaaa" />

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

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
});
