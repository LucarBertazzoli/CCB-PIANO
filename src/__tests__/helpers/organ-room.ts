import { midiToFrequency } from '@/music/theory';

/**
 * Simulador de órgão numa igreja, para testar o reconhecimento pelo microfone:
 * tubos com harmônicos por registro, ataque e soltura, reverberação da nave,
 * microfone de celular (corta graves), ruído de fundo e zumbido da rede (60 Hz).
 */

export const SR = 44100;

export const STOPS = {
  /** Principal 8' */
  principal: [1, 0.55, 0.35, 0.22, 0.15, 0.1, 0.07, 0.05],
  /** Flauta 8' (poucos harmônicos pares) */
  flauta: [1, 0.12, 0.28, 0.04, 0.08],
  /** Principal 8' + 4' + 2' (cheio) */
  cheio: [1, 0.9, 0.5, 0.7, 0.3, 0.35, 0.15, 0.3],
} as const;

export type StopName = keyof typeof STOPS;

interface Voice {
  freq: number;
  partials: readonly number[];
  phase: number[];
  age: number;
  releaseAt: number | null;
  gain: number;
}

export interface RoomOptions {
  /** Proporção de reverberação (0 = sala seca). */
  reverb?: number;
  /** Tempo de reverberação (s). */
  rt60?: number;
  noise?: number;
  hum?: number;
  /** Corte de graves do microfone (Hz). */
  highpass?: number;
  /** Desafinação geral do órgão (cents). */
  detuneCents?: number;
  seed?: number;
}

export class OrganRoom {
  private voices = new Set<Voice>();
  private t = 0;
  private seed: number;
  private combs: { buf: Float32Array; i: number; g: number }[];
  private allpass: { buf: Float32Array; i: number }[];
  private hpX = 0;
  private hpY = 0;
  private opts: Required<RoomOptions>;

  constructor(opts: RoomOptions = {}) {
    this.opts = { reverb: 0.35, rt60: 1.8, noise: 0.003, hum: 0.004, highpass: 120, detuneCents: 0, seed: 7, ...opts };
    this.seed = this.opts.seed;
    this.combs = [1557, 1617, 1491, 1422].map((d) => ({
      buf: new Float32Array(d),
      i: 0,
      g: 10 ** ((-3 * d) / (this.opts.rt60 * SR)),
    }));
    this.allpass = [225, 556].map((d) => ({ buf: new Float32Array(d), i: 0 }));
  }

  private rnd(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647 - 0.5;
  }

  /** Aperta uma tecla. `octave` −1 = registro de 16' (pedaleira). */
  strike(midi: number, stop: StopName = 'principal', octave = 0, gain = 1): Voice {
    const v: Voice = {
      freq: midiToFrequency(midi) * 2 ** octave * 2 ** (this.opts.detuneCents / 1200),
      partials: STOPS[stop],
      phase: STOPS[stop].map(() => this.rnd() * 6.28),
      age: 0,
      releaseAt: null,
      gain,
    };
    this.voices.add(v);
    return v;
  }

  release(v: Voice): void {
    if (v.releaseAt === null) v.releaseAt = v.age;
  }

  releaseAll(): void {
    for (const v of this.voices) this.release(v);
  }

  render(n: number): Float32Array {
    const out = new Float32Array(n);
    const dt = 1 / SR;
    const rc = 1 / (2 * Math.PI * this.opts.highpass);
    const a = rc / (rc + dt);
    for (let i = 0; i < n; i++) {
      let dry = 0;
      for (const v of this.voices) {
        const tt = v.age / SR;
        // Tubo: fala em ~25 ms; soltura em ~60 ms.
        let env = Math.min(1, tt / 0.025);
        if (v.releaseAt !== null) env *= Math.max(0, 1 - (v.age - v.releaseAt) / (0.06 * SR));
        if (env <= 0 && v.releaseAt !== null) {
          this.voices.delete(v);
          continue;
        }
        let s = 0;
        for (let h = 0; h < v.partials.length; h++) {
          const f = v.freq * (h + 1);
          if (f > 9000) break;
          s += v.partials[h] * Math.sin(2 * Math.PI * f * tt + v.phase[h]);
        }
        dry += 0.07 * v.gain * env * s;
        v.age++;
      }
      // Reverberação (Schroeder: 4 pentes + 2 passa-tudo).
      let wet = 0;
      for (const c of this.combs) {
        const y = c.buf[c.i];
        c.buf[c.i] = dry + y * c.g;
        c.i = (c.i + 1) % c.buf.length;
        wet += y;
      }
      wet *= 0.25;
      for (const ap of this.allpass) {
        const y = ap.buf[ap.i];
        const x = wet + y * 0.5;
        ap.buf[ap.i] = x;
        ap.i = (ap.i + 1) % ap.buf.length;
        wet = y - 0.5 * x;
      }
      const time = this.t / SR;
      const mic =
        dry * (1 - this.opts.reverb * 0.5) +
        wet * this.opts.reverb +
        this.rnd() * this.opts.noise +
        this.opts.hum * (Math.sin(2 * Math.PI * 60 * time) + 0.5 * Math.sin(2 * Math.PI * 120 * time));
      // Microfone de celular: corta os graves.
      const y = a * (this.hpY + mic - this.hpX);
      this.hpX = mic;
      this.hpY = y;
      out[i] = y;
      this.t++;
    }
    return out;
  }
}
