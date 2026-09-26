import { Platform } from 'react-native';

import { useSettings } from '@/store/settings';

/**
 * Identidade visual: minimalista, preto e branco por padrão (como os
 * materiais da CCB), com a opção de ligar cores para diferenciar as mãos.
 * Fonte: Verdana, a mesma do site oficial da CCB.
 */

export const font = Platform.select({
  web: 'Verdana, Geneva, "DejaVu Sans", sans-serif',
  default: 'Verdana',
}) as string;

export interface Palette {
  mode: 'mono' | 'color';
  bg: string;
  surface: string;
  surfaceStrong: string;
  border: string;
  text: string;
  textDim: string;
  textFaint: string;
  primary: string;
  primaryText: string;
  /** Teclas esperadas: [tecla branca, tecla preta, cor do texto]. */
  keyRight: [string, string, string];
  keyLeft: [string, string, string];
  keyPedal: [string, string, string];
  keyCorrect: string;
  keyWrong: string;
  keyWhite: string;
  keyWhitePressed: string;
  keyBlack: string;
  keyBlackPressed: string;
  keyLabel: string;
  /** Notas caindo. */
  highway: string;
  lane: string;
  laneC: string;
  barLine: string;
  hitLine: string;
  noteRight: string;
  noteLeft: string;
  noteAuto: string;
  noteHit: string;
  noteMissed: string;
  noteText: string;
  /** Partitura. */
  paper: string;
  ink: string;
  inkInactive: string;
  inkRight: string;
  inkLeft: string;
  inkPedal: string;
  inkHit: string;
  inkMissed: string;
  staff: string;
  cursor: string;
  cursorEdge: string;
  /** Pedaleira. */
  pedalBoard: string;
  pedalNatural: string;
  pedalSharp: string;
  pedalLabel: string;
}

/** Preto e branco (padrão): fundo escuro, painéis de vidro, como no Artie. */
export const mono: Palette = {
  mode: 'mono',
  bg: '#000000',
  surface: 'rgba(40,40,40,0.92)',
  surfaceStrong: 'rgba(64,64,64,0.95)',
  border: 'rgba(255,255,255,0.10)',
  text: '#F5F5F5',
  textDim: '#9A9A9A',
  textFaint: '#5E5E5E',
  primary: '#FFFFFF',
  primaryText: '#000000',
  keyRight: ['#3A3A3A', '#8A8A8A', '#FFFFFF'],
  keyLeft: ['#A8A8A8', '#5E5E5E', '#000000'],
  keyPedal: ['#6E6E6E', '#B5B5B5', '#FFFFFF'],
  keyCorrect: '#FFFFFF',
  keyWrong: '#4A4A4A',
  keyWhite: '#EDEDED',
  keyWhitePressed: '#C8C8C8',
  keyBlack: '#101010',
  keyBlackPressed: '#3A3A3A',
  keyLabel: '#7A7A7A',
  highway: '#050505',
  lane: '#141414',
  laneC: '#262626',
  barLine: '#1C1C1C',
  hitLine: '#FFFFFF',
  noteRight: '#F2F2F2',
  noteLeft: '#8A8A8A',
  noteAuto: '#222222',
  noteHit: '#4A4A4A',
  noteMissed: '#050505',
  noteText: '#000000',
  paper: '#FFFFFF',
  ink: '#111111',
  inkInactive: '#BDBDBD',
  inkRight: '#000000',
  inkLeft: '#000000',
  inkPedal: '#000000',
  inkHit: '#9A9A9A',
  inkMissed: '#000000',
  staff: '#3A3A3A',
  cursor: 'rgba(0,0,0,0.06)',
  cursorEdge: '#111111',
  pedalBoard: '#0E0E0E',
  pedalNatural: '#D9D9D9',
  pedalSharp: '#1A1A1A',
  pedalLabel: '#6E6E6E',
};

/** Opcional: cores por mão e um destaque laranja (como o Artie). */
export const color: Palette = {
  ...mono,
  mode: 'color',
  primary: '#FF5A1F',
  primaryText: '#FFFFFF',
  keyRight: ['#5AB4FF', '#1976D2', '#0B2A4A'],
  keyLeft: ['#B07CFF', '#7B2FD0', '#FFFFFF'],
  keyPedal: ['#4DD0B8', '#00796B', '#0B3A33'],
  keyCorrect: '#4CD964',
  keyWrong: '#FF5A5F',
  noteRight: '#3FA9F5',
  noteLeft: '#A06BFF',
  noteHit: '#2E7D46',
  noteMissed: '#3A1416',
  noteText: '#FFFFFF',
  inkRight: '#1565C0',
  inkLeft: '#6A2FB8',
  inkPedal: '#00897B',
  inkHit: '#1FA64A',
  inkMissed: '#D93A3F',
  cursor: 'rgba(33,150,243,0.12)',
  cursorEdge: '#1E88E5',
};

export function usePalette(): Palette {
  const mode = useSettings((s) => s.colorMode);
  return mode === 'color' ? color : mono;
}

export const radius = { sm: 6, md: 12, lg: 20, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
