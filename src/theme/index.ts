import { Platform, type TextStyle } from 'react-native';

import { useSettings, type ColorChoices, type FontChoice } from '@/store/settings';

import { inkOnPaper, mix, readableOn, withAlpha } from './color';

/**
 * Identidade visual: minimalista, preto e branco por padrão (como os
 * materiais da CCB), com a opção de ligar cores para diferenciar as mãos.
 * Fonte: Verdana, a mesma do site oficial da CCB.
 */

export const font = Platform.select({
  web: 'Verdana, Geneva, "DejaVu Sans", sans-serif',
  // O Android não tem Verdana: usa a DejaVu Sans (livre e com o mesmo desenho).
  android: 'DejaVuSans',
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

/**
 * Modo colorido: monta a paleta a partir das cores escolhidas (destaque, mãos,
 * pedaleira, acerto, erro, fundo e papel), derivando os tons de cada peça.
 */
export function buildPalette(c: ColorChoices): Palette {
  const bg = c.background;
  const lift = (t: number) => mix(bg, '#FFFFFF', t);
  const keyTriple = (hex: string): [string, string, string] => [hex, mix(hex, '#000000', 0.3), readableOn(hex)];
  return {
    ...mono,
    mode: 'color',
    bg,
    surface: withAlpha(lift(0.16), 0.92),
    surfaceStrong: withAlpha(lift(0.25), 0.95),
    primary: c.accent,
    primaryText: readableOn(c.accent),
    keyRight: keyTriple(c.right),
    keyLeft: keyTriple(c.left),
    keyPedal: keyTriple(c.pedal),
    keyCorrect: c.hit,
    keyWrong: c.miss,
    highway: lift(0.02),
    lane: lift(0.08),
    laneC: lift(0.15),
    barLine: lift(0.11),
    hitLine: c.accent,
    noteRight: c.right,
    noteLeft: c.left,
    noteAuto: lift(0.13),
    noteHit: mix(c.hit, bg, 0.45),
    noteMissed: mix(c.miss, bg, 0.72),
    noteText: readableOn(c.right),
    paper: c.paper,
    inkRight: inkOnPaper(c.right),
    inkLeft: inkOnPaper(c.left),
    inkPedal: inkOnPaper(c.pedal),
    inkHit: inkOnPaper(c.hit),
    inkMissed: inkOnPaper(c.miss),
    cursor: withAlpha(c.accent, 0.12),
    cursorEdge: inkOnPaper(c.accent),
    pedalBoard: lift(0.06),
  };
}

/** Paleta colorida padrão (usada nos testes e como referência). */
export const color: Palette = buildPalette({
  accent: '#FF5A1F',
  right: '#3FA9F5',
  left: '#A06BFF',
  pedal: '#26A69A',
  hit: '#43C463',
  miss: '#FF5A5F',
  background: '#000000',
  paper: '#FFFFFF',
});

// Uma paleta por combinação de cores: a mesma referência evita redesenhos à toa.
const cache = new Map<string, Palette>();

export function usePalette(): Palette {
  const mode = useSettings((s) => s.colorMode);
  const colors = useSettings((s) => s.colors);
  if (mode !== 'color') return mono;
  const key = JSON.stringify(colors);
  let p = cache.get(key);
  if (!p) {
    p = buildPalette(colors);
    cache.set(key, p);
  }
  return p;
}

// ------------------------------------------------------------------ fontes

export interface TypeFace {
  /** Nome da família regular e da família em negrito. */
  family: string;
  boldFamily: string;
  /** Peso a usar junto de `boldFamily` (Verdana usa o negrito do sistema). */
  boldWeight: TextStyle['fontWeight'];
  regular: TextStyle;
  bold: TextStyle;
}

function face(family: string, boldFamily: string, boldWeight: TextStyle['fontWeight']): TypeFace {
  return {
    family,
    boldFamily,
    boldWeight,
    regular: { fontFamily: family },
    bold: { fontFamily: boldFamily, fontWeight: boldWeight },
  };
}

export const FACES: Record<FontChoice, TypeFace> = {
  verdana: Platform.OS === 'android' ? face(font, 'DejaVuSans-Bold', 'normal') : face(font, font, '700'),
  // Serifada no espírito da fonte do Claude (que não é livre): Source Serif 4.
  serif: face('SourceSerif4_400Regular', 'SourceSerif4_700Bold', 'normal'),
  dyslexic: face('OpenDyslexic', 'OpenDyslexic-Bold', 'normal'),
};

export const FONT_LABEL: Record<FontChoice, string> = {
  verdana: 'Verdana',
  serif: 'Serifada',
  dyslexic: 'OpenDyslexic',
};

export function useType(): TypeFace {
  return FACES[useSettings((s) => s.fontChoice)];
}

export const radius = { sm: 6, md: 12, lg: 20, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
