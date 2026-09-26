import { hymnIndex, hymnLoaders } from './hinario/registry';
import type { HymnFile } from './hinario/types';
import type { NoteEvent, RestEvent, Song, Voice } from './types';

/**
 * Hinário nº 5 (hinos 1–480 e coros 1–6), importado de partituras digitais a
 * 4 vozes. Cada hino é carregado só quando é aberto.
 */

const TPQ = 480;
const VOICES: Voice[] = ['soprano', 'alto', 'tenor', 'bass'];
const cache = new Map<string, Song>();

export function hymnId(kind: 'hino' | 'coro', n: number): string {
  return `${kind}-${String(n).padStart(3, '0')}`;
}

export function isHymnalId(id: string): boolean {
  return id in hymnLoaders;
}

export { hymnIndex };

/** Converte o arquivo compacto em uma `Song` do app. */
export function hymnFromFile(id: string, f: HymnFile): Song {
  const beats = (ticks: number) => ticks / TPQ;
  const notes: NoteEvent[] = f.notes.map(([midi, start, dur, v], i) => ({
    id: `${VOICES[v][0]}${i}`,
    midi,
    start: beats(start),
    duration: beats(dur),
    hand: v < 2 ? 'right' : 'left',
    voice: VOICES[v],
  }));
  const rests: RestEvent[] = f.rests.map(([start, dur, staff]) => ({
    start: beats(start),
    duration: beats(dur),
    hand: staff === 0 ? 'right' : 'left',
  }));
  const lines = f.lines.map(beats);
  const endBeat = beats(f.end);
  const isCoro = f.kind === 'coro';
  return {
    id,
    kind: 'hymn',
    hymnNumber: isCoro ? undefined : f.n,
    title: isCoro ? `Coro ${f.n} — ${f.title}` : f.title,
    subtitle: f.composer || undefined,
    composer: f.composer || undefined,
    // Para estudar começamos no andamento mínimo indicado no hinário.
    tempo: f.tempo[0],
    tempoMark: f.tempoMark,
    timeSignature: f.time,
    keySignature: f.key,
    difficulty: 3,
    instruments: ['organ', 'piano'],
    notes,
    rests,
    measures: f.measures.map(beats),
    lines,
    endBeat,
    sections: lines.map((start, i) => ({
      id: `linha-${i + 1}`,
      label: `${i + 1}ª linha`,
      startBeat: start,
      endBeat: lines[i + 1] ?? endBeat,
    })),
    credits: 'Hinário nº 5 — Congregação Cristã no Brasil.',
  };
}

export function loadHymn(id: string): Song | undefined {
  const cached = cache.get(id);
  if (cached) return cached;
  const loader = hymnLoaders[id];
  if (!loader) return undefined;
  const song = hymnFromFile(id, loader());
  cache.set(id, song);
  return song;
}

/** Uma entrada do hinário para busca e seleção. */
export interface HymnEntry {
  kind: 'hino' | 'coro';
  number: number;
  title: string;
  songId: string;
}

/** Catálogo completo: hinos 1–480 e coros 1–6. */
export function hymnCatalog(): HymnEntry[] {
  return hymnIndex.map((h) => ({ kind: h.kind, number: h.n, title: h.title, songId: hymnId(h.kind, h.n) }));
}
