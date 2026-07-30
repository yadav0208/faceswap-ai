import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { Platform, StyleSheet, View } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const style = document.createElement('style');
    style.setAttribute('data-anva-input-focus', 'true');
    style.textContent = `
      input:focus,
      textarea:focus,
      [contenteditable="true"]:focus {
        outline: none !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem('auth_token').then((token) => {
      if (!active) return;
      const inAuth = segments[0] === 'auth';
      if (!token && !inAuth) router.replace('/auth/login');
      if (token && inAuth) router.replace('/(tabs)');
    });
    return () => { active = false; };
  }, [router, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0D0D14' }}>
      <StatusBar style="light" backgroundColor="#0D0D14" />
      <View style={styles.appFrame}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0D0D14' },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="studio/[id]"
            options={{ animation: 'slide_from_right', headerShown: false }}
          />
          <Stack.Screen
            name="auth/login"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="auth/register"
            options={{ presentation: 'modal', headerShown: false }}
          />
        </Stack>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  appFrame: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: '#0D0D14',
    ...(Platform.OS === 'web'
      ? {
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
          shadowColor: '#000',
          shadowOpacity: 0.5,
          shadowRadius: 24,
        }
      : {}),
  },
});
