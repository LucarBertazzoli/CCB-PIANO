import { parseNoteName } from '@/music/theory';

import type { Finger, Hand, NoteEvent, RestEvent, Voice } from './types';

/**
 * Notação textual compacta para cadastrar músicas rapidamente.
 *
 *   "C4/q D4/q E4/h | [C3 G3]/w r/q E4/q.:3"
 *
 * - Nota: `C4`, `F#3`, `Bb2`
 * - Acorde: `[C4 E4 G4]`
 * - Pausa: `r`
 * - Duração após `/`: w=4, h=2, q=1, e=0.5, s=0.25 (ponto = pontuada, ex. `q.`)
 *   ou um número de batidas (`/1.5`). Se omitida, repete a duração anterior.
 * - Dedilhado após `:` (1..5). Em acordes, um dedo por nota: `[C4 E4 G4]/h:1,3,5`
 * - `|` barras de compasso são ignoradas (só ajudam a leitura).
 */
export interface ParseVoiceOptions {
  hand: Hand;
  voice?: Voice;
  startBeat?: number;
  idPrefix?: string;
}

const DURATIONS: Record<string, number> = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };

function parseDuration(token: string): number {
  const dotted = token.endsWith('.');
  const base = dotted ? token.slice(0, -1) : token;
  let beats = DURATIONS[base];
  if (beats === undefined) {
    beats = Number(base);
    if (!Number.isFinite(beats) || beats <= 0) throw new Error(`Duração inválida: "${token}"`);
  }
  return dotted ? beats * 1.5 : beats;
}

function parseFingers(token: string | undefined, count: number): (Finger | undefined)[] {
  if (!token) return new Array(count).fill(undefined);
  const parts = token.split(',').map((f) => {
    const n = Number(f);
    if (!Number.isInteger(n) || n < 1 || n > 5) throw new Error(`Dedo inválido: "${f}"`);
    return n as Finger;
  });
  return Array.from({ length: count }, (_, i) => parts[i]);
}

/** Divide o texto em tokens, mantendo acordes `[...]` inteiros. */
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const re = /\[[^\]]*\][^\s|]*|[^\s|]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) tokens.push(m[0]);
  return tokens;
}

export function parseVoice(text: string, opts: ParseVoiceOptions): NoteEvent[] {
  return parseVoiceFull(text, opts).notes;
}

/** Como `parseVoice`, mas também devolve as pausas (para a partitura). */
export function parseVoiceFull(
  text: string,
  opts: ParseVoiceOptions,
): { notes: NoteEvent[]; rests: RestEvent[] } {
  const events: NoteEvent[] = [];
  const rests: RestEvent[] = [];
  let beat = opts.startBeat ?? 0;
  let lastDuration = 1;
  const prefix = opts.idPrefix ?? opts.hand[0];

  for (const token of tokenize(text)) {
    const m = /^(\[[^\]]*\]|[^/:]+)(?:\/([^:]+))?(?::(.+))?$/.exec(token);
    if (!m) throw new Error(`Token inválido: "${token}"`);
    const [, pitchPart, durPart, fingerPart] = m;
    const duration = durPart ? parseDuration(durPart) : lastDuration;
    lastDuration = duration;

    if (pitchPart === 'r') {
      rests.push({ start: beat, duration, hand: opts.hand });
    } else {
      const names = pitchPart.startsWith('[')
        ? pitchPart.slice(1, -1).split(/\s+/).filter(Boolean)
        : [pitchPart];
      const fingers = parseFingers(fingerPart, names.length);
      names.forEach((name, i) => {
        events.push({
          id: `${prefix}${events.length}`,
          midi: parseNoteName(name),
          start: beat,
          duration,
          hand: opts.hand,
          ...(fingers[i] ? { finger: fingers[i] } : {}),
          ...(opts.voice ? { voice: opts.voice } : {}),
        });
      });
    }
    beat += duration;
  }
  return { notes: events, rests };
}

/** Junta várias vozes em uma lista ordenada por tempo e altura. */
export function mergeVoices(...voices: NoteEvent[][]): NoteEvent[] {
  return voices.flat().sort((a, b) => a.start - b.start || a.midi - b.midi);
}

/** Atalho para montar as notas de uma música a partir de mão direita/esquerda. */
export function twoHands(right: string, left: string): NoteEvent[] {
  return mergeVoices(
    right ? parseVoice(right, { hand: 'right', idPrefix: 'r' }) : [],
    left ? parseVoice(left, { hand: 'left', idPrefix: 'l' }) : [],
  );
}

/** Monta notas e pausas de uma música a partir das duas mãos. */
export function score(right: string, left = ''): { notes: NoteEvent[]; rests: RestEvent[] } {
  const r = right ? parseVoiceFull(right, { hand: 'right', idPrefix: 'r' }) : { notes: [], rests: [] };
  const l = left ? parseVoiceFull(left, { hand: 'left', idPrefix: 'l' }) : { notes: [], rests: [] };
  return { notes: mergeVoices(r.notes, l.notes), rests: [...r.rests, ...l.rests] };
}
