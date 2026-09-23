import { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { getDb } from '../src/db/database';
import { colors } from '../src/theme/colors';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getDb().then(() => {
      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
    });
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'TiaoGaragem' }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="settings" options={{ title: 'Backup e conta' }} />
          <Stack.Screen name="vehicle/new" options={{ title: 'Novo veículo', presentation: 'modal' }} />
          <Stack.Screen name="vehicle/[id]/index" options={{ title: 'Veículo' }} />
          <Stack.Screen name="vehicle/[id]/edit" options={{ title: 'Editar veículo', presentation: 'modal' }} />
          <Stack.Screen
            name="vehicle/[id]/oil-change"
            options={{ title: 'Troca de óleo', presentation: 'modal' }}
          />
          <Stack.Screen
            name="vehicle/[id]/checklist"
            options={{ title: 'Checklist semanal', presentation: 'modal' }}
          />
          <Stack.Screen
            name="vehicle/[id]/documents"
            options={{ title: 'IPVA e licenciamento', presentation: 'modal' }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
