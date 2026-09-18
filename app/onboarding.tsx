import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { useGoogleSignIn } from '../src/auth/useGoogleSignIn';
import { getBackupInfo, performRestore } from '../src/backup/backup';
import { ONBOARDING_DONE_KEY, setMetadata } from '../src/db/metadata';
import { colors } from '../src/theme/colors';

type Step = 'welcome' | 'checking' | 'backup-found' | 'no-backup' | 'restoring';

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [email, setEmail] = useState<string | null>(null);
  const [backupInfo, setBackupInfo] = useState<{ exportedAt: string; vehicleCount: number } | null>(null);

  const { request, promptAsync } = useGoogleSignIn(async (signedInEmail) => {
    setEmail(signedInEmail);
    setStep('checking');
    try {
      const info = await getBackupInfo();
      if (info) {
        setBackupInfo(info);
        setStep('backup-found');
      } else {
        setStep('no-backup');
      }
    } catch {
      setStep('no-backup');
    }
  });

  async function finish() {
    await setMetadata(ONBOARDING_DONE_KEY, '1');
    router.replace('/');
  }

  async function handleRestoreNow() {
    setStep('restoring');
    try {
      const { photosRestored } = await performRestore();
      Alert.alert('Backup restaurado', `${photosRestored} foto(s) baixada(s) do Google Drive.`, [
        { text: 'OK', onPress: finish },
      ]);
    } catch (error: any) {
      Alert.alert('Erro ao restaurar', error?.message ?? 'Tente novamente mais tarde.', [{ text: 'OK', onPress: finish }]);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <MaterialCommunityIcons name="car-wrench" size={56} color={colors.primary} />
        <Text style={styles.title}>Bem-vindo ao TiaoGaragem</Text>
        <Text style={styles.subtitle}>
          Controle a troca de óleo, o checklist semanal e o vencimento de IPVA e licenciamento dos seus veículos.
        </Text>
      </View>

      <Card style={styles.card}>
        {step === 'welcome' && (
          <>
            <Text style={styles.cardTitle}>Backup automático no Google Drive</Text>
            <Text style={styles.cardBody}>
              Conecte sua conta Google para manter seus dados salvos com segurança e poder restaurá-los se trocar de
              celular.
            </Text>
            <Button label="Conectar ao Google" onPress={() => promptAsync()} disabled={!request} />
          </>
        )}

        {step === 'checking' && (
          <>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.cardBody}>Verificando se já existe um backup salvo...</Text>
          </>
        )}

        {step === 'backup-found' && backupInfo && (
          <>
            <Text style={styles.cardTitle}>Encontramos um backup seu</Text>
            <Text style={styles.cardBody}>
              De {new Date(backupInfo.exportedAt).toLocaleString('pt-BR')}, com {backupInfo.vehicleCount} veículo(s).
              Quer restaurar agora?
            </Text>
            <Button label="Restaurar backup" onPress={handleRestoreNow} />
            <Button label="Agora não" variant="secondary" onPress={finish} />
          </>
        )}

        {step === 'no-backup' && (
          <>
            <Text style={styles.cardTitle}>Conectado como {email}</Text>
            <Text style={styles.cardBody}>Nenhum backup anterior encontrado. Você já pode começar a cadastrar seus veículos.</Text>
            <Button label="Continuar" onPress={finish} />
          </>
        )}

        {step === 'restoring' && (
          <>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.cardBody}>Restaurando seus dados...</Text>
          </>
        )}
      </Card>

      {(step === 'welcome' || step === 'no-backup') && (
        <Button label="Pular por agora" variant="secondary" onPress={finish} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    justifyContent: 'center',
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardBody: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
