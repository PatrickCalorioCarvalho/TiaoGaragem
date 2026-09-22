import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { FormField } from '../../src/components/FormField';
import { PhotoField } from '../../src/components/PhotoField';
import { UfPicker } from '../../src/components/UfPicker';
import { VehicleTypePicker } from '../../src/components/VehicleTypePicker';
import { colors } from '../../src/theme/colors';
import { vehicleTypeLabel } from '../../src/utils/labels';
import { createVehicle } from '../../src/db/vehicles';
import { listBrands, listModels, listYears, type FipeOption } from '../../src/api/fipe';
import type { VehicleType } from '../../src/types';

type Step = 'type' | 'brand' | 'model' | 'year' | 'name' | 'identification' | 'maintenance' | 'photo';

const GROUPS: { key: string; label: string; steps: Step[] }[] = [
  { key: 'type', label: 'Tipo', steps: ['type'] },
  { key: 'fipe', label: 'FIPE', steps: ['brand', 'model', 'year'] },
  { key: 'name', label: 'Nome', steps: ['name'] },
  { key: 'identification', label: 'Identificação', steps: ['identification'] },
  { key: 'maintenance', label: 'Manutenção', steps: ['maintenance'] },
  { key: 'photo', label: 'Foto', steps: ['photo'] },
];

export default function NewVehicleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [history, setHistory] = useState<Step[]>(['type']);
  const step = history[history.length - 1];

  const [type, setType] = useState<VehicleType>('car');

  const [brands, setBrands] = useState<FipeOption[]>([]);
  const [models, setModels] = useState<FipeOption[]>([]);
  const [years, setYears] = useState<FipeOption[]>([]);
  const [loadingFipe, setLoadingFipe] = useState(false);
  const [fipeBrand, setFipeBrand] = useState<FipeOption | null>(null);
  const [fipeModel, setFipeModel] = useState<FipeOption | null>(null);
  const [fipeYear, setFipeYear] = useState<FipeOption | null>(null);

  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [renavam, setRenavam] = useState('');
  const [uf, setUf] = useState<string | null>(null);
  const [odometer, setOdometer] = useState('');
  const [oilIntervalKm, setOilIntervalKm] = useState('3000');
  const [oilIntervalMonths, setOilIntervalMonths] = useState('6');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (step !== 'brand') return;
    setLoadingFipe(true);
    listBrands(type)
      .then(setBrands)
      .catch(() => Alert.alert('FIPE indisponível', 'Não foi possível carregar as marcas agora. Você pode pular esta parte.'))
      .finally(() => setLoadingFipe(false));
  }, [step, type]);

  function goTo(next: Step) {
    setHistory((h) => [...h, next]);
  }

  function back() {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  }

  function skipFipe() {
    setFipeBrand(null);
    setFipeModel(null);
    setFipeYear(null);
    goTo('name');
  }

  function selectBrand(codigo: string) {
    const brand = brands.find((b) => b.codigo === codigo);
    if (!brand) return;
    setFipeBrand(brand);
    setFipeModel(null);
    setFipeYear(null);
    setModels([]);
    setLoadingFipe(true);
    listModels(type, brand.codigo)
      .then((result) => {
        setModels(result);
        goTo('model');
      })
      .catch(() => Alert.alert('FIPE indisponível', 'Não foi possível carregar os modelos agora.'))
      .finally(() => setLoadingFipe(false));
  }

  function selectModel(codigo: string) {
    const model = models.find((m) => m.codigo === codigo);
    if (!model || !fipeBrand) return;
    setFipeModel(model);
    setFipeYear(null);
    setYears([]);
    setLoadingFipe(true);
    listYears(type, fipeBrand.codigo, model.codigo)
      .then((result) => {
        setYears(result);
        goTo('year');
      })
      .catch(() => Alert.alert('FIPE indisponível', 'Não foi possível carregar os anos agora.'))
      .finally(() => setLoadingFipe(false));
  }

  function selectYear(codigo: string) {
    const year = years.find((y) => y.codigo === codigo);
    if (!year) return;
    setFipeYear(year);
    goTo('name');
  }

  const fipeLabel = useMemo(() => {
    if (!fipeBrand || !fipeModel || !fipeYear) return null;
    return `${fipeBrand.nome} ${fipeModel.nome} (${fipeYear.nome})`;
  }, [fipeBrand, fipeModel, fipeYear]);

  const imagePrompt = useMemo(() => {
    const subject = fipeBrand && fipeModel
      ? `um ${vehicleTypeLabel(type).toLowerCase()} ${fipeBrand.nome} ${fipeModel.nome}`
      : `um ${vehicleTypeLabel(type).toLowerCase()}${name ? ` chamado "${name}"` : ''}`;
    return `Ilustração digital minimalista, estilo ícone flat design, de ${subject}, visto de perfil (lateral), fundo liso neutro, cores vibrantes, sem texto, sem marca d'água, formato quadrado 1:1, adequada para foto de perfil.`;
  }, [fipeBrand, fipeModel, type, name]);

  async function copyPrompt() {
    await Clipboard.setStringAsync(imagePrompt);
    Alert.alert('Prompt copiado', 'Cole no Gemini (Nano Banana) para gerar a imagem. Depois, salve a foto e escolha ela na Galeria abaixo.');
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Nome obrigatório', 'Dê um apelido para o veículo.');
      goTo('name');
      return;
    }
    const parsedOdometer = Number(odometer.replace(/\D/g, ''));
    if (!Number.isFinite(parsedOdometer) || odometer.trim() === '') {
      Alert.alert('Quilometragem obrigatória', 'Informe a quilometragem atual do veículo.');
      goTo('maintenance');
      return;
    }
    const parsedKm = Number(oilIntervalKm.replace(/\D/g, ''));
    const parsedMonths = Number(oilIntervalMonths.replace(/\D/g, ''));

    setSaving(true);
    try {
      const vehicle = await createVehicle({
        name: name.trim(),
        type,
        plate: plate.trim() || undefined,
        renavam: renavam.trim() || undefined,
        uf: uf ?? undefined,
        odometer: parsedOdometer,
        oilIntervalKm: parsedKm > 0 ? parsedKm : 3000,
        oilIntervalMonths: parsedMonths > 0 ? parsedMonths : 6,
        photoUri,
        fipeBrandCode: fipeBrand?.codigo ?? null,
        fipeModelCode: fipeModel?.codigo ?? null,
        fipeYearCode: fipeYear?.codigo ?? null,
        fipeLabel,
      });
      router.replace(`/vehicle/${vehicle.id}`);
    } finally {
      setSaving(false);
    }
  }

  const groupIndex = GROUPS.findIndex((g) => g.steps.includes(step));

  return (
    <View style={styles.screen}>
      <View style={styles.dots}>
        {GROUPS.map((group, index) => (
          <View key={group.key} style={[styles.dot, index <= groupIndex && styles.dotActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'type' && (
          <>
            <Text style={styles.title}>Que tipo de veículo é?</Text>
            <VehicleTypePicker value={type} onChange={setType} />
          </>
        )}

        {step === 'brand' && (
          <>
            <Text style={styles.title}>Qual a marca?</Text>
            <Text style={styles.subtitle}>Isso permite acompanhar o valor FIPE do veículo. É opcional.</Text>
            {loadingFipe ? (
              <ActivityIndicator color={colors.primary} style={styles.spacedTop} />
            ) : (
              <View style={styles.pickerWrapper}>
                <Picker selectedValue="" onValueChange={selectBrand}>
                  <Picker.Item label="Selecione a marca" value="" />
                  {brands.map((brand) => (
                    <Picker.Item key={brand.codigo} label={brand.nome} value={brand.codigo} />
                  ))}
                </Picker>
              </View>
            )}
          </>
        )}

        {step === 'model' && (
          <>
            <Text style={styles.title}>Qual o modelo?</Text>
            <Text style={styles.subtitle}>{fipeBrand?.nome}</Text>
            {loadingFipe ? (
              <ActivityIndicator color={colors.primary} style={styles.spacedTop} />
            ) : (
              <View style={styles.pickerWrapper}>
                <Picker selectedValue="" onValueChange={selectModel}>
                  <Picker.Item label="Selecione o modelo" value="" />
                  {models.map((model) => (
                    <Picker.Item key={model.codigo} label={model.nome} value={model.codigo} />
                  ))}
                </Picker>
              </View>
            )}
          </>
        )}

        {step === 'year' && (
          <>
            <Text style={styles.title}>Qual o ano?</Text>
            <Text style={styles.subtitle}>
              {fipeBrand?.nome} {fipeModel?.nome}
            </Text>
            {loadingFipe ? (
              <ActivityIndicator color={colors.primary} style={styles.spacedTop} />
            ) : (
              <View style={styles.pickerWrapper}>
                <Picker selectedValue="" onValueChange={selectYear}>
                  <Picker.Item label="Selecione o ano" value="" />
                  {years.map((year) => (
                    <Picker.Item key={year.codigo} label={year.nome} value={year.codigo} />
                  ))}
                </Picker>
              </View>
            )}
          </>
        )}

        {step === 'name' && (
          <>
            <Text style={styles.title}>Como quer chamar esse veículo?</Text>
            {fipeLabel && <Text style={styles.subtitle}>{fipeLabel}</Text>}
            <FormField label="Apelido" value={name} onChangeText={setName} placeholder="Ex: Fiesta, CG 160" autoFocus />
          </>
        )}

        {step === 'identification' && (
          <>
            <Text style={styles.title}>Identificação (opcional)</Text>
            <FormField
              label="Placa"
              value={plate}
              onChangeText={setPlate}
              placeholder="Ex: ABC1D23"
              autoCapitalize="characters"
            />
            <FormField
              label="Renavam"
              value={renavam}
              onChangeText={setRenavam}
              placeholder="Opcional"
              keyboardType="number-pad"
            />
            <UfPicker label="Estado (UF)" value={uf} onChange={setUf} />
          </>
        )}

        {step === 'maintenance' && (
          <>
            <Text style={styles.title}>Manutenção</Text>
            <FormField
              label="Quilometragem atual"
              value={odometer}
              onChangeText={setOdometer}
              placeholder="Ex: 45000"
              keyboardType="number-pad"
              autoFocus
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
          </>
        )}

        {step === 'photo' && (
          <>
            <Text style={styles.title}>Foto do veículo</Text>
            <Text style={styles.subtitle}>
              Sem uma foto à mão? Copie o prompt abaixo e cole no Gemini (Nano Banana) para gerar uma ilustração —
              depois salve a imagem e escolha ela na galeria.
            </Text>
            <View style={styles.promptBox}>
              <Text style={styles.promptText}>{imagePrompt}</Text>
            </View>
            <Button label="Copiar prompt de imagem" variant="secondary" onPress={copyPrompt} />
            <View style={styles.spacedTop}>
              <PhotoField label="Foto" uri={photoUri} onChange={setPhotoUri} />
            </View>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {history.length > 1 && <Button label="Voltar" variant="secondary" onPress={back} />}
        {step === 'type' && <Button label="Continuar" onPress={() => goTo('brand')} />}
        {step === 'brand' && <Button label="Pular marca e modelo" variant="secondary" onPress={skipFipe} />}
        {step === 'name' && (
          <Button label="Continuar" onPress={() => name.trim() && goTo('identification')} disabled={!name.trim()} />
        )}
        {step === 'identification' && <Button label="Continuar" onPress={() => goTo('maintenance')} />}
        {step === 'maintenance' && (
          <Button label="Continuar" onPress={() => odometer.trim() && goTo('photo')} disabled={!odometer.trim()} />
        )}
        {step === 'photo' && <Button label="Salvar veículo" onPress={handleSave} loading={saving} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
    lineHeight: 20,
  },
  spacedTop: {
    marginTop: 16,
  },
  pickerWrapper: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  promptBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  promptText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
