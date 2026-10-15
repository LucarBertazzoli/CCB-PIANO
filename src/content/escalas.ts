import type { Finger, NoteEvent, Song } from './types';

/**
 * Escalas e arpejos maiores (uma oitava, subindo e descendo, mãos juntas em
 * oitavas), com o dedilhado tradicional de cada tonalidade.
 */

export type ScaleKey = 'do' | 'sol' | 're' | 'fa' | 'sib' | 'mib' | 'lab' | 'reb';

interface KeyInfo {
  name: string;
  /** Tônica da mão direita (MIDI); a esquerda toca uma oitava abaixo. */
  tonic: number;
  keySignature: number;
  /** Dedos subindo (8 notas), mão direita e mão esquerda. */
  right: Finger[];
  left: Finger[];
}

const WHITE_RIGHT: Finger[] = [1, 2, 3, 1, 2, 3, 4, 5];
const WHITE_LEFT: Finger[] = [5, 4, 3, 2, 1, 3, 2, 1];
const FLAT_LEFT: Finger[] = [3, 2, 1, 4, 3, 2, 1, 3];

export const KEYS: Record<ScaleKey, KeyInfo> = {
  do: { name: 'Dó Maior', tonic: 60, keySignature: 0, right: WHITE_RIGHT, left: WHITE_LEFT },
  sol: { name: 'Sol Maior', tonic: 67, keySignature: 1, right: WHITE_RIGHT, left: WHITE_LEFT },
  re: { name: 'Ré Maior', tonic: 62, keySignature: 2, right: WHITE_RIGHT, left: WHITE_LEFT },
  fa: { name: 'Fá Maior', tonic: 65, keySignature: -1, right: [1, 2, 3, 4, 1, 2, 3, 4], left: WHITE_LEFT },
  sib: { name: 'Si♭ Maior', tonic: 58, keySignature: -2, right: [4, 1, 2, 3, 1, 2, 3, 4], left: FLAT_LEFT },
  mib: { name: 'Mi♭ Maior', tonic: 63, keySignature: -3, right: [3, 1, 2, 3, 4, 1, 2, 3], left: FLAT_LEFT },
  lab: { name: 'Lá♭ Maior', tonic: 68, keySignature: -4, right: [3, 4, 1, 2, 3, 1, 2, 3], left: FLAT_LEFT },
  reb: { name: 'Ré♭ Maior', tonic: 61, keySignature: -5, right: [2, 3, 1, 2, 3, 4, 1, 2], left: FLAT_LEFT },
};

const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12];

/** Sobe e desce: 8 notas + 7 notas; a última dura 2 tempos (4 compassos de 4/4). */
function upAndDown<T>(up: T[]): { item: T; start: number; duration: number }[] {
  const seq = [...up, ...up.slice(0, -1).reverse()];
  return seq.map((item, i) => ({ item, start: i, duration: i === seq.length - 1 ? 2 : 1 }));
}

function build(
  id: string,
  title: string,
  keySignature: number,
  right: { midi: number; finger?: Finger }[],
  left: { midi: number; finger?: Finger }[],
): Song {
  const notes: NoteEvent[] = [];
  for (const [hand, seq] of [
    ['right', right],
    ['left', left],
  ] as const) {
    upAndDown(seq).forEach(({ item, start, duration }, i) => {
      notes.push({ id: `${hand[0]}${i}`, midi: item.midi, start, duration, hand, finger: item.finger, voice: hand === 'right' ? 'soprano' : 'bass' });
    });
  }
  const end = Math.max(...notes.map((n) => n.start + n.duration));
  return {
    id,
    kind: 'exercise',
    title,
    tempo: 72,
    timeSignature: [4, 4],
    keySignature,
    difficulty: 2,
    instruments: ['organ', 'piano'],
    notes,
    measures: Array.from({ length: Math.ceil(end / 4) }, (_, i) => i * 4),
    lines: [0],
    endBeat: end,
  };
}

export function scaleSong(key: ScaleKey, id: string, title: string): Song {
  const k = KEYS[key];
  return build(
    id,
    title,
    k.keySignature,
    MAJOR.map((s, i) => ({ midi: k.tonic + s, finger: k.right[i] })),
    MAJOR.map((s, i) => ({ midi: k.tonic - 12 + s, finger: k.left[i] })),
  );
}

export function arpeggioSong(key: ScaleKey, id: string, title: string): Song {
  const k = KEYS[key];
  // Tônica, terça, quinta, oitava. Dedilhado indicado só nas tonalidades que
  // começam em tecla branca (nas outras ele varia conforme a escola).
  const white = k.keySignature >= -1;
  const steps = [0, 4, 7, 12];
  return build(
    id,
    title,
    k.keySignature,
    steps.map((s, i) => ({ midi: k.tonic + s, finger: white ? ([1, 2, 3, 5] as Finger[])[i] : undefined })),
    steps.map((s, i) => ({ midi: k.tonic - 12 + s, finger: white ? ([5, 3, 2, 1] as Finger[])[i] : undefined })),
  );
}

/** Escala cromática a partir do Dó3 (dedo 3 nas teclas pretas). */
export function chromaticSong(id: string, title: string): Song {
  const rf: Finger[] = [1, 3, 1, 3, 1, 2, 3, 1, 3, 1, 3, 1, 2];
  const lf: Finger[] = [1, 3, 2, 3, 1, 2, 3, 1, 3, 1, 3, 2, 1];
  const right = rf.map((finger, i) => ({ midi: 60 + i, finger }));
  const left = lf.map((finger, i) => ({ midi: 48 + i, finger }));
  return build(id, title, 0, right, left);
}
