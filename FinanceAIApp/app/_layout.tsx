import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { SettingsProvider } from '../src/context/SettingsContext';
import { TransactionProvider } from '../src/context/TransactionContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

function InitialLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen 
        name="add-transaction" 
        options={{ 
          presentation: 'modal',
          headerShown: false
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <TransactionProvider>
          <InitialLayout />
        </TransactionProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
