import { frequencyToMidi } from '@/music/theory';

import type { PitchResult } from './yin';

export type TrackerEvent = { type: 'on' | 'off'; midi: number };

export interface NoteTrackerOptions {
  /** Volume mínimo (RMS) para considerar som. */
  minRms?: number;
  /** Clareza mínima do YIN. */
  minClarity?: number;
  /** Quadros seguidos com a mesma nota para confirmá-la. */
  stableFrames?: number;
  /** Aumento relativo de volume que indica novo ataque (nota repetida). */
  onsetRatio?: number;
  /** Limites do teclado. */
  minMidi?: number;
  maxMidi?: number;
  /** Tolerância de afinação em semitons (0.5 = qualquer desvio). */
  centsTolerance?: number;
}

/**
 * Converte a sequência de estimativas de pitch (uma por quadro) em eventos
 * estáveis de nota ligada/desligada, filtrando ruído e oitavas instáveis.
 */
export class NoteTracker {
  private opts: Required<NoteTrackerOptions>;
  private current: number | null = null;
  private candidate: number | null = null;
  private candidateCount = 0;
  private prevRms = 0;
  private silentFrames = 0;

  constructor(opts: NoteTrackerOptions = {}) {
    this.opts = {
      minRms: opts.minRms ?? 0.01,
      minClarity: opts.minClarity ?? 0.85,
      stableFrames: opts.stableFrames ?? 2,
      onsetRatio: opts.onsetRatio ?? 1.8,
      minMidi: opts.minMidi ?? 21,
      maxMidi: opts.maxMidi ?? 108,
      centsTolerance: opts.centsTolerance ?? 0.4,
    };
  }

  setMinRms(value: number): void {
    this.opts.minRms = value;
  }

  get activeNote(): number | null {
    return this.current;
  }

  push(p: PitchResult): TrackerEvent[] {
    const out: TrackerEvent[] = [];
    const o = this.opts;
    const onset = this.prevRms > 0 && p.rms > this.prevRms * o.onsetRatio && p.rms > o.minRms * 2;
    this.prevRms = p.rms;

    let midi: number | null = null;
    if (p.frequency && p.rms >= o.minRms && p.clarity >= o.minClarity) {
      const exact = frequencyToMidi(p.frequency);
      const rounded = Math.round(exact);
      if (Math.abs(exact - rounded) <= o.centsTolerance && rounded >= o.minMidi && rounded <= o.maxMidi) {
        midi = rounded;
      }
    }

    if (midi === null) {
      if (p.rms < o.minRms) this.silentFrames++;
      // Solta a nota após alguns quadros de silêncio.
      if (this.current !== null && this.silentFrames >= 2) {
        out.push({ type: 'off', midi: this.current });
        this.current = null;
      }
      this.candidate = null;
      this.candidateCount = 0;
      return out;
    }
    this.silentFrames = 0;

    // Mesma nota tocada de novo (novo ataque): solta e reativa.
    if (midi === this.current) {
      if (onset) {
        out.push({ type: 'off', midi }, { type: 'on', midi });
      }
      return out;
    }

    if (midi === this.candidate) this.candidateCount++;
    else {
      this.candidate = midi;
      this.candidateCount = 1;
    }

    if (this.candidateCount >= o.stableFrames) {
      if (this.current !== null) out.push({ type: 'off', midi: this.current });
      this.current = midi;
      out.push({ type: 'on', midi });
      this.candidate = null;
      this.candidateCount = 0;
    }
    return out;
  }

  reset(): TrackerEvent[] {
    const out: TrackerEvent[] = this.current !== null ? [{ type: 'off', midi: this.current }] : [];
    this.current = null;
    this.candidate = null;
    this.candidateCount = 0;
    this.prevRms = 0;
    return out;
  }
}
