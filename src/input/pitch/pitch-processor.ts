import { ChordListener } from './chord-listener';
import { Spectrum } from './fft';
import { NoteTracker } from './note-tracker';
import { detectPitch, rms } from './yin';

import type { GuideNote, NoteEmitter } from '../types';

/** Bloco que o microfone entrega por vez. */
export const MIC_FRAME_SIZE = 2048;
/** Janelas da análise de acordes: longa (graves), média e curta (ataques). */
const SPECTRUM_SIZE = 8192;
const MID_SIZE = 4096;
const SHORT_SIZE = 2048;
const HOP = 1024;

/**
 * Recebe o áudio do microfone (blocos de qualquer tamanho) e emite notas.
 *
 * - Com um hino tocando, o app passa as notas esperadas (`setGuide`) e o
 *   `ChordListener` confere cada uma no espectro — funciona com acordes,
 *   pedaleira e registros de órgão.
 * - Sem guia (ex.: teste do microfone), usa o YIN, que acha uma nota por vez.
 */
export class PitchProcessor {
  readonly tracker = new NoteTracker({ minMidi: 28, maxMidi: 100 });
  readonly listener: ChordListener;
  private spectrum = new Spectrum(SPECTRUM_SIZE);
  private midSpectrum = new Spectrum(MID_SIZE);
  private shortSpectrum = new Spectrum(SHORT_SIZE);
  private ring = new Float32Array(SPECTRUM_SIZE);
  private frame = new Float32Array(SPECTRUM_SIZE);
  private recent = new Float32Array(MIC_FRAME_SIZE);
  private write = 0;
  private sinceHop = 0;
  private total = 0;
  private guided = false;
  /** Último volume medido (medidor na tela). */
  lastRms = 0;
  lastMidi: number | null = null;

  constructor(
    private sampleRate: number,
    private emit: NoteEmitter,
  ) {
    this.listener = new ChordListener({
      sampleRate,
      sizes: { long: SPECTRUM_SIZE, mid: MID_SIZE, short: SHORT_SIZE },
    });
  }

  setSensitivity(minRms: number): void {
    this.tracker.setMinRms(minRms);
  }

  /**
   * Notas que o aluno deve tocar agora. `null` = sem hino tocando (modo livre);
   * lista vazia = hino tocando, mas nada esperado neste instante.
   */
  setGuide(notes: GuideNote[] | null): void {
    const guided = notes !== null;
    if (guided !== this.guided) {
      // Troca de modo: solta o que estiver ligado no modo anterior.
      if (guided) this.flushTracker();
      this.guided = guided;
    }
    for (const ev of this.listener.setGuide(notes ?? [])) this.send(ev.type, ev.midi);
  }

  push(samples: Float32Array): void {
    for (let i = 0; i < samples.length; i++) {
      this.ring[this.write] = samples[i];
      this.write = (this.write + 1) % SPECTRUM_SIZE;
      this.total++;
      if (++this.sinceHop >= HOP) {
        this.sinceHop = 0;
        if (this.total >= MIC_FRAME_SIZE) this.analyse();
      }
    }
  }

  private analyse(): void {
    // Últimas 2048 amostras (volume e YIN).
    for (let i = 0; i < MIC_FRAME_SIZE; i++) {
      this.recent[i] = this.ring[(this.write - MIC_FRAME_SIZE + i + SPECTRUM_SIZE) % SPECTRUM_SIZE];
    }
    const level = rms(this.recent);
    this.lastRms = level;

    if (this.guided) {
      if (this.listener.guide.length === 0 || this.total < SPECTRUM_SIZE / 2) return;
      for (let i = 0; i < SPECTRUM_SIZE; i++) this.frame[i] = this.ring[(this.write + i) % SPECTRUM_SIZE];
      const spectra = {
        long: this.spectrum.compute(this.frame),
        mid: this.midSpectrum.compute(this.frame.subarray(SPECTRUM_SIZE - MID_SIZE)),
        short: this.shortSpectrum.compute(this.recent),
      };
      for (const ev of this.listener.process(spectra, level >= this.tracker.minRms)) this.send(ev.type, ev.midi);
      return;
    }

    const result = detectPitch(this.recent, { sampleRate: this.sampleRate, minFrequency: 60 });
    for (const ev of this.tracker.push(result)) this.send(ev.type, ev.midi);
    this.lastMidi = this.tracker.activeNote;
  }

  private send(type: 'on' | 'off', midi: number): void {
    if (type === 'on') this.lastMidi = midi;
    this.emit({ type, midi, velocity: type === 'on' ? 0.8 : 0, source: 'mic' });
  }

  private flushTracker(): void {
    for (const ev of this.tracker.reset()) this.send(ev.type, ev.midi);
  }

  flush(): void {
    this.flushTracker();
    for (const ev of this.listener.setGuide([])) this.send(ev.type, ev.midi);
  }
}
