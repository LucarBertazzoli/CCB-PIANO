import type { Finger, Hand, HandSelection, Song, Voice } from '@/content/types';

/** Nota com tempos em segundos, pronta para o motor de prática. */
export interface TimedNote {
  id: string;
  midi: number;
  hand: Hand;
  finger?: Finger;
  voice?: Voice;
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
  voice?: Voice;
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
  /** Início de cada compasso do trecho em batidas (relativas ao início), mais o fim. */
  measureStarts: number[];
  /** Início de cada linha (sistema) do hinário no trecho, em batidas relativas. */
  lineStarts: number[];
  lowest: number;
  highest: number;
}

export interface TimelineOptions {
  hands: HandSelection;
  tempoFactor?: number;
  startBeat?: number;
  endBeat?: number;
  /**
   * Vozes que o aluno toca (hinos a 4 vozes). As demais tocam sozinhas como
   * acompanhamento. Sem valor = todas as vozes das mãos escolhidas.
   */
  voices?: Voice[];
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
      voice: n.voice,
      time: (n.start - startBeat) * secondsPerBeat,
      duration: Math.min(n.duration, endBeat - n.start) * secondsPerBeat,
      beat: n.start,
      beats: n.duration,
      active: opts.voices?.length
        ? !!n.voice && opts.voices.includes(n.voice)
        : isHandActive(n.hand, opts.hands) && n.voice !== 'pedal',
    }))
    .sort((a, b) => a.time - b.time || a.midi - b.midi);

  const lastNoteBeat = Math.max(
    notes.reduce((max, n) => Math.max(max, n.beat + n.beats), startBeat),
    (song.rests ?? []).reduce((max, r) => (r.start < endBeat ? Math.max(max, r.start + r.duration) : max), startBeat),
  );
  const lastBeat = Math.min(endBeat, Math.max(lastNoteBeat, song.endBeat ?? 0));
  const duration = (lastBeat - startBeat) * secondsPerBeat;

  // Compassos: os do hinário (com anacruse etc.) ou regulares.
  const beatsPerBar = song.timeSignature[0] * (4 / song.timeSignature[1]);
  let bars: number[];
  if (song.measures?.length) {
    bars = song.measures.filter((b) => b >= startBeat - 1e-9 && b < lastBeat - 1e-9);
    if (!bars.length || bars[0] > startBeat + 1e-9) bars.unshift(startBeat);
  } else {
    bars = [];
    for (let b = Math.floor(startBeat / beatsPerBar) * beatsPerBar; b < lastBeat - 1e-9; b += beatsPerBar) {
      bars.push(Math.max(b, startBeat));
    }
    if (!bars.length) bars.push(startBeat);
  }
  const measureStarts = [...bars.map((b) => b - startBeat), lastBeat - startBeat];
  const barLines = measureStarts.slice(1).map((b) => b * secondsPerBeat);
  const lineStarts = (song.lines ?? [])
    .filter((b) => b >= startBeat - 1e-9 && b < lastBeat - 1e-9)
    .map((b) => b - startBeat);
  if (!lineStarts.length || lineStarts[0] > 1e-9) lineStarts.unshift(0);

  const rests: TimedRest[] = (song.rests ?? [])
    .filter((r) => r.start >= startBeat && r.start < endBeat)
    .map((r) => ({ hand: r.hand, voice: r.voice, time: (r.start - startBeat) * secondsPerBeat, beats: r.duration }));

  // A extensão do teclado ignora a pedaleira quando ela só acompanha.
  const midis = notes.filter((n) => n.voice !== 'pedal' || n.active).map((n) => n.midi);
  return {
    notes,
    rests,
    secondsPerBeat,
    originBeat: startBeat,
    duration,
    barLines,
    measureStarts,
    lineStarts,
    lowest: midis.length ? Math.min(...midis) : 60,
    highest: midis.length ? Math.max(...midis) : 72,
  };
}
