import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../../src/components/Button';
import { FormField } from '../../../src/components/FormField';
import { getVehicle, updateVehicleDocuments } from '../../../src/db/vehicles';
import { refreshMaintenanceWidget } from '../../../src/widgets/refreshWidget';
import { findState } from '../../../src/data/brazilStates';
import { colors } from '../../../src/theme/colors';
import { formatDateBR, parseDateBR } from '../../../src/utils/date';
import {
  ipvaMetadataKey,
  licensingMetadataKey,
  scheduleDocumentReminders,
} from '../../../src/notifications/documentReminders';
import type { Vehicle } from '../../../src/types';

export default function DocumentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [ipvaDueDate, setIpvaDueDate] = useState('');
  const [licensingDueDate, setLicensingDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getVehicle(id).then((v) => {
      setVehicle(v);
      setIpvaDueDate(v?.ipvaDueDate ? formatDateBR(v.ipvaDueDate) : '');
      setLicensingDueDate(v?.licensingDueDate ? formatDateBR(v.licensingDueDate) : '');
    });
  }, [id]);

  const state = findState(vehicle?.uf);

  async function handleSubmit() {
    const ipvaIso = ipvaDueDate.trim() ? parseDateBR(ipvaDueDate) : null;
    const licensingIso = licensingDueDate.trim() ? parseDateBR(licensingDueDate) : null;

    if (ipvaDueDate.trim() && !ipvaIso) {
      Alert.alert('Data do IPVA inválida', 'Use o formato dd/mm/aaaa.');
      return;
    }
    if (licensingDueDate.trim() && !licensingIso) {
      Alert.alert('Data do licenciamento inválida', 'Use o formato dd/mm/aaaa.');
      return;
    }

    setSaving(true);
    try {
      await updateVehicleDocuments(id, { ipvaDueDate: ipvaIso, licensingDueDate: licensingIso });
      await Promise.all([
        scheduleDocumentReminders(
          ipvaMetadataKey(id),
          'IPVA a vencer',
          `O IPVA de ${vehicle?.name ?? 'seu veículo'} está próximo do vencimento.`,
          ipvaIso,
        ),
        scheduleDocumentReminders(
          licensingMetadataKey(id),
          'Licenciamento a vencer',
          `O licenciamento de ${vehicle?.name ?? 'seu veículo'} está próximo do vencimento.`,
          licensingIso,
        ),
      ]);
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
        As datas variam por estado e mudam todo ano — confirme sempre no site oficial antes de pagar.
      </Text>

      <FormField
        label="Vencimento do IPVA"
        value={ipvaDueDate}
        onChangeText={setIpvaDueDate}
        placeholder="dd/mm/aaaa"
      />
      <FormField
        label="Vencimento do licenciamento"
        value={licensingDueDate}
        onChangeText={setLicensingDueDate}
        placeholder="dd/mm/aaaa"
      />

      {state ? (
        <Button
          label={`Abrir site do Detran-${state.uf}`}
          variant="secondary"
          onPress={() =>
            Linking.openURL(state.detranUrl).catch(() =>
              Alert.alert('Não foi possível abrir', 'Tente buscar "Detran ' + state.name + '" no navegador.'),
            )
          }
        />
      ) : (
        <Text style={styles.hint}>
          Cadastre o estado (UF) do veículo na tela de edição para ter um link direto ao Detran.
        </Text>
      )}

      <View style={styles.actions}>
        <Button label="Salvar" onPress={handleSubmit} loading={saving} />
      </View>
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
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
    lineHeight: 18,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
  },
  actions: {
    marginTop: 16,
  },
});
