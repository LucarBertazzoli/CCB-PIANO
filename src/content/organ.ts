import type { NoteEvent, Song } from './types';

/**
 * Arranjo para órgão, no formato do hinário da organista:
 *  - mão direita: soprano e contralto; mão esquerda: tenor e baixo;
 *  - pedaleira: o baixo, na região grave do pedal (Dó1–Sol2 no padrão CCB);
 *  - legato do órgão: notas repetidas nas vozes internas e no baixo viram uma
 *    nota só, segurada (o soprano continua articulando a melodia).
 *
 * É uma adaptação automática a partir das 4 vozes; o dedilhado e pequenas
 * escolhas do hinário impresso podem variar.
 */

const EPS = 1e-6;
const cache = new WeakMap<Song, Song>();

/** Junta notas repetidas e contíguas, sem atravessar os limites dados. */
function mergeRepeats(notes: NoteEvent[], boundaries: number[]): NoteEvent[] {
  const sorted = [...notes].sort((a, b) => a.start - b.start || a.midi - b.midi);
  const out: NoteEvent[] = [];
  // Um limite no início da nova nota (ou entre as duas) impede a junção.
  const crosses = (from: number, to: number) => boundaries.some((b) => b > from + EPS && b <= to + EPS);
  for (const n of sorted) {
    const prev = [...out].reverse().find((p) => p.midi === n.midi && Math.abs(p.start + p.duration - n.start) < EPS);
    if (prev && !crosses(prev.start, n.start)) {
      prev.duration += n.duration;
    } else {
      out.push({ ...n });
    }
  }
  return out;
}

/** Leva a nota do baixo para a região da pedaleira. */
function pedalPitch(midi: number): number {
  let p = midi;
  while (p > 47) p -= 12; // acima de Si2 (padrão internacional) desce uma oitava
  while (p < 36) p += 12;
  return p;
}

export function organArrangement(song: Song): Song {
  if (!song.notes.some((n) => n.voice)) return song;
  const cached = cache.get(song);
  if (cached) return cached;

  const lines = song.lines ?? [0];
  const measures = song.measures ?? [];
  const end = song.endBeat ?? Math.max(...song.notes.map((n) => n.start + n.duration));

  // Limites da pedaleira: metades dos compassos (como no hinário).
  const halves: number[] = [];
  const bars = [...measures, end];
  for (let i = 0; i < bars.length - 1; i++) {
    const len = bars[i + 1] - bars[i];
    halves.push(bars[i]);
    if (len >= 2 - EPS) halves.push(bars[i] + len / 2);
  }

  const byVoice = (v: NoteEvent['voice']) => song.notes.filter((n) => n.voice === v);
  const soprano = byVoice('soprano');
  const alto = mergeRepeats(byVoice('alto'), lines);
  const tenor = mergeRepeats(byVoice('tenor'), lines);
  const bassNotes = byVoice('bass');
  const bass = mergeRepeats(bassNotes, lines);

  // Pedal: a nota mais grave do baixo em cada ataque.
  const lowestByStart = new Map<number, NoteEvent>();
  for (const n of bassNotes) {
    const k = Math.round(n.start * 1000);
    const cur = lowestByStart.get(k);
    if (!cur || n.midi < cur.midi) lowestByStart.set(k, n);
  }
  const pedal = mergeRepeats(
    [...lowestByStart.values()].map((n) => ({ ...n, midi: pedalPitch(n.midi), voice: 'pedal' as const, hand: 'left' as const })),
    [...halves, ...lines],
  );

  const notes = [...soprano, ...alto, ...tenor, ...bass, ...pedal]
    .sort((a, b) => a.start - b.start || a.midi - b.midi)
    .map((n, i) => ({ ...n, id: `o${i}` }));

  const arranged: Song = { ...song, notes };
  cache.set(song, arranged);
  return arranged;
}
