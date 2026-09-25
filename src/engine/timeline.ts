import type { Finger, Hand, HandSelection, Song } from '@/content/types';

/** Nota com tempos em segundos, pronta para o motor de prática. */
export interface TimedNote {
  id: string;
  midi: number;
  hand: Hand;
  finger?: Finger;
  /** Início em segundos (0 = início do trecho). */
  time: number;
  duration: number;
  /** Batida original na música (útil para a partitura). */
  beat: number;
  beats: number;
  /** Se o aluno deve tocar esta nota (senão ela toca sozinha como acompanhamento). */
  active: boolean;
}

export interface TimedRest {
  hand: Hand;
  time: number;
  beats: number;
}

export interface Timeline {
  notes: TimedNote[];
  rests: TimedRest[];
  secondsPerBeat: number;
  /** Batida da música que corresponde a time = 0. */
  originBeat: number;
  /** Duração total do trecho (segundos). */
  duration: number;
  /** Tempos (s) das barras de compasso dentro do trecho. */
  barLines: number[];
  lowest: number;
  highest: number;
}

export interface TimelineOptions {
  hands: HandSelection;
  tempoFactor?: number;
  startBeat?: number;
  endBeat?: number;
}

export function isHandActive(hand: Hand, selection: HandSelection): boolean {
  return selection === 'both' || selection === hand;
}

export function buildTimeline(song: Song, opts: TimelineOptions): Timeline {
  const factor = opts.tempoFactor ?? 1;
  const secondsPerBeat = 60 / (song.tempo * factor);
  const startBeat = opts.startBeat ?? 0;
  const endBeat = opts.endBeat ?? Infinity;

  const notes: TimedNote[] = song.notes
    .filter((n) => n.start >= startBeat && n.start < endBeat)
    .map((n) => ({
      id: n.id,
      midi: n.midi,
      hand: n.hand,
      finger: n.finger,
      time: (n.start - startBeat) * secondsPerBeat,
      duration: Math.min(n.duration, endBeat - n.start) * secondsPerBeat,
      beat: n.start,
      beats: n.duration,
      active: isHandActive(n.hand, opts.hands),
    }))
    .sort((a, b) => a.time - b.time || a.midi - b.midi);

  const lastBeat = Math.max(
    notes.reduce((max, n) => Math.max(max, n.beat + n.beats), startBeat),
    (song.rests ?? []).reduce((max, r) => (r.start < endBeat ? Math.max(max, r.start + r.duration) : max), startBeat),
  );
  const duration = (Math.min(lastBeat, endBeat) - startBeat) * secondsPerBeat;

  const beatsPerBar = song.timeSignature[0] * (4 / song.timeSignature[1]);
  const barLines: number[] = [];
  const firstBar = Math.ceil(startBeat / beatsPerBar) * beatsPerBar;
  for (let b = firstBar; b <= Math.min(lastBeat, endBeat); b += beatsPerBar) {
    barLines.push((b - startBeat) * secondsPerBeat);
  }

  const rests: TimedRest[] = (song.rests ?? [])
    .filter((r) => r.start >= startBeat && r.start < endBeat)
    .map((r) => ({ hand: r.hand, time: (r.start - startBeat) * secondsPerBeat, beats: r.duration }));

  const midis = notes.map((n) => n.midi);
  return {
    notes,
    rests,
    secondsPerBeat,
    originBeat: startBeat,
    duration,
    barLines,
    lowest: midis.length ? Math.min(...midis) : 60,
    highest: midis.length ? Math.max(...midis) : 72,
  };
}
