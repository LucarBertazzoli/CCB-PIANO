import { describe, expect, it } from '@jest/globals';

import { parseVoice, twoHands } from '@/content/notation';
import { diatonicStep, frequencyToMidi, isBlackKey, midiToFrequency, noteName, parseNoteName } from '@/music/theory';

describe('teoria', () => {
  it('converte nomes de notas', () => {
    expect(parseNoteName('C4')).toBe(60);
    expect(parseNoteName('A4')).toBe(69);
    expect(parseNoteName('F#3')).toBe(54);
    expect(parseNoteName('Bb2')).toBe(46);
    expect(() => parseNoteName('H2')).toThrow();
  });

  it('nomeia em solfejo e letras', () => {
    expect(noteName(60)).toBe('Dó');
    expect(noteName(61, 'letters')).toBe('C♯');
    expect(noteName(70, 'solfege', { preferFlats: true })).toBe('Si♭');
    expect(noteName(60, 'solfege', { withOctave: true })).toBe('Dó4');
  });

  it('frequência ida e volta', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440);
    expect(frequencyToMidi(261.63)).toBeCloseTo(60, 1);
  });

  it('teclas pretas e posição na pauta', () => {
    expect(isBlackKey(61)).toBe(true);
    expect(isBlackKey(64)).toBe(false);
    expect(diatonicStep(64)).toEqual({ step: 30, accidental: 0 });
    expect(diatonicStep(66)).toEqual({ step: 31, accidental: 1 });
  });
});

describe('notação textual', () => {
  it('lê notas, durações, pausas, acordes e dedos', () => {
    const notes = parseVoice('C4/q:1 D4 r/h [C3 E3 G3]/w:5,3,1 E4/q.', { hand: 'right' });
    expect(notes.map((n) => [n.midi, n.start, n.duration])).toEqual([
      [60, 0, 1],
      [62, 1, 1],
      [48, 4, 4],
      [52, 4, 4],
      [55, 4, 4],
      [64, 8, 1.5],
    ]);
    expect(notes[0].finger).toBe(1);
    expect(notes.slice(2, 5).map((n) => n.finger)).toEqual([5, 3, 1]);
  });

  it('junta duas mãos em ordem', () => {
    const notes = twoHands('E4/h', 'C3/h');
    expect(notes.map((n) => n.hand)).toEqual(['left', 'right']);
    expect(new Set(notes.map((n) => n.id)).size).toBe(2);
  });
});
