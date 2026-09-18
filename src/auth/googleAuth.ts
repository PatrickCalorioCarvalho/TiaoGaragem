import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { DRIVE_APPDATA_SCOPE, GOOGLE_IOS_CLIENT_ID } from '../config/google';

export interface SignedInUser {
  email: string | null;
}

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  GoogleSignin.configure({
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    scopes: [DRIVE_APPDATA_SCOPE],
  });
  configured = true;
}

export async function loadAuth(): Promise<SignedInUser | null> {
  ensureConfigured();
  const user = GoogleSignin.getCurrentUser();
  return user ? { email: user.user.email ?? null } : null;
}

export async function clearAuth(): Promise<void> {
  ensureConfigured();
  await GoogleSignin.signOut();
}

export async function signInWithGoogle(): Promise<SignedInUser | null> {
  ensureConfigured();
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  if (response.type !== 'success') return null;
  return { email: response.data.user.email ?? null };
}

export async function getValidAccessToken(): Promise<string | null> {
  ensureConfigured();
  try {
    if (!GoogleSignin.getCurrentUser()) {
      const silent = await GoogleSignin.signInSilently();
      if (silent.type !== 'success') return null;
    }
    const { accessToken } = await GoogleSignin.getTokens();
    return accessToken;
  } catch {
    return null;
  }
}
