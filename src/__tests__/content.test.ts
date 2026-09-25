import { describe, expect, it } from '@jest/globals';

import { allCourses, allSongs, getSong } from '@/content';
import { fitRange, keyboardLayout } from '@/components/keyboard-layout';

describe('catálogo', () => {
  it('toda lição aponta para músicas existentes e trechos válidos', () => {
    for (const course of allCourses()) {
      for (const unit of course.units) {
        for (const lesson of unit.lessons) {
          for (const step of lesson.steps) {
            if ('songId' in step) {
              const song = getSong(step.songId);
              expect(song).toBeDefined();
              if ('sectionId' in step && step.sectionId) expect(song!.sections?.some((s) => s.id === step.sectionId)).toBe(true);
            }
            if (step.type === 'quiz') {
              for (const q of step.questions) expect(q.answer).toBeLessThan(q.options.length);
            }
            if (step.type === 'listen') {
              for (const r of step.rounds) {
                expect(r.answer).toBeLessThan(r.options.length);
                expect(r.sounds.length).toBeGreaterThan(0);
              }
            }
            if (step.type === 'rhythm') expect(getSong(step.songId)?.tags).toContain('ritmo');
          }
        }
      }
    }
  });

  it('músicas têm notas válidas e compassos completos', () => {
    for (const song of allSongs()) {
      expect(song.notes.length).toBeGreaterThan(0);
      for (const n of song.notes) {
        expect(n.midi).toBeGreaterThanOrEqual(21);
        expect(n.midi).toBeLessThanOrEqual(108);
      }
      const beatsPerBar = song.timeSignature[0] * (4 / song.timeSignature[1]);
      for (const hand of ['right', 'left'] as const) {
        const notes = song.notes.filter((n) => n.hand === hand);
        if (!notes.length) continue;
        const rests = (song.rests ?? []).filter((r) => r.hand === hand);
        const end = Math.max(...[...notes, ...rests].map((n) => n.start + n.duration));
        expect([song.id, hand, end % beatsPerBar]).toEqual([song.id, hand, 0]);
      }
    }
  });
});

describe('layout do teclado', () => {
  it('ajusta a extensão cobrindo as notas, com o mínimo de teclas', () => {
    const [low, high] = fitRange(60, 67, 15);
    expect(low).toBeLessThanOrEqual(60);
    expect(high).toBeGreaterThanOrEqual(67);
    const layout = keyboardLayout(low, high, 900);
    expect(layout.keys.filter((k) => !k.black)).toHaveLength(15);
    const c = layout.byMidi.get(60)!;
    const cs = layout.byMidi.get(61)!;
    expect(cs.x).toBeGreaterThan(c.x);
    expect(cs.x).toBeLessThan(c.x + c.width);
  });
});
