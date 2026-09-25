import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Instrument } from '@/content/types';
import type { InputSourceKind } from '@/input/types';
import type { Notation } from '@/music/theory';

export type NoteLabelMode = 'name' | 'finger' | 'none';
/** falling = notas caindo; page = partitura completa (hinário); sheet = partitura rolando (lições). */
export type ViewMode = 'falling' | 'page' | 'sheet';

export interface SettingsState {
  notation: Notation;
  noteLabels: NoteLabelMode;
  showKeyLabels: boolean;
  instrument: Instrument;
  inputSource: InputSourceKind;
  /** Volume mínimo que o microfone considera como nota (0.002 .. 0.05). */
  micSensitivity: number;
  /** Latência do microfone (s) para o modo ritmo. */
  micLatency: number;
  /** Velocidade de queda das notas (pixels por segundo). */
  fallSpeed: number;
  volume: number;
  playAccompaniment: boolean;
  metronome: boolean;
  viewMode: ViewMode;
  /** Mostra o teclado na tela junto com a partitura. */
  showKeyboard: boolean;
  /** Libera todas as lições (útil para professores e para montar conteúdo). */
  unlockAll: boolean;
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      notation: 'solfege',
      noteLabels: 'name',
      showKeyLabels: true,
      instrument: 'piano',
      inputSource: 'touch',
      micSensitivity: 0.01,
      micLatency: 0.12,
      fallSpeed: 160,
      volume: 0.8,
      playAccompaniment: true,
      metronome: false,
      viewMode: 'page',
      unlockAll: false,
      showKeyboard: true,
      set: (patch) => set(patch),
    }),
    { name: 'ccb-piano-settings', storage: createJSONStorage(() => AsyncStorage), version: 1 },
  ),
);
