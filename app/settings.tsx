import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { clearAuth, loadAuth } from '../src/auth/googleAuth';
import { useGoogleSignIn } from '../src/auth/useGoogleSignIn';
import { performBackup, performRestore } from '../src/backup/backup';
import { getMetadata, LAST_BACKUP_AT_KEY, setMetadata } from '../src/db/metadata';
import { isChecklistReminderEnabled, setChecklistReminderEnabled } from '../src/notifications/checklistReminder';
import { isGoogleConfigured } from '../src/config/google';
import { useTheme, type ThemePreference } from '../src/theme/ThemeContext';
import type { ThemeColors } from '../src/theme/colors';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}>
      <ThemeCard />
      <ChecklistReminderCard />
      {isGoogleConfigured() ? (
        <GoogleBackupSettings />
      ) : (
        <Card style={styles.card}>
          <Text style={styles.title}>Backup no Google Drive</Text>
          <Text style={styles.body}>
            Para ativar o login com Google, configure "googleAndroidClientId" em app.json com o Client ID criado no
            Google Cloud Console.
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
];

function ThemeCard() {
  const { colors, preference, setPreference } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Aparência</Text>
      <Text style={styles.body}>Escolha entre o tema claro, escuro, ou siga o que estiver configurado no Android.</Text>
      <View style={styles.themeOptions}>
        {THEME_OPTIONS.map((option) => {
          const selected = preference === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setPreference(option.value)}
              style={[styles.themeOption, selected && styles.themeOptionSelected]}
            >
              <Text style={[styles.themeOptionText, selected && styles.themeOptionTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

function ChecklistReminderCard() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      isChecklistReminderEnabled().then((value) => {
        setEnabled(value);
        setLoading(false);
      });
    }, []),
  );

  async function handleToggle(value: boolean) {
    setSaving(true);
    const success = await setChecklistReminderEnabled(value);
    setEnabled(success ? value : false);
    setSaving(false);
    if (value && !success) {
      Alert.alert(
        'Notificações desativadas',
        'Não foi possível ativar o lembrete porque as notificações estão bloqueadas para o app. Ative nas configurações do Android.',
      );
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.reminderRow}>
        <View style={styles.reminderText}>
          <Text style={styles.title}>Lembrete de checklist semanal</Text>
          <Text style={styles.body}>Um alerta todo domingo às 9h para revisar pneu, água e óleo dos veículos.</Text>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            disabled={saving}
            trackColor={{ true: colors.primary }}
          />
        )}
      </View>
    </Card>
  );
}

function GoogleBackupSettings() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState<string | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [busy, setBusy] = useState<'backup' | 'restore' | null>(null);

  const refresh = useCallback(async () => {
    setCheckingAuth(true);
    const [auth, backupAt] = await Promise.all([loadAuth(), getMetadata(LAST_BACKUP_AT_KEY)]);
    setEmail(auth?.email ?? null);
    setLastBackupAt(backupAt);
    setCheckingAuth(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const { request, promptAsync } = useGoogleSignIn((signedInEmail) => {
    setEmail(signedInEmail);
  });

  async function handleBackup() {
    setBusy('backup');
    try {
      const { photosUploaded } = await performBackup();
      await setMetadata(LAST_BACKUP_AT_KEY, new Date().toISOString());
      await refresh();
      Alert.alert('Backup concluído', `Dados salvos no Google Drive. ${photosUploaded} foto(s) enviada(s).`);
    } catch (error: any) {
      Alert.alert('Erro ao fazer backup', error?.message ?? 'Tente novamente.');
    } finally {
      setBusy(null);
    }
  }

  function handleRestore() {
    Alert.alert(
      'Restaurar backup',
      'Isso vai substituir todos os veículos e históricos salvos neste celular pelos dados do backup no Google Drive. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: async () => {
            setBusy('restore');
            try {
              const { photosRestored } = await performRestore();
              Alert.alert('Backup restaurado', `${photosRestored} foto(s) baixada(s) do Google Drive.`);
            } catch (error: any) {
              Alert.alert('Erro ao restaurar', error?.message ?? 'Tente novamente.');
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  }

  async function handleDisconnect() {
    await clearAuth();
    setEmail(null);
  }

  return (
    <>
      <Card style={styles.card}>
        <Text style={styles.title}>Conta Google</Text>
        {checkingAuth ? (
          <Text style={styles.body}>Verificando...</Text>
        ) : email ? (
          <>
            <Text style={styles.body}>Conectado como {email}</Text>
            <Button label="Desconectar" variant="secondary" onPress={handleDisconnect} />
          </>
        ) : (
          <>
            <Text style={styles.body}>Conecte sua conta Google para fazer backup dos seus dados no Drive.</Text>
            <Button label="Conectar ao Google" onPress={() => promptAsync()} disabled={!request} />
          </>
        )}
      </Card>

      {email && (
        <Card style={styles.card}>
          <Text style={styles.title}>Backup</Text>
          <Text style={styles.body}>
            {lastBackupAt
              ? `Último backup: ${new Date(lastBackupAt).toLocaleString('pt-BR')}`
              : 'Nenhum backup realizado ainda.'}
          </Text>
          <Button label="Fazer backup agora" onPress={handleBackup} loading={busy === 'backup'} disabled={busy !== null} />
          <Button
            label="Restaurar backup do Drive"
            variant="secondary"
            onPress={handleRestore}
            loading={busy === 'restore'}
            disabled={busy !== null}
          />
        </Card>
      )}
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      padding: 16,
      gap: 12,
    },
    card: {
      gap: 12,
    },
    reminderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    reminderText: {
      flex: 1,
      gap: 4,
    },
    themeOptions: {
      flexDirection: 'row',
      gap: 8,
    },
    themeOption: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    themeOptionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    themeOptionText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    themeOptionTextSelected: {
      color: colors.primaryText,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    body: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
    },
  });
}
