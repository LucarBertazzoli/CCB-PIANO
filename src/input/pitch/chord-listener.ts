import { midiToFrequency } from '@/music/theory';

import type { GuideNote } from '../types';

/**
 * Ouvinte de acordes: em vez de adivinhar “qual nota é esta?” (o que não
 * funciona com acordes do órgão), confere no espectro se cada nota ESPERADA
 * está soando. É o que permite reconhecer as 4 vozes + pedaleira de uma vez.
 *
 * Para cada nota esperada procura picos afinados nos harmônicos (f, 2f, 3f…):
 * nota presente dá picos exatamente ali; nota vizinha (meio tom) não.
 *
 * Usa três janelas: longa (0,19 s) para os graves, média (0,09 s) para o
 * resto — mais rápida para notas curtas — e curta (0,05 s) só para perceber
 * a tecla sendo solta e tocada de novo (notas repetidas).
 */

/** Espectros de um instante, em três tamanhos de janela. */
export interface Spectra {
  long: Float32Array;
  mid: Float32Array;
  short: Float32Array;
}

export type ListenerEvent = { type: 'on' | 'off'; midi: number };

export interface ChordListenerOptions {
  sampleRate: number;
  /** Tamanhos das FFTs (longa, média, curta). */
  sizes: { long: number; mid: number; short: number };
  /** Aceita a nota soando uma oitava abaixo (registro de 16' no órgão). */
  octaveTolerant?: boolean;
  /** Quadros seguidos com a nota presente para confirmá-la. */
  confirmFrames?: number;
}

interface Entry {
  note: GuideNote;
  /** A nota já soava quando passou a ser esperada: precisa ser tocada de novo. */
  needsRestrike: boolean | null;
  peak: number;
  /** Menor volume desde o pico (para ver a tecla solta e tocada de novo). */
  low: number;
  frames: number;
  confirmed: boolean;
  held: boolean;
  absent: number;
}

const HARMONICS = 8;
/** Nível mínimo de uma nota em relação ao pico mais forte do espectro. */
const MIN_RELATIVE = 0.12;
/** Abaixo desta frequência a janela longa é necessária para separar meio tom. */
const LOW_HZ = 220;

interface Band {
  mags: Float32Array;
  binHz: number;
  floor: number;
  minLevel: number;
}

export class ChordListener {
  private opts: Required<ChordListenerOptions>;
  private entries = new Map<string, Entry>();
  private hz: { long: number; mid: number; short: number };
  /** Última medição de cada nota (0..), útil para diagnóstico. */
  lastSalience = new Map<number, { level: number; ratio: number }>();

  constructor(opts: ChordListenerOptions) {
    this.opts = { octaveTolerant: true, confirmFrames: 2, ...opts };
    const { sizes, sampleRate } = opts;
    this.hz = { long: sampleRate / sizes.long, mid: sampleRate / sizes.mid, short: sampleRate / sizes.short };
  }

  get guide(): GuideNote[] {
    return [...this.entries.values()].map((e) => e.note);
  }

  /** Troca as notas esperadas; notas que continuam esperadas mantêm o estado. */
  setGuide(notes: GuideNote[]): ListenerEvent[] {
    const out: ListenerEvent[] = [];
    const next = new Map<string, Entry>();
    for (const n of notes) {
      next.set(
        n.id,
        this.entries.get(n.id) ?? {
          note: n,
          needsRestrike: null,
          peak: 0,
          low: 0,
          frames: 0,
          confirmed: false,
          held: false,
          absent: 0,
        },
      );
    }
    for (const [id, e] of this.entries) {
      if (!next.has(id) && e.held && ![...next.values()].some((x) => x.held && x.note.midi === e.note.midi)) {
        out.push({ type: 'off', midi: e.note.midi });
      }
    }
    this.entries = next;
    return out;
  }

  /** Analisa os espectros de um instante. Devolve notas confirmadas/soltas. */
  process(spectra: Spectra, loudEnough: boolean): ListenerEvent[] {
    const out: ListenerEvent[] = [];
    if (this.entries.size === 0) return out;
    const long = band(spectra.long, this.hz.long);
    const mid = band(spectra.mid, this.hz.mid);
    for (const e of this.entries.values()) {
      const m = this.measure(long, mid, e.note.midi);
      const present = loudEnough && m.present;
      this.lastSalience.set(e.note.midi, { level: m.level, ratio: m.ratio });
      const quick = this.quickLevel(e.note.midi < 45 ? spectra.long : spectra.mid, e.note.midi);
      // Só exige tocar de novo quando a MESMA voz repete a nota. Se outra voz
      // segura essa altura (uníssono), no órgão é a mesma tecla: já vale.
      if (e.needsRestrike === null) e.needsRestrike = present && !!e.note.restrike;

      if (e.confirmed) {
        // Já contou: só acompanha quando a tecla é solta (para a tela).
        e.absent = present ? 0 : e.absent + 1;
        if (e.held && e.absent >= 3) {
          e.held = false;
          out.push({ type: 'off', midi: e.note.midi });
        }
        continue;
      }

      if (e.needsRestrike) {
        // Nota repetida: numa igreja o som não some entre as duas (reverberação),
        // então vale o novo ataque: uma queda (soltou a tecla) seguida de subida.
        if (quick >= e.peak) {
          e.peak = quick;
          e.low = quick;
        } else {
          e.low = Math.min(e.low, quick);
        }
        const dipped = !present || e.low < e.peak * 0.8;
        if (dipped && (!present || quick > e.low * 1.3)) {
          e.needsRestrike = false;
          e.frames = 0;
        }
        continue;
      }

      if (present) {
        e.frames++;
        if (e.frames >= this.opts.confirmFrames) {
          e.confirmed = true;
          e.held = true;
          out.push({ type: 'on', midi: e.note.midi });
        }
      } else {
        e.frames = 0;
      }
    }
    return out;
  }

  private measure(long: Band, mid: Band, midi: number) {
    const pick = (m: number) => (midiToFrequency(m) < LOW_HZ ? long : mid);
    let best = this.harmonics(pick(midi), midi);
    if (this.opts.octaveTolerant) {
      // Órgão: o registro de 16' (pedaleira) soa uma oitava abaixo do escrito.
      // A oitava de cima não é aceita: ela já aparece nos harmônicos de
      // quintas e oitavas tocadas e daria falsos acertos.
      const alt = midi - 12;
      const m = this.harmonics(pick(alt), alt);
      if (m.present && (!best.present || m.level > best.level)) best = m;
    }
    return best;
  }

  /**
   * Volume da fundamental na janela média (0,09 s): curta o bastante para ver
   * a tecla solta entre duas notas repetidas, e estreita o bastante para não
   * misturar harmônicos de outras notas do acorde.
   */
  private quickLevel(mags: Float32Array, midi: number): number {
    const f = midiToFrequency(midi);
    const hz = midi < 45 ? this.hz.long : this.hz.mid;
    const b = Math.round(f / hz);
    let best = 0;
    for (let i = Math.max(1, b - 1); i <= Math.min(mags.length - 1, b + 1); i++) best = Math.max(best, mags[i]);
    return best;
  }

  /**
   * Procura um pico de verdade em cada harmônico e confere a frequência exata
   * (interpolada): nota presente = fundamental (ou 2º harmônico) e mais um
   * harmônico, todos a menos de ~40 cents do esperado.
   */
  private harmonics(b: Band, midi: number) {
    const f0 = midiToFrequency(midi);
    const hit: boolean[] = [];
    let level = 0;
    for (let h = 1; h <= HARMONICS; h++) {
      const f = f0 * h;
      if (f > 5000) break;
      const amp = this.peakNear(b, f);
      hit.push(amp > 0);
      if (amp > 0 && h <= 4) level = Math.max(level, amp);
    }
    const count = hit.slice(0, 6).filter(Boolean).length;
    // Sem a fundamental só nos graves da pedaleira (o microfone do celular
    // quase não capta abaixo de ~100 Hz); nas outras vozes isso daria falsos
    // acertos com harmônicos de outras notas do acorde.
    const noFundamental = f0 < 130 && !!hit[1] && !!hit[2] && !!hit[3];
    const shape = (hit[0] && count >= 2) || noFundamental || (hit[0] && hit.length === 1);
    const present = shape && level >= b.minLevel;
    return { present, level, ratio: count };
  }

  /** Magnitude do pico perto de `f` (0 se não houver pico afinado ali). */
  private peakNear(band: Band, f: number): number {
    const { mags, binHz, floor } = band;
    const b = f / binHz;
    if (b < 2 || b >= mags.length - 2) return 0;
    const span = Math.max(1, b * (2 ** (40 / 1200) - 1));
    const lo = Math.max(1, Math.floor(b - span));
    const hi = Math.min(mags.length - 2, Math.ceil(b + span));
    let k = lo;
    for (let i = lo + 1; i <= hi; i++) if (mags[i] > mags[k]) k = i;
    const m = mags[k];
    if (m < floor * 4 || m < mags[k - 1] || m < mags[k + 1]) return 0;
    // Interpolação parabólica (log) para achar a frequência exata do pico.
    const a = Math.log(mags[k - 1] + 1e-12);
    const c = Math.log(m + 1e-12);
    const d = Math.log(mags[k + 1] + 1e-12);
    const den = a - 2 * c + d;
    const delta = den === 0 ? 0 : (0.5 * (a - d)) / den;
    const cents = 1200 * Math.log2(((k + delta) * binHz) / f);
    // Nos graves a resolução é menor: tolerância de ~0,3 faixa.
    const tol = Math.max(35, 1200 * Math.log2(1 + (0.3 * binHz) / f));
    return Math.abs(cents) <= tol ? m : 0;
  }
}

function band(mags: Float32Array, binHz: number): Band {
  // Notas de um acorde soam com volumes parecidos: um "pico" dez vezes mais
  // fraco que a nota mais forte é resto de harmônico, não tecla tocada.
  let loudest = 0;
  for (let i = Math.floor(40 / binHz); i < Math.min(mags.length, Math.ceil(2500 / binHz)); i++) {
    if (mags[i] > loudest) loudest = mags[i];
  }
  return { mags, binHz, floor: noiseFloor(mags, binHz), minLevel: loudest * MIN_RELATIVE };
}

/** Nível de ruído: mediana das magnitudes entre 80 Hz e 4 kHz. */
function noiseFloor(mags: Float32Array, binHz: number): number {
  const lo = Math.floor(80 / binHz);
  const hi = Math.min(mags.length - 1, Math.floor(4000 / binHz));
  const slice = Array.from(mags.subarray(lo, hi)).sort((a, b) => a - b);
  return slice[Math.floor(slice.length / 2)] || 1e-9;
}
