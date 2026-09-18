import { useEffect, useRef } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { discovery } from 'expo-auth-session/providers/google';
import { fetchUserInfoAsync } from 'expo-auth-session';
import { GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, DRIVE_APPDATA_SCOPE, OAUTH_REDIRECT_URI } from '../config/google';
import { saveAuth } from './googleAuth';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleSignIn(onSignedIn: (email: string | null) => void) {
  const [request, response, promptAsync] = Google.useAuthRequest(
    {
      androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
      iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
      scopes: ['openid', 'profile', 'email', DRIVE_APPDATA_SCOPE],
      extraParams: { access_type: 'offline', prompt: 'consent' },
    },
    { native: OAUTH_REDIRECT_URI },
  );

  const onSignedInRef = useRef(onSignedIn);
  onSignedInRef.current = onSignedIn;

  useEffect(() => {
    if (response?.type !== 'success' || !response.authentication) return;

    (async () => {
      const authentication = response.authentication!;
      let email: string | null = null;
      try {
        const userInfo = await fetchUserInfoAsync({ accessToken: authentication.accessToken }, discovery);
        email = (userInfo.email as string) ?? null;
      } catch {
        // Non-fatal: backup can proceed without a known email.
      }
      await saveAuth(authentication, email);
      onSignedInRef.current(email);
    })();
  }, [response]);

  return { request, response, promptAsync };
}
