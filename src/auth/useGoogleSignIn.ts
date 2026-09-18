import { useCallback, useRef, useState } from 'react';
import { signInWithGoogle } from './googleAuth';

export function useGoogleSignIn(onSignedIn: (email: string | null) => void) {
  const [busy, setBusy] = useState(false);
  const onSignedInRef = useRef(onSignedIn);
  onSignedInRef.current = onSignedIn;

  const promptAsync = useCallback(async () => {
    setBusy(true);
    try {
      const user = await signInWithGoogle();
      if (user) onSignedInRef.current(user.email);
    } catch (error) {
      console.warn('Google sign-in failed', error);
    } finally {
      setBusy(false);
    }
  }, []);

  return { request: !busy, promptAsync };
}
