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
/** Subida de volume que conta como ataque, e saltos (~23 ms) para assentar. */
const ATTACK_RISE = 1.4;
const SETTLE_HOPS = 2;
/** Quadros (~23 ms cada) medidos na calibração do timbre. */
const CALIBRATION_FRAMES = 40;

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

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
  private previous = new Float32Array(MIC_FRAME_SIZE);
  /** Saltos de análise desde o último ataque (tecla apertada). */
  private sinceAttack = 99;
  /** Calibração do timbre em andamento: nota tocada e medidas por quadro. */
  private calibration: { midi: number; samples: number[][]; done: (profile: number[] | null) => void } | null = null;
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

  /**
   * Calibra o timbre do órgão: a organista toca e segura `midi` sozinha com o
   * registro que vai usar. Depois de ~1 s de som estável, `done` recebe o
   * timbre (ou null se não deu para medir) e o reconhecimento passa a usá-lo.
   */
  calibrate(midi: number, done: (profile: number[] | null) => void): void {
    // Registro novo: o timbre aprendido antes não vale mais.
    this.listener.learned.clear();
    this.calibration = { midi, samples: [], done };
  }

  setProfile(profile: number[] | null): void {
    this.listener.profile = profile;
  }

  setSensitivity(minRms: number): void {
    this.tracker.setMinRms(minRms);
  }

  /**
   * Notas que o aluno deve tocar agora. `null` = sem hino tocando (modo livre);
   * lista vazia = hino tocando, mas nada esperado neste instante.
   */
  setGuide(notes: GuideNote[] | null, context: number[] = []): void {
    this.listener.setContext(context);
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
    // Ataque: o volume subiu bem em relação ao bloco anterior. Nos primeiros
    // instantes de um ataque o som se espalha por frequências vizinhas e
    // parece ter notas que não estão lá; espera assentar (~50 ms).
    for (let i = 0; i < MIC_FRAME_SIZE; i++) {
      this.previous[i] = this.ring[(this.write - 2 * MIC_FRAME_SIZE + i + 2 * SPECTRUM_SIZE) % SPECTRUM_SIZE];
    }
    const before = rms(this.previous);
    this.sinceAttack = level >= this.tracker.minRms && level > before * ATTACK_RISE ? 0 : this.sinceAttack + 1;

    if (this.calibration && this.total >= SPECTRUM_SIZE && level >= this.tracker.minRms && this.sinceAttack >= SETTLE_HOPS + 4) {
      for (let i = 0; i < SPECTRUM_SIZE; i++) this.frame[i] = this.ring[(this.write + i) % SPECTRUM_SIZE];
      const c = this.calibration;
      const p = this.listener.measureProfile(
        { long: this.spectrum.compute(this.frame), mid: new Float32Array(0), short: new Float32Array(0) },
        c.midi,
      );
      if (p) c.samples.push(p);
      if (c.samples.length >= CALIBRATION_FRAMES) {
        // Mediana de cada harmônico (aguenta um quadro ruim).
        const profile = p ? p.map((_, h) => median(c.samples.map((x) => x[h]))) : null;
        this.calibration = null;
        this.listener.profile = profile;
        c.done(profile);
      }
      return;
    }

    if (this.guided) {
      if (this.listener.guide.length === 0 || this.total < SPECTRUM_SIZE / 2) return;
      for (let i = 0; i < SPECTRUM_SIZE; i++) this.frame[i] = this.ring[(this.write + i) % SPECTRUM_SIZE];
      const spectra = {
        long: this.spectrum.compute(this.frame),
        mid: this.midSpectrum.compute(this.frame.subarray(SPECTRUM_SIZE - MID_SIZE)),
        short: this.shortSpectrum.compute(this.recent),
      };
      const settled = this.sinceAttack >= SETTLE_HOPS;
      for (const ev of this.listener.process(spectra, level >= this.tracker.minRms, settled)) this.send(ev.type, ev.midi);
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
