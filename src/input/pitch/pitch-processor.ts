import { NoteTracker } from './note-tracker';
import { detectPitch } from './yin';

import type { NoteEmitter } from '../types';

export const MIC_FRAME_SIZE = 2048;

/**
 * Recebe blocos de áudio do microfone (qualquer tamanho), analisa em quadros
 * e emite notas. Compartilhado entre web e nativo.
 */
export class PitchProcessor {
  readonly tracker = new NoteTracker({ minMidi: 28, maxMidi: 100 });
  private frame = new Float32Array(MIC_FRAME_SIZE);
  private filled = 0;
  /** Último volume medido, útil para o medidor na tela de ajustes. */
  lastRms = 0;
  lastMidi: number | null = null;

  constructor(
    private sampleRate: number,
    private emit: NoteEmitter,
    private hop = MIC_FRAME_SIZE / 2,
  ) {}

  setSensitivity(minRms: number): void {
    this.tracker.setMinRms(minRms);
  }

  push(samples: Float32Array): void {
    let offset = 0;
    while (offset < samples.length) {
      const n = Math.min(samples.length - offset, MIC_FRAME_SIZE - this.filled);
      this.frame.set(samples.subarray(offset, offset + n), this.filled);
      this.filled += n;
      offset += n;
      if (this.filled === MIC_FRAME_SIZE) {
        this.analyse();
        // Mantém sobreposição de metade do quadro para reagir mais rápido.
        this.frame.copyWithin(0, this.hop);
        this.filled = MIC_FRAME_SIZE - this.hop;
      }
    }
  }

  private analyse(): void {
    const result = detectPitch(this.frame, { sampleRate: this.sampleRate, minFrequency: 60 });
    this.lastRms = result.rms;
    for (const ev of this.tracker.push(result)) {
      this.emit({ type: ev.type, midi: ev.midi, velocity: ev.type === 'on' ? 0.8 : 0, source: 'mic' });
    }
    this.lastMidi = this.tracker.activeNote;
  }

  flush(): void {
    for (const ev of this.tracker.reset()) {
      this.emit({ type: ev.type, midi: ev.midi, velocity: 0, source: 'mic' });
    }
  }
}
