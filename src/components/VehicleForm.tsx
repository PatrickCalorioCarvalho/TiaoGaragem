import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './Button';
import { FormField } from './FormField';
import { PhotoField } from './PhotoField';
import { FipeSelector } from './FipeSelector';
import { UfPicker } from './UfPicker';
import { VehicleTypePicker } from './VehicleTypePicker';
import type { NewVehicleInput } from '../db/vehicles';
import type { VehicleType } from '../types';

interface VehicleFormProps {
  initial?: Partial<NewVehicleInput>;
  submitLabel: string;
  onSubmit: (input: NewVehicleInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function VehicleForm({ initial, submitLabel, onSubmit, onDelete }: VehicleFormProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<VehicleType>(initial?.type ?? 'car');
  const [plate, setPlate] = useState(initial?.plate ?? '');
  const [renavam, setRenavam] = useState(initial?.renavam ?? '');
  const [uf, setUf] = useState<string | null>(initial?.uf ?? null);
  const [odometer, setOdometer] = useState(String(initial?.odometer ?? ''));
  const [oilIntervalKm, setOilIntervalKm] = useState(String(initial?.oilIntervalKm ?? 3000));
  const [oilIntervalMonths, setOilIntervalMonths] = useState(String(initial?.oilIntervalMonths ?? 6));
  const [photoUri, setPhotoUri] = useState<string | null>(initial?.photoUri ?? null);
  const [fipeBrandCode, setFipeBrandCode] = useState<string | null>(initial?.fipeBrandCode ?? null);
  const [fipeModelCode, setFipeModelCode] = useState<string | null>(initial?.fipeModelCode ?? null);
  const [fipeYearCode, setFipeYearCode] = useState<string | null>(initial?.fipeYearCode ?? null);
  const [fipeLabel, setFipeLabel] = useState<string | null>(initial?.fipeLabel ?? null);
  const [saving, setSaving] = useState(false);

  function handleTypeChange(nextType: VehicleType) {
    setType(nextType);
    if (nextType !== type) {
      setFipeBrandCode(null);
      setFipeModelCode(null);
      setFipeYearCode(null);
      setFipeLabel(null);
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert('Nome obrigatório', 'Dê um apelido para o veículo, ex: Fiesta, CG 160...');
      return;
    }
    const parsedOdometer = Number(odometer.replace(/\D/g, ''));
    const parsedKm = Number(oilIntervalKm.replace(/\D/g, ''));
    const parsedMonths = Number(oilIntervalMonths.replace(/\D/g, ''));

    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        plate: plate.trim() || undefined,
        renavam: renavam.trim() || undefined,
        uf: uf ?? undefined,
        odometer: Number.isFinite(parsedOdometer) ? parsedOdometer : 0,
        oilIntervalKm: parsedKm > 0 ? parsedKm : 3000,
        oilIntervalMonths: parsedMonths > 0 ? parsedMonths : 6,
        photoUri,
        fipeBrandCode,
        fipeModelCode,
        fipeYearCode,
        fipeLabel,
      });
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!onDelete) return;
    Alert.alert('Excluir veículo', 'Isso vai apagar o veículo e todo o histórico de manutenção. Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: onDelete },
    ]);
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled"
    >
      <PhotoField label="Foto do veículo" uri={photoUri} onChange={setPhotoUri} />
      <FormField label="Apelido do veículo" value={name} onChangeText={setName} placeholder="Ex: Fiesta, CG 160" />
      <VehicleTypePicker value={type} onChange={handleTypeChange} />
      <FormField
        label="Placa"
        value={plate}
        onChangeText={setPlate}
        placeholder="Ex: ABC1D23"
        autoCapitalize="characters"
      />
      <FormField label="Renavam" value={renavam} onChangeText={setRenavam} placeholder="Opcional" keyboardType="number-pad" />
      <UfPicker label="Estado (UF)" value={uf} onChange={setUf} />
      <FormField
        label="Quilometragem atual"
        value={odometer}
        onChangeText={setOdometer}
        placeholder="Ex: 45000"
        keyboardType="number-pad"
      />
      <FormField
        label="Intervalo de troca de óleo (km)"
        value={oilIntervalKm}
        onChangeText={setOilIntervalKm}
        keyboardType="number-pad"
      />
      <FormField
        label="Intervalo de troca de óleo (meses)"
        value={oilIntervalMonths}
        onChangeText={setOilIntervalMonths}
        keyboardType="number-pad"
      />
      <FipeSelector
        vehicleType={type}
        currentLabel={fipeLabel}
        onChange={(selection) => {
          setFipeBrandCode(selection.brandCode);
          setFipeModelCode(selection.modelCode);
          setFipeYearCode(selection.yearCode);
          setFipeLabel(`${selection.brandName} ${selection.modelName} (${selection.yearLabel})`);
        }}
        onClear={() => {
          setFipeBrandCode(null);
          setFipeModelCode(null);
          setFipeYearCode(null);
          setFipeLabel(null);
        }}
      />

      <View style={styles.actions}>
        <Button label={submitLabel} onPress={handleSubmit} loading={saving} />
        {onDelete && <Button label="Excluir veículo" variant="danger" onPress={handleDelete} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
});
