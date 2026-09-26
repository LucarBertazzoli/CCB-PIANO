import {
  AudioContext,
  type AudioBuffer,
  type AudioScheduledSourceNode,
  type GainNode,
  type PeriodicWave,
} from 'react-native-audio-api';

import type { Instrument } from '@/content/types';
import { midiToFrequency } from '@/music/theory';

/**
 * Som do app.
 *
 * - Piano: gravações reais de um piano de cauda (Salamander Grand Piano,
 *   Yamaha C5, CC BY 3.0 — ver assets/audio/piano/LICENSE.txt). Há uma
 *   gravação a cada 3 semitons; as notas do meio mudam só um pouquinho a
 *   velocidade de reprodução, como fazem os pianos digitais.
 * - Órgão: tubos sintetizados como num órgão de igreja — Principal 8' com
 *   Oitava 4' e Quinzena 2', duas fileiras levemente desafinadas (coro), o
 *   "sopro" do ataque do tubo, Subbaixo 16' nos graves (pedaleira) e a
 *   reverberação da nave.
 */

// Uma gravação a cada 3 semitons (A0 = 21 … C8 = 108).
const PIANO_SAMPLES: Record<number, unknown> = {
  21: require('../../assets/audio/piano/A0.mp3'),
  24: require('../../assets/audio/piano/C1.mp3'),
  27: require('../../assets/audio/piano/Ds1.mp3'),
  30: require('../../assets/audio/piano/Fs1.mp3'),
  33: require('../../assets/audio/piano/A1.mp3'),
  36: require('../../assets/audio/piano/C2.mp3'),
  39: require('../../assets/audio/piano/Ds2.mp3'),
  42: require('../../assets/audio/piano/Fs2.mp3'),
  45: require('../../assets/audio/piano/A2.mp3'),
  48: require('../../assets/audio/piano/C3.mp3'),
  51: require('../../assets/audio/piano/Ds3.mp3'),
  54: require('../../assets/audio/piano/Fs3.mp3'),
  57: require('../../assets/audio/piano/A3.mp3'),
  60: require('../../assets/audio/piano/C4.mp3'),
  63: require('../../assets/audio/piano/Ds4.mp3'),
  66: require('../../assets/audio/piano/Fs4.mp3'),
  69: require('../../assets/audio/piano/A4.mp3'),
  72: require('../../assets/audio/piano/C5.mp3'),
  75: require('../../assets/audio/piano/Ds5.mp3'),
  78: require('../../assets/audio/piano/Fs5.mp3'),
  81: require('../../assets/audio/piano/A5.mp3'),
  84: require('../../assets/audio/piano/C6.mp3'),
  87: require('../../assets/audio/piano/Ds6.mp3'),
  90: require('../../assets/audio/piano/Fs6.mp3'),
  93: require('../../assets/audio/piano/A6.mp3'),
  96: require('../../assets/audio/piano/C7.mp3'),
  99: require('../../assets/audio/piano/Ds7.mp3'),
  102: require('../../assets/audio/piano/Fs7.mp3'),
  105: require('../../assets/audio/piano/A7.mp3'),
  108: require('../../assets/audio/piano/C8.mp3'),
};

/** Registro do órgão: amplitude de cada harmônico (Principal 8' + Oitava 4' + Quinzena 2'). */
const ORGAN_HARMONICS = (() => {
  const h = new Array(17).fill(0) as number[];
  const principal = [1, 0.42, 0.24, 0.15, 0.1, 0.07, 0.05, 0.035, 0.025, 0.02];
  principal.forEach((a, i) => (h[i + 1] += a));
  [1, 0.42, 0.24, 0.15].forEach((a, i) => (h[(i + 1) * 2] += a * 0.55)); // 4'
  [1, 0.42].forEach((a, i) => (h[(i + 1) * 4] += a * 0.3)); // 2'
  return h;
})();

interface Voice {
  sources: AudioScheduledSourceNode[];
  gain: GainNode;
  instrument: Instrument;
}

class Synth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private wet: GainNode | null = null;
  private voices = new Map<number, Voice[]>();
  private piano = new Map<number, AudioBuffer>();
  private pianoLoading: Promise<void> | null = null;
  private organWave: PeriodicWave | null = null;
  private noise: AudioBuffer | null = null;
  instrument: Instrument = 'piano';
  volume = 0.8;
  enabled = true;

  private ensure(): AudioContext | null {
    if (!this.enabled) return null;
    try {
      if (!this.ctx) {
        const ctx = new AudioContext();
        this.ctx = ctx;
        this.master = ctx.createGain();
        this.master.gain.value = this.volume * 0.5;
        this.master.connect(ctx.destination);
        this.setupReverb(ctx);
        this.setupOrgan(ctx);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      if (this.instrument === 'piano') void this.loadPiano();
      return this.ctx;
    } catch {
      // Sem áudio disponível (ex.: testes). O app continua funcionando mudo.
      this.enabled = false;
      return null;
    }
  }

  /** Reverberação da nave: resposta ao impulso gerada (ruído que decai). */
  private setupReverb(ctx: AudioContext): void {
    try {
      const seconds = 2.2;
      const length = Math.floor(ctx.sampleRate * seconds);
      const ir = ctx.createBuffer(2, length, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = new Float32Array(length);
        let seed = 12345 + ch * 777;
        for (let i = 0; i < length; i++) {
          seed = (seed * 16807) % 2147483647;
          const t = i / ctx.sampleRate;
          data[i] = (seed / 2147483647 - 0.5) * 2 * Math.exp(-t * 3.1) * Math.min(1, t / 0.012);
        }
        ir.copyToChannel(data, ch);
      }
      const convolver = ctx.createConvolver();
      convolver.buffer = ir;
      this.wet = ctx.createGain();
      this.wet.gain.value = 0.3;
      this.master!.connect(convolver);
      convolver.connect(this.wet);
      this.wet.connect(ctx.destination);
    } catch {
      this.wet = null;
    }
  }

  /** Forma de onda do tubo e ruído do "sopro" do ataque. */
  private setupOrgan(ctx: AudioContext): void {
    try {
      const real = new Float32Array(ORGAN_HARMONICS.length);
      const imag = new Float32Array(ORGAN_HARMONICS);
      this.organWave = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
    } catch {
      this.organWave = null;
    }
    try {
      const length = Math.floor(ctx.sampleRate * 0.12);
      const buf = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = new Float32Array(length);
      let seed = 99;
      for (let i = 0; i < length; i++) {
        seed = (seed * 16807) % 2147483647;
        data[i] = seed / 2147483647 - 0.5;
      }
      buf.copyToChannel(data, 0);
      this.noise = buf;
    } catch {
      this.noise = null;
    }
  }

  /** Carrega as gravações do piano (uma vez). */
  loadPiano(): Promise<void> {
    if (this.pianoLoading) return this.pianoLoading;
    const ctx = this.ctx;
    if (!ctx) return Promise.resolve();
    this.pianoLoading = Promise.all(
      Object.entries(PIANO_SAMPLES).map(async ([midi, mod]) => {
        try {
          const source = typeof mod === 'object' && mod && 'uri' in mod ? (mod as { uri: string }).uri : mod;
          const buffer = await ctx.decodeAudioData(source as string | number);
          this.piano.set(Number(midi), buffer);
        } catch {
          // Sem a gravação, a nota usa o som sintetizado de reserva.
        }
      }),
    ).then(() => undefined);
    return this.pianoLoading;
  }

  /** Chamar num toque do usuário para liberar o áudio no navegador/iOS. */
  unlock(): void {
    this.ensure();
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.master) this.master.gain.value = v * 0.5;
  }

  setInstrument(instrument: Instrument): void {
    this.instrument = instrument;
    if (this.wet) this.wet.gain.value = instrument === 'organ' ? 0.34 : 0.14;
    if (instrument === 'piano' && this.ctx) void this.loadPiano();
  }

  noteOn(midi: number, velocity = 0.8, instrument: Instrument = this.instrument): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const voice = instrument === 'piano' ? this.pianoVoice(ctx, midi, velocity) : this.organVoice(ctx, midi, velocity);
    if (!voice) return;
    const list = this.voices.get(midi) ?? [];
    list.push(voice);
    this.voices.set(midi, list);
  }

  private pianoVoice(ctx: AudioContext, midi: number, velocity: number): Voice | null {
    const now = ctx.currentTime;
    // Gravação mais próxima (no máximo 1 semitom de distância).
    let best = -1;
    for (const m of this.piano.keys()) if (best < 0 || Math.abs(m - midi) < Math.abs(best - midi)) best = m;
    const gain = ctx.createGain();
    gain.connect(this.master!);
    const level = 0.35 + velocity * 0.75;
    if (best < 0 || Math.abs(best - midi) > 2) {
      // Reserva enquanto as gravações carregam: som simples que decai.
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = midiToFrequency(midi);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(level * 0.5, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc.connect(gain);
      osc.start(now);
      return { sources: [osc], gain, instrument: 'piano' };
    }
    const src = ctx.createBufferSource();
    src.buffer = this.piano.get(best)!;
    src.playbackRate.value = 2 ** ((midi - best) / 12);
    gain.gain.setValueAtTime(level, now);
    src.connect(gain);
    src.start(now);
    return { sources: [src], gain, instrument: 'piano' };
  }

  private organVoice(ctx: AudioContext, midi: number, velocity: number): Voice {
    const now = ctx.currentTime;
    const freq = midiToFrequency(midi);
    const gain = ctx.createGain();
    gain.connect(this.master!);
    // O órgão não tem dinâmica pelo toque: volume quase constante.
    const level = 0.3 + velocity * 0.08;
    gain.gain.setValueAtTime(0.0001, now);
    // O tubo "fala" em ~40 ms.
    gain.gain.linearRampToValueAtTime(level, now + 0.04);
    const sources: AudioScheduledSourceNode[] = [];

    const rank = (f: number, detuneCents: number, amp: number) => {
      const osc = ctx.createOscillator();
      if (this.organWave) osc.setPeriodicWave(this.organWave);
      else osc.type = 'sine';
      osc.frequency.value = f;
      osc.detune.value = detuneCents;
      const g = ctx.createGain();
      g.gain.value = amp;
      osc.connect(g);
      g.connect(gain);
      osc.start(now);
      sources.push(osc);
    };
    // Duas fileiras levemente desafinadas: o "coro" natural dos tubos.
    rank(freq, -2, 0.5);
    rank(freq, 2.5, 0.5);
    // Graves (pedaleira): Subbaixo 16', uma oitava abaixo.
    if (midi < 48) rank(freq / 2, 0, 0.55);

    // Sopro do ataque: ruído curto filtrado perto do tubo.
    if (this.noise) {
      try {
        const chiff = ctx.createBufferSource();
        chiff.buffer = this.noise;
        const band = ctx.createBiquadFilter();
        band.type = 'bandpass';
        band.frequency.value = Math.min(8000, freq * 3);
        band.Q.value = 6;
        const cg = ctx.createGain();
        cg.gain.setValueAtTime(0.18, now);
        cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
        chiff.connect(band);
        band.connect(cg);
        cg.connect(gain);
        chiff.start(now);
        sources.push(chiff);
      } catch {
        // Sem o sopro, o tubo soa do mesmo jeito.
      }
    }
    return { sources, gain, instrument: 'organ' };
  }

  noteOff(midi: number): void {
    const ctx = this.ctx;
    const list = this.voices.get(midi);
    if (!ctx || !list?.length) return;
    const voice = list.shift()!;
    const now = ctx.currentTime;
    // Piano: o abafador para a corda (as mais agudas não têm abafador).
    const release = voice.instrument === 'piano' ? (midi >= 89 ? 1.2 : 0.3) : 0.09;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.0001), now);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + release);
    for (const src of voice.sources) {
      try {
        src.stop(now + release + 0.05);
      } catch {
        // Já parou sozinho (ex.: o sopro do ataque).
      }
    }
  }

  /** Toca uma nota por um tempo fixo (acompanhamento e demonstração). */
  play(midi: number, seconds: number, velocity = 0.6, instrument?: Instrument): void {
    this.noteOn(midi, velocity, instrument);
    setTimeout(() => this.noteOff(midi), Math.max(80, seconds * 1000 * 0.95));
  }

  /** Clique curto do metrônomo. */
  click(accent = false): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = accent ? 1760 : 1320;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.25 * this.volume, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc.connect(gain);
    // Direto na saída: o metrônomo não precisa de reverberação.
    gain.connect(ctx.destination);
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
