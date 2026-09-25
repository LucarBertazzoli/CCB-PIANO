import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * O app inteiro funciona na horizontal (paisagem), como o Simply Piano.
 * O `app.json` já define `orientation: landscape`; aqui garantimos o
 * bloqueio também em tablets e ao voltar do segundo plano.
 */
export function useLandscape(): void {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
  }, []);
}
