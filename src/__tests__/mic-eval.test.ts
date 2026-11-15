import { describe, expect, it } from '@jest/globals';

import { getSong } from '@/content';
import { organArrangement } from '@/content/organ';
import type { Voice } from '@/content/types';
import { buildTimeline, type TimedNote } from '@/engine/timeline';
import { PitchProcessor } from '@/input/pitch/pitch-processor';

import { OrganRoom, SR, type StopName } from './helpers/organ-room';

/**
 * Avaliação do microfone com acordes reais dos hinos (demora ~5 min):
 *   MIC_EVAL=1 npx jest mic-eval        (MIC_QUICK=1: amostra menor, ~1 min)
 * Mede quantas notas tocadas o app perde e quantas ele “inventa” quando a
 * organista toca só parte do acorde. MIC_HOLD=3 segura o acorde 3 s;
 * MIC_DEBUG=1 lista cada nota inventada; MIC_CAL=1 calibra o timbre antes
 * (Dó3 sozinho com o registro).
 */

const ALL: Voice[] = ['soprano', 'alto', 'tenor', 'bass', 'pedal'];
/** Distâncias (semitons) em que uma nota é harmônico de outra mais grave. */
const OVERTONE_GAPS = [12, 19, 24, 28, 31, 36];
const label = (ns: TimedNote[]) => ns.map((c) => `${(c.voice ?? '?')[0]}${c.midi}`).join(' ');

function chords(hymns: string[], perHymn: number): TimedNote[][] {
  const out: TimedNote[][] = [];
  for (const id of hymns) {
    const tl = buildTimeline(organArrangement(getSong(id)!), { hands: 'both', voices: ALL });
    const byTime = new Map<number, TimedNote[]>();
    for (const n of tl.notes) byTime.set(n.time, [...(byTime.get(n.time) ?? []), n]);
    out.push(...[...byTime.values()].filter((c) => c.length >= 3).slice(0, perHymn));
  }
  return out;
}

let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

/** Calibra o timbre: toca Dó3 sozinho com o registro, como a organista faria. */
function calibrate(stop: StopName): number[] | null {
  const r = new OrganRoom({ seed: 99 });
  const p = new PitchProcessor(SR, () => {});
  let profile: number[] | null = null;
  p.calibrate(48, (x) => (profile = x));
  p.push(r.render(SR * 0.3));
  r.strike(48, stop);
  for (let i = 0; i < 60 && !profile; i++) p.push(r.render(SR * 0.05));
  return profile;
}
const profiles = new Map<StopName, number[] | null>();

/** Toca `played` e devolve as notas que o app marcou (entre as esperadas). */
function run(chord: TimedNote[], played: TimedNote[], stop: StopName, spread: number): Set<string> {
  const r = new OrganRoom({ seed: Math.floor(rnd() * 1e6) });
  const marked = new Set<string>();
  const byMidi = new Map<number, string[]>();
  for (const n of chord) byMidi.set(n.midi, [...(byMidi.get(n.midi) ?? []), n.id]);
  const p = new PitchProcessor(SR, (e) => {
    if (e.type === 'on') for (const id of byMidi.get(e.midi) ?? []) marked.add(id);
  });
  if (process.env.MIC_CAL) {
    if (!profiles.has(stop)) profiles.set(stop, calibrate(stop));
    p.setProfile(profiles.get(stop) ?? null);
  }
  p.setGuide(
    chord.map((n) => ({ id: n.id, midi: n.midi, pedal: n.voice === 'pedal' })),
    chord.map((n) => n.midi),
  );
  p.push(r.render(SR * 0.3));
  for (const n of played) {
    const pedal = n.voice === 'pedal';
    r.strike(n.midi, pedal ? 'flauta' : stop, pedal ? -1 : 0, 1, (rnd() - 0.5) * 2 * spread);
  }
  const hold = Number(process.env.MIC_HOLD ?? 1);
  for (let i = 0; i < 20 * hold; i++) p.push(r.render(SR * 0.05));
  return marked;
}

(process.env.MIC_EVAL ? describe : describe.skip)('avaliação do microfone', () => {
  it('acordes dos hinos', () => {
    const quick = !!process.env.MIC_QUICK;
    const set = chords(['hino-001', 'hino-005', 'hino-050', 'hino-131', 'hino-158', 'hino-235', 'hino-357', 'hino-460'], quick ? 3 : 6);
    const rows: string[] = [];
    const why = new Map<string, number>();
    for (const stop of ['principal', 'cheio'] as StopName[]) {
      for (const spread of quick ? [2] : [0, 4]) {
        let fullMiss = 0;
        let fullTotal = 0;
        let fp = 0;
        let fpChances = 0;
        let partMiss = 0;
        let partTotal = 0;
        for (const chord of set) {
          const all = run(chord, chord, stop, spread);
          fullTotal += chord.length;
          fullMiss += chord.filter((n) => !all.has(n.id)).length;
          for (const n of chord.filter((x) => !all.has(x.id))) {
            const ivs = chord.filter((m) => m.midi < n.midi).map((m) => n.midi - m.midi).filter((d) => OVERTONE_GAPS.includes(d));
            const key = `perdeu ${n.voice}:${ivs.length ? Math.min(...ivs) : '-'}`;
            why.set(key, (why.get(key) ?? 0) + 1);
          }
          // Só parte do acorde: o baixo sozinho, e o acorde sem o soprano.
          const bass = chord.filter((n) => n.voice === 'bass');
          const noSoprano = chord.filter((n) => n.voice !== 'soprano');
          for (const played of [bass, noSoprano]) {
            if (!played.length) continue;
            const ids = new Set(played.map((n) => n.id));
            const midis = new Set(played.map((n) => n.midi));
            const got = run(chord, played, stop, spread);
            // Nota com a mesma altura de uma tocada é a mesma tecla: vale.
            const wrong = chord.filter((n) => !ids.has(n.id) && !midis.has(n.midi));
            fpChances += wrong.length;
            fp += wrong.filter((n) => got.has(n.id)).length;
            for (const n of wrong.filter((w) => got.has(w.id))) {
              if (process.env.MIC_DEBUG) console.log(stop, 'inventou', n.voice, n.midi, 'acorde', label(chord), 'tocou', label(played));
              // Distância até a nota tocada de que ela seria harmônico (99 = nenhuma).
              const ivs = played.map((m) => n.midi - (m.voice === 'pedal' ? m.midi - 12 : m.midi)).filter((d) => d > 0);
              const key = ivs.length ? String(Math.min(...ivs.filter((d) => OVERTONE_GAPS.includes(d)), 99)) : 'abaixo';
              why.set(`${n.voice}:${key}`, (why.get(`${n.voice}:${key}`) ?? 0) + 1);
            }
            partTotal += played.length;
            partMiss += played.filter((n) => !got.has(n.id)).length;
          }
        }
        rows.push(
          `${stop.padEnd(9)} desafinação ±${spread}c | acorde inteiro perdeu ${fullMiss}/${fullTotal} | ` +
            `parte do acorde: inventou ${fp}/${fpChances}, perdeu ${partMiss}/${partTotal}`,
        );
      }
    }
    console.log(rows.join('\n') + '\nintervalo até a nota tocada (semitons): ' + JSON.stringify([...why]));
    expect(rows.length).toBeGreaterThan(0);
  });
});
