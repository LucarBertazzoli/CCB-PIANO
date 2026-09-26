import * as ScreenOrientation from 'expo-screen-orientation';
import { DarkTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { synth } from '@/audio/synth';
import { useSettings } from '@/store/settings';

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: '#000000', card: '#000000', text: '#FFFFFF', border: '#1A1A1A', primary: '#FFFFFF' },
};

export default function RootLayout() {
  const instrument = useSettings((s) => s.instrument);
  const volume = useSettings((s) => s.volume);

  // O app funciona na horizontal (paisagem).
  useEffect(() => {
    if (Platform.OS !== 'web') {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    }
  }, []);

  useEffect(() => {
    synth.instrument = instrument;
    synth.setVolume(volume);
  }, [instrument, volume]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={theme}>
          <StatusBar style="light" hidden />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' }, animation: 'fade' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="tocar/[songId]" options={{ gestureEnabled: false }} />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
