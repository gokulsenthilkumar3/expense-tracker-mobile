import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const { isReady, isAuthenticated, hasPinSetup, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isReady) return;

    const stringSegments = segments as string[];
    const isRoot = stringSegments.length === 0;
    const inAuthGroup = !isRoot && stringSegments[0] === 'auth';

    if (!hasPinSetup) {
      // First time launch -> Setup
      if (segments.join('/') !== 'auth/setup') {
        router.replace('/auth/setup');
      }
    } else if (!isAuthenticated) {
      // Has PIN but not logged in -> Login
      if (segments.join('/') !== 'auth/login' && segments.join('/') !== 'auth/recovery') {
        router.replace('/auth/login');
      }
    } else if (isAuthenticated) {
      // Logged in but still in auth group -> App (Dashboard)
      if (inAuthGroup || isRoot) {
        router.replace('/(app)/dashboard');
      }
    }
  }, [isReady, isAuthenticated, hasPinSetup, segments]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return <Slot />;
}
