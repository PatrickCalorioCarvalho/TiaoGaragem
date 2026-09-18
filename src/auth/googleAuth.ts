import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { TokenResponse } from 'expo-auth-session';
import { discovery } from 'expo-auth-session/providers/google';
import { GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../config/google';

const STORAGE_KEY = 'tiaogaragem_google_auth';

export interface StoredGoogleAuth {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  issuedAt: number;
  email: string | null;
}

const clientId = Platform.select({
  ios: GOOGLE_IOS_CLIENT_ID,
  android: GOOGLE_ANDROID_CLIENT_ID,
  default: GOOGLE_ANDROID_CLIENT_ID,
});

export async function saveAuth(token: Pick<TokenResponse, 'accessToken' | 'refreshToken' | 'expiresIn' | 'issuedAt'>, email: string | null): Promise<void> {
  const data: StoredGoogleAuth = {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    expiresIn: token.expiresIn,
    issuedAt: token.issuedAt,
    email,
  };
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(data));
}

export async function loadAuth(): Promise<StoredGoogleAuth | null> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as StoredGoogleAuth) : null;
}

export async function clearAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}

export async function getValidAccessToken(): Promise<string | null> {
  const stored = await loadAuth();
  if (!stored) return null;

  const token = new TokenResponse({
    accessToken: stored.accessToken,
    refreshToken: stored.refreshToken,
    expiresIn: stored.expiresIn,
    issuedAt: stored.issuedAt,
  });

  if (TokenResponse.isTokenFresh(token)) {
    return token.accessToken;
  }
  if (!token.refreshToken) {
    await clearAuth();
    return null;
  }

  try {
    await token.refreshAsync({ clientId }, discovery);
    await saveAuth(token, stored.email);
    return token.accessToken;
  } catch {
    await clearAuth();
    return null;
  }
}
