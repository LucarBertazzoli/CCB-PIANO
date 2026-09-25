/**
 * Teoria musical básica: números MIDI, nomes de notas e frequências.
 * MIDI 60 = Dó central (C4).
 */

export type Notation = 'solfege' | 'letters';

const SOLFEGE = ['Dó', 'Dó♯', 'Ré', 'Ré♯', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Lá♯', 'Si'];
const SOLFEGE_FLAT = ['Dó', 'Ré♭', 'Ré', 'Mi♭', 'Mi', 'Fá', 'Sol♭', 'Sol', 'Lá♭', 'Lá', 'Si♭', 'Si'];
const LETTERS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const LETTERS_FLAT = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];

const BLACK = [false, true, false, true, false, false, true, false, true, false, true, false];

export const MIDDLE_C = 60;

export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

/** Oitava no padrão internacional (Dó central = C4). */
export function octaveOf(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

/**
 * Oitava no padrão usado pela CCB/MOR, em que o Dó central é o Dó3.
 * (Em letras mantemos o padrão internacional: C4.)
 */
export function octaveFor(midi: number, notation: Notation): number {
  return notation === 'solfege' ? Math.floor(midi / 12) - 2 : octaveOf(midi);
}

export function isBlackKey(midi: number): boolean {
  return BLACK[pitchClass(midi)];
}

export function noteName(
  midi: number,
  notation: Notation = 'solfege',
  opts: { withOctave?: boolean; preferFlats?: boolean } = {},
): string {
  const pc = pitchClass(midi);
  const table =
    notation === 'solfege'
      ? opts.preferFlats
        ? SOLFEGE_FLAT
        : SOLFEGE
      : opts.preferFlats
        ? LETTERS_FLAT
        : LETTERS;
  const base = table[pc];
  return opts.withOctave ? `${base}${octaveFor(midi, notation)}` : base;
}

export function midiToFrequency(midi: number, a4 = 440): number {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

/** Retorna o número MIDI (fracionário) correspondente a uma frequência. */
export function frequencyToMidi(freq: number, a4 = 440): number {
  return 69 + 12 * Math.log2(freq / a4);
}

const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/**
 * Converte "C4", "F#3", "Bb2", "c#5" em número MIDI.
 * Lança erro para entradas inválidas.
 */
export function parseNoteName(name: string): number {
  const m = /^([A-Ga-g])([#b♯♭]*)(-?\d)$/.exec(name.trim());
  if (!m) throw new Error(`Nota inválida: "${name}"`);
  const letter = m[1].toUpperCase();
  let pc = LETTER_PC[letter];
  for (const acc of m[2]) pc += acc === '#' || acc === '♯' ? 1 : -1;
  const octave = parseInt(m[3], 10);
  return (octave + 1) * 12 + pc;
}

/** Posição diatônica (linha/espaço) usada para desenhar a nota na pauta. */
export function diatonicStep(midi: number, preferFlats = false): { step: number; accidental: -1 | 0 | 1 } {
  const pc = pitchClass(midi);
  const octave = octaveOf(midi);
  const naturalIndex = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
  const naturalIndexFlat = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];
  const idx = preferFlats ? naturalIndexFlat[pc] : naturalIndex[pc];
  const accidental: -1 | 0 | 1 = BLACK[pc] ? (preferFlats ? -1 : 1) : 0;
  return { step: octave * 7 + idx, accidental };
}
