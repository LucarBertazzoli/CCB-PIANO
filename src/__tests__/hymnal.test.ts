import { describe, expect, it } from '@jest/globals';

import { getSong } from '@/content';
import { hymnIndex, loadHymn } from '@/content/hymnal';
import { organArrangement } from '@/content/organ';
import type { Voice } from '@/content/types';
import { buildTimeline } from '@/engine/timeline';

const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const name = (m: number) => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;

function voiceIn(song: ReturnType<typeof loadHymn>, voice: Voice, from: number, to: number) {
  return song!.notes
    .filter((n) => n.voice === voice && n.start >= from && n.start < to)
    .sort((a, b) => a.start - b.start)
    .map((n) => `${name(n.midi)}/${n.duration}`);
}

describe('hinário importado', () => {
  it('tem os 480 hinos e 6 coros', () => {
    expect(hymnIndex.filter((h) => h.kind === 'hino')).toHaveLength(480);
    expect(hymnIndex.filter((h) => h.kind === 'coro')).toHaveLength(6);
  });

  it('hino 1: dados conferidos com o hinário de órgão', () => {
    const h = getSong('hino-001')!;
    expect(h.title).toBe('Cristo, meu Mestre');
    expect(h.keySignature).toBe(-3);
    expect(h.timeSignature).toEqual([4, 4]);
    expect(h.tempoMark).toMatchObject({ unit: 'q', min: 56, max: 66 });
    // Compasso 1, 4 vozes (versão cantada)
    expect(voiceIn(h, 'soprano', 0, 4)).toEqual(['G4/1', 'G4/0.5', 'G4/0.5', 'Bb4/1', 'Bb4/1']);
    expect(voiceIn(h, 'alto', 0, 4)).toEqual(['Eb4/1', 'Eb4/0.5', 'Eb4/0.5', 'F4/1', 'Bb3/1']);
    expect(voiceIn(h, 'tenor', 0, 4)).toEqual(['Bb3/1', 'Bb3/0.5', 'Bb3/0.5', 'Bb3/1', 'F3/1']);
    expect(voiceIn(h, 'bass', 0, 4)).toEqual(['Eb3/1', 'Eb3/0.5', 'Eb3/0.5', 'D3/1', 'D3/1']);
  });

  it('hino 1: arranjo de órgão igual ao hinário da organista (compasso 1)', () => {
    const o = organArrangement(getSong('hino-001')!);
    expect(voiceIn(o, 'soprano', 0, 4)).toEqual(['G4/1', 'G4/0.5', 'G4/0.5', 'Bb4/1', 'Bb4/1']);
    expect(voiceIn(o, 'alto', 0, 4)).toEqual(['Eb4/2', 'F4/1', 'Bb3/1']);
    expect(voiceIn(o, 'tenor', 0, 4)).toEqual(['Bb3/3', 'F3/1']);
    expect(voiceIn(o, 'bass', 0, 4)).toEqual(['Eb3/2', 'D3/2']);
    expect(voiceIn(o, 'pedal', 0, 4)).toEqual(['Eb2/2', 'D2/2']);
  });

  it('hino 5 (6/8): pedal em semínimas pontuadas, como no hinário', () => {
    const o = organArrangement(getSong('hino-005')!);
    expect(o.tempoMark).toMatchObject({ unit: 'e', min: 112, max: 144 });
    expect(voiceIn(o, 'pedal', 0, 3)).toEqual(['Ab2/1.5', 'Ab2/1.5']);
  });

  it('linhas viram trechos e os compassos do hinário viram barras', () => {
    const h = getSong('hino-001')!;
    expect(h.sections?.map((s) => s.label)).toEqual(['1ª linha', '2ª linha', '3ª linha', '4ª linha']);
    const tl = buildTimeline(h, { hands: 'both' });
    expect(tl.measureStarts.slice(0, 4)).toEqual([0, 4, 8, 10]);
    expect(tl.lineStarts).toEqual([0, 10, 20, 28]);
    // A pedaleira só é ativa quando escolhida
    const tlo = buildTimeline(organArrangement(h), { hands: 'both' });
    expect(tlo.notes.some((n) => n.voice === 'pedal' && n.active)).toBe(false);
    const tlp = buildTimeline(organArrangement(h), { hands: 'both', voices: ['pedal'] });
    expect(tlp.notes.filter((n) => n.active).every((n) => n.voice === 'pedal')).toBe(true);
  });
});
