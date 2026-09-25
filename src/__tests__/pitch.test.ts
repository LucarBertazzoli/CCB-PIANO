import { describe, expect, it } from '@jest/globals';

import { NoteTracker } from '@/input/pitch/note-tracker';
import { PitchProcessor } from '@/input/pitch/pitch-processor';
import { detectPitch } from '@/input/pitch/yin';
import type { NoteInputEvent } from '@/input/types';
import { midiToFrequency } from '@/music/theory';

const SR = 44100;

function tone(freq: number, length: number, amp = 0.4, harmonics = true): Float32Array {
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const t = i / SR;
    let v = Math.sin(2 * Math.PI * freq * t);
    if (harmonics) v += 0.5 * Math.sin(4 * Math.PI * freq * t) + 0.25 * Math.sin(6 * Math.PI * freq * t);
    out[i] = amp * v * (harmonics ? 0.57 : 1);
  }
  return out;
}

describe('YIN', () => {
  it.each([48, 55, 60, 64, 69, 76, 84])('detecta a nota MIDI %i', (midi) => {
    const r = detectPitch(tone(midiToFrequency(midi), 2048), { sampleRate: SR, minFrequency: 60 });
    expect(r.frequency).not.toBeNull();
    expect(12 * Math.log2(r.frequency! / midiToFrequency(midi))).toBeCloseTo(0, 0);
  });

  it('não inventa nota no silêncio/ruído', () => {
    const noise = new Float32Array(2048).map(() => (Math.random() - 0.5) * 0.001);
    const tracker = new NoteTracker();
    const r = detectPitch(noise, { sampleRate: SR });
    expect(tracker.push(r)).toEqual([]);
  });
});

describe('PitchProcessor', () => {
  it('emite nota ligada e desligada a partir do áudio', () => {
    const events: NoteInputEvent[] = [];
    const p = new PitchProcessor(SR, (e) => events.push(e));
    const note = tone(midiToFrequency(67), SR * 0.3);
    for (let i = 0; i < note.length; i += 512) p.push(note.subarray(i, i + 512));
    const silence = new Float32Array(SR * 0.2);
    for (let i = 0; i < silence.length; i += 512) p.push(silence.subarray(i, i + 512));
    expect(events.map((e) => `${e.type}:${e.midi}`)).toEqual(['on:67', 'off:67']);
  });
});
