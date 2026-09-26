import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Instrument } from '@/content/types';
import type { InputSourceKind } from '@/input/types';
import type { Notation } from '@/music/theory';

export type NoteLabelMode = 'name' | 'finger' | 'none';
/** falling = notas caindo; page = partitura (formato do hinário). */
export type ViewMode = 'falling' | 'page';

export interface SettingsState {
  notation: Notation;
  noteLabels: NoteLabelMode;
  showKeyLabels: boolean;
  instrument: Instrument;
  inputSource: InputSourceKind;
  /** Volume mínimo que o microfone considera como nota (0.002 .. 0.05). */
  micSensitivity: number;
  /** Latência do microfone (s) para o modo Tocar. */
  micLatency: number;
  /** Velocidade de queda das notas (pixels por segundo). */
  fallSpeed: number;
  volume: number;
  playAccompaniment: boolean;
  metronome: boolean;
  viewMode: ViewMode;
  /** Mostra o teclado na tela junto com a partitura. */
  showKeyboard: boolean;
  /** Tamanho das teclas: grandes (menos teclas) ou pequenas (mais teclas). */
  keySize: 'large' | 'medium' | 'small';
  /** Órgão: dois manuais (superior e inferior) ou um teclado só. */
  organManuals: 'one' | 'two';
  /** Órgão: mostrar a pedaleira. */
  showPedalboard: boolean;
  /** Preto e branco (padrão) ou com cores por mão. */
  colorMode: 'mono' | 'color';
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void;
}

const DEFAULTS: Omit<SettingsState, 'set'> = {
  notation: 'solfege',
  noteLabels: 'name',
  showKeyLabels: true,
  instrument: 'organ',
  inputSource: 'touch',
  micSensitivity: 0.01,
  micLatency: 0.12,
  fallSpeed: 150,
  volume: 0.8,
  playAccompaniment: true,
  metronome: false,
  viewMode: 'page',
  showKeyboard: true,
  keySize: 'medium',
  organManuals: 'two',
  showPedalboard: true,
  colorMode: 'mono',
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({ ...DEFAULTS, set: (patch) => set(patch) }),
    {
      name: 'ccb-piano-settings',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      // Nova versão do app: volta aos padrões novos (órgão, partitura, preto e branco).
      migrate: () => ({ ...DEFAULTS }) as SettingsState,
    },
  ),
);
