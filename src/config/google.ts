import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const GOOGLE_ANDROID_CLIENT_ID = (extra.googleAndroidClientId as string) || '';
export const GOOGLE_IOS_CLIENT_ID = (extra.googleIosClientId as string) || '';

export const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

export function isGoogleConfigured(): boolean {
  return Boolean(GOOGLE_ANDROID_CLIENT_ID || GOOGLE_IOS_CLIENT_ID);
}
