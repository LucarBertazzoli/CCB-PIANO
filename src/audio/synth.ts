import { AudioContext, type GainNode, type OscillatorNode } from 'react-native-audio-api';

import type { Instrument } from '@/content/types';
import { midiToFrequency } from '@/music/theory';

interface Voice {
  oscillators: OscillatorNode[];
  gain: GainNode;
  instrument: Instrument;
}

/** Harmônicos (múltiplo da fundamental, volume) de cada timbre. */
const PARTIALS: Record<Instrument, [number, number, 'sine' | 'triangle'][]> = {
  // Piano: fundamental "triangular" + brilho que decai.
  piano: [
    [1, 0.6, 'triangle'],
    [2, 0.18, 'sine'],
    [3, 0.06, 'sine'],
  ],
  // Órgão: registros tipo 8', 4', 2 2/3' e 2'.
  organ: [
    [1, 0.45, 'sine'],
    [2, 0.3, 'sine'],
    [3, 0.14, 'sine'],
    [4, 0.1, 'sine'],
  ],
};

/**
 * Sintetizador simples de piano/órgão. Não depende de arquivos de áudio,
 * então funciona offline e no navegador. No futuro pode ser trocado por
 * samples reais mantendo a mesma interface.
 */
class Synth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private voices = new Map<number, Voice[]>();
  instrument: Instrument = 'piano';
  volume = 0.8;
  enabled = true;

  private ensure(): AudioContext | null {
    if (!this.enabled) return null;
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.volume * 0.35;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      // Sem áudio disponível (ex.: testes). O app continua funcionando mudo.
      this.enabled = false;
      return null;
    }
  }

  /** Chamar num toque do usuário para liberar o áudio no navegador/iOS. */
  unlock(): void {
    this.ensure();
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.master) this.master.gain.value = v * 0.35;
  }

  noteOn(midi: number, velocity = 0.8, instrument: Instrument = this.instrument): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    const freq = midiToFrequency(midi);
    const gain = ctx.createGain();
    const peak = 0.25 + velocity * 0.55;
    gain.gain.setValueAtTime(0.0001, now);

    if (instrument === 'piano') {
      gain.gain.linearRampToValueAtTime(peak, now + 0.005);
      // Notas graves soam por mais tempo.
      const decay = 1.2 + Math.max(0, (84 - midi) / 24) * 1.8;
      gain.gain.exponentialRampToValueAtTime(0.0008, now + decay);
    } else {
      gain.gain.linearRampToValueAtTime(peak * 0.8, now + 0.03);
    }
    gain.connect(this.master);

    const oscillators = PARTIALS[instrument].map(([mult, level, type]) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq * mult;
      const g = ctx.createGain();
      g.gain.value = level;
      osc.connect(g);
      g.connect(gain);
      osc.start(now);
      return osc;
    });

    const list = this.voices.get(midi) ?? [];
    list.push({ oscillators, gain, instrument });
    this.voices.set(midi, list);
  }

  noteOff(midi: number): void {
    const ctx = this.ctx;
    const list = this.voices.get(midi);
    if (!ctx || !list?.length) return;
    const voice = list.shift()!;
    const now = ctx.currentTime;
    const release = voice.instrument === 'piano' ? 0.25 : 0.08;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.0001), now);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + release);
    for (const osc of voice.oscillators) osc.stop(now + release + 0.02);
  }

  /** Toca uma nota por um tempo fixo (acompanhamento e demonstração). */
  play(midi: number, seconds: number, velocity = 0.6, instrument?: Instrument): void {
    this.noteOn(midi, velocity, instrument);
    setTimeout(() => this.noteOff(midi), Math.max(80, seconds * 1000 * 0.95));
  }

  /** Clique curto do metrônomo. */
  click(accent = false): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = accent ? 1760 : 1320;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  allNotesOff(): void {
    for (const midi of [...this.voices.keys()]) {
      while (this.voices.get(midi)?.length) this.noteOff(midi);
    }
  }
}

export const synth = new Synth();
