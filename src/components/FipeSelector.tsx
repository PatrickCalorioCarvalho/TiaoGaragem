import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../theme/colors';
import { listBrands, listModels, listYears, type FipeOption } from '../api/fipe';
import type { VehicleType } from '../types';

export interface FipeSelection {
  brandCode: string;
  brandName: string;
  modelCode: string;
  modelName: string;
  yearCode: string;
  yearLabel: string;
}

interface FipeSelectorProps {
  vehicleType: VehicleType;
  currentLabel: string | null;
  onChange: (value: FipeSelection) => void;
  onClear: () => void;
}

export function FipeSelector({ vehicleType, currentLabel, onChange, onClear }: FipeSelectorProps) {
  const [editing, setEditing] = useState(!currentLabel);
  const [brands, setBrands] = useState<FipeOption[]>([]);
  const [models, setModels] = useState<FipeOption[]>([]);
  const [years, setYears] = useState<FipeOption[]>([]);
  const [brandCode, setBrandCode] = useState('');
  const [modelCode, setModelCode] = useState('');
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!editing) return;
    setBrandCode('');
    setModelCode('');
    setModels([]);
    setYears([]);
    setError(false);
    setLoadingBrands(true);
    listBrands(vehicleType)
      .then(setBrands)
      .catch(() => setError(true))
      .finally(() => setLoadingBrands(false));
  }, [vehicleType, editing]);

  function handleBrandChange(code: string) {
    setBrandCode(code);
    setModelCode('');
    setYears([]);
    setModels([]);
    if (!code) return;
    setLoadingModels(true);
    setError(false);
    listModels(vehicleType, code)
      .then(setModels)
      .catch(() => setError(true))
      .finally(() => setLoadingModels(false));
  }

  function handleModelChange(code: string) {
    setModelCode(code);
    setYears([]);
    if (!code) return;
    setLoadingYears(true);
    setError(false);
    listYears(vehicleType, brandCode, code)
      .then(setYears)
      .catch(() => setError(true))
      .finally(() => setLoadingYears(false));
  }

  function handleYearChange(code: string) {
    if (!code) return;
    const brand = brands.find((b) => b.codigo === brandCode);
    const model = models.find((m) => m.codigo === modelCode);
    const year = years.find((y) => y.codigo === code);
    if (!brand || !model || !year) return;
    onChange({
      brandCode: brand.codigo,
      brandName: brand.nome,
      modelCode: model.codigo,
      modelName: model.nome,
      yearCode: year.codigo,
      yearLabel: year.nome,
    });
    setEditing(false);
  }

  if (!editing) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Marca e modelo (FIPE)</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{currentLabel}</Text>
          <Pressable onPress={() => setEditing(true)}>
            <Text style={styles.link}>Alterar</Text>
          </Pressable>
          <Pressable onPress={onClear}>
            <Text style={[styles.link, { color: colors.critico }]}>Remover</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Marca e modelo (FIPE)</Text>
      <Text style={styles.hint}>Opcional — permite acompanhar o valor de mercado do veículo.</Text>

      <View style={styles.pickerWrapper}>
        <Picker enabled={!loadingBrands} selectedValue={brandCode} onValueChange={handleBrandChange}>
          <Picker.Item label={loadingBrands ? 'Carregando marcas...' : 'Selecione a marca'} value="" />
          {brands.map((brand) => (
            <Picker.Item key={brand.codigo} label={brand.nome} value={brand.codigo} />
          ))}
        </Picker>
      </View>

      {brandCode ? (
        <View style={[styles.pickerWrapper, styles.spaced]}>
          <Picker
            enabled={!loadingModels && models.length > 0}
            selectedValue={modelCode}
            onValueChange={handleModelChange}
          >
            <Picker.Item label={loadingModels ? 'Carregando modelos...' : 'Selecione o modelo'} value="" />
            {models.map((model) => (
              <Picker.Item key={model.codigo} label={model.nome} value={model.codigo} />
            ))}
          </Picker>
        </View>
      ) : null}

      {modelCode ? (
        <View style={[styles.pickerWrapper, styles.spaced]}>
          <Picker enabled={!loadingYears && years.length > 0} selectedValue="" onValueChange={handleYearChange}>
            <Picker.Item label={loadingYears ? 'Carregando anos...' : 'Selecione o ano'} value="" />
            {years.map((year) => (
              <Picker.Item key={year.codigo} label={year.nome} value={year.codigo} />
            ))}
          </Picker>
        </View>
      ) : null}

      {loadingYears || loadingModels ? <ActivityIndicator style={styles.spaced} color={colors.primary} /> : null}
      {error ? (
        <Text style={styles.error}>Não foi possível consultar a FIPE agora. Tente novamente mais tarde.</Text>
      ) : null}
      {currentLabel ? (
        <Pressable onPress={() => setEditing(false)} style={styles.spaced}>
          <Text style={styles.link}>Cancelar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  pickerWrapper: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  spaced: {
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  link: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  error: {
    fontSize: 12,
    color: colors.critico,
    marginTop: 6,
  },
});
