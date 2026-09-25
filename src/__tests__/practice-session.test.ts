import { describe, expect, it } from '@jest/globals';

import type { Song } from '@/content/types';
import { twoHands } from '@/content/notation';
import { PracticeSession, type SessionEvent } from '@/engine/practice-session';
import { buildTimeline } from '@/engine/timeline';

const song: Song = {
  id: 't',
  kind: 'exercise',
  title: 'teste',
  tempo: 60, // 1 batida = 1 s
  timeSignature: [4, 4],
  keySignature: 0,
  difficulty: 1,
  instruments: ['piano'],
  notes: twoHands('C4/q D4 [E4 G4]/h', 'C3/w'),
};

function run(session: PracticeSession, seconds: number, step = 1 / 60) {
  for (let t = 0; t < seconds; t += step) session.tick(step);
}

describe('PracticeSession — modo espera', () => {
  it('para na nota e espera o aluno', () => {
    const s = new PracticeSession({ timeline: buildTimeline(song, { hands: 'right' }), mode: 'wait', leadIn: 1 });
    s.start();
    run(s, 3);
    expect(s.status).toBe('waiting');
    expect(s.time).toBeCloseTo(0);
    expect(s.expectedNotes().map((n) => n.midi)).toEqual([60]);

    s.noteOn(61); // errada
    expect(s.status).toBe('waiting');
    s.noteOn(60);
    expect(s.status).toBe('playing');

    run(s, 2);
    expect(s.expectedNotes().map((n) => n.midi)).toEqual([62]);
    s.noteOn(62);
    run(s, 2);
    // Acorde: precisa das duas notas.
    s.noteOn(64);
    expect(s.status).toBe('waiting');
    s.noteOn(67);
    expect(s.status).toBe('playing');
    run(s, 4);
    expect(s.status).toBe('finished');
    const score = s.score();
    expect(score.hits).toBe(4);
    expect(score.wrong).toBe(1);
  });

  it('com microfone (policy any) basta uma nota do acorde', () => {
    const s = new PracticeSession({
      timeline: buildTimeline(song, { hands: 'right', startBeat: 2 }),
      mode: 'wait',
      leadIn: 0.5,
      chordPolicy: 'any',
    });
    s.start();
    run(s, 1);
    s.noteOn(67);
    expect(s.status).toBe('playing');
  });

  it('toca a outra mão sozinha como acompanhamento', () => {
    const events: SessionEvent[] = [];
    const s = new PracticeSession({ timeline: buildTimeline(song, { hands: 'right' }), mode: 'wait', leadIn: 0.5 });
    s.subscribe((e) => events.push(e));
    s.start();
    run(s, 1);
    expect(events.some((e) => e.type === 'auto' && e.note.midi === 48)).toBe(true);
  });
});

describe('PracticeSession — modo ritmo', () => {
  it('pontua acertos no tempo e marca perdidas', () => {
    const s = new PracticeSession({ timeline: buildTimeline(song, { hands: 'right' }), mode: 'rhythm', leadIn: 1 });
    s.start();
    run(s, 1.02); // t ≈ 0
    s.noteOn(60); // perfeito
    run(s, 1.1); // t ≈ 1.1
    s.noteOn(62); // bom (0.1s atrasado)
    run(s, 4); // deixa o acorde passar
    expect(s.status).toBe('finished');
    const score = s.score();
    expect(score.hits).toBe(2);
    expect(score.perfect).toBe(1);
    expect(score.missed).toBe(2);
    expect(score.stars).toBe(0);
  });

  it('respeita a latência da entrada', () => {
    const s = new PracticeSession({
      timeline: buildTimeline(song, { hands: 'right' }),
      mode: 'rhythm',
      leadIn: 1,
      inputLatency: 0.15,
    });
    s.start();
    run(s, 1.15);
    s.noteOn(60);
    expect(s.score().perfect).toBe(1);
  });
});

describe('timeline', () => {
  it('aplica andamento e trecho', () => {
    const tl = buildTimeline(song, { hands: 'both', tempoFactor: 0.5, startBeat: 1, endBeat: 4 });
    expect(tl.secondsPerBeat).toBe(2);
    expect(tl.notes.map((n) => n.midi)).toEqual([62, 64, 67]);
    expect(tl.notes[0].time).toBe(0);
    expect(tl.duration).toBe(6);
  });
});
