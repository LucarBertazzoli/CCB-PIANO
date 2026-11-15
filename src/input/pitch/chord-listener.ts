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
  /** Pedaleira: aceita a nota soando uma oitava abaixo (registro de 16'). */
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
/** A partir desta nota o ataque repetido é medido na janela curta. */
const QUICK_SHORT_FROM = 60;
/** Harmônicos testados (oitava, 12ª, 2 oitavas, 17ª, 19ª, 3 oitavas) e a distância em semitons. */
const OVERTONES = [2, 3, 4, 5, 6, 8] as const;
const OVERTONE_SEMITONES: Record<number, number> = { 2: 12, 3: 19, 4: 24, 5: 28, 6: 31, 8: 36 };
/**
 * Quanto os harmônicos precisam se destacar dos vizinhos para ser outra nota
 * (média das razões). Ajustado com acordes dos hinos no simulador de órgão.
 */
const OVERTONE_MARGIN: Record<number, number> = { 2: 1.35, 3: 1.25, 4: 1.25, 5: 1.25, 6: 1.25, 8: 1.25 };

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
    this.opts = { octaveTolerant: true, confirmFrames: 3, ...opts };
    const { sizes, sampleRate } = opts;
    this.hz = { long: sampleRate / sizes.long, mid: sampleRate / sizes.mid, short: sampleRate / sizes.short };
  }

  get guide(): GuideNote[] {
    return [...this.entries.values()].map((e) => e.note);
  }

  /** Notas que devem estar soando agora (esperadas, seguradas e do acompanhamento). */
  private context = new Set<number>();

  setContext(midis: Iterable<number>): void {
    this.context = new Set(midis);
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
    for (const n of notes) this.context.add(n.midi);
    return out;
  }

  /**
   * Analisa os espectros de um instante. Devolve notas confirmadas/soltas.
   * `settled` = falso logo após um ataque (não confirma notas novas ainda).
   */
  process(spectra: Spectra, loudEnough: boolean, settled = true): ListenerEvent[] {
    const out: ListenerEvent[] = [];
    if (this.entries.size === 0) return out;
    const long = band(spectra.long, this.hz.long);
    const mid = band(spectra.mid, this.hz.mid);
    this.decideSounding(long, mid);
    for (const e of this.entries.values()) {
      const m = this.measure(long, mid, e.note);
      const present = loudEnough && m.present;
      this.lastSalience.set(e.note.midi, { level: m.level, ratio: m.ratio });
      const quick = this.quickLevel(spectra, e.note.midi);
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

      // Logo depois de um ataque o espectro ainda está borrado: espera.
      if (!settled) continue;
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

  private measure(long: Band, mid: Band, note: GuideNote) {
    const midi = note.midi;
    const pick = (m: number) => (midiToFrequency(m) < LOW_HZ ? long : mid);
    let best = this.harmonics(pick(midi), midi);
    // A nota pode ser só um harmônico de outra mais grave que está soando
    // (Dó2 soa também Dó3, Sol3, Dó4…). Aí ela não conta como tocada.
    if (best.present && !note.pedal && this.sounding.get(midi) === false) {
      best = { ...best, present: false };
    }
    if (this.opts.octaveTolerant && note.pedal) {
      // Órgão: o registro de 16' (pedaleira) soa uma oitava abaixo do escrito.
      // A oitava de cima não é aceita: ela já aparece nos harmônicos de
      // quintas e oitavas tocadas e daria falsos acertos.
      const alt = midi - 12;
      const m = this.harmonics(pick(alt), alt);
      if (m.present && (!best.present || m.level > best.level)) best = m;
      // O baixo da mão esquerda uma oitava acima tem os mesmos harmônicos
      // pares. A pedaleira precisa mostrar algo que só ela soa: a própria
      // fundamental, a quinta do 16' ou a 12ª.
      if (best.present && this.sounding.get(midi + 12)) {
        const f = midiToFrequency(midi);
        const b = pick(alt);
        const own = [f, f * 1.5, f * 3].some((x) => this.peakNear(b, x) > 0);
        if (!own) best = { ...best, present: false };
      }
    }
    return best;
  }

  /** Diagnóstico: quanto os harmônicos da nota se destacam (por quadro). */
  overtoneRatio = new Map<number, number>();

  /** Notas candidatas (esperadas e do contexto) que soam de verdade neste instante. */
  private sounding = new Map<number, boolean>();
  /** Das que soam, as que têm fundamental própria. */
  private strong = new Set<number>();

  /**
   * Decide, da mais grave para a mais aguda, quais notas candidatas soam por
   * conta própria. Assim cada nota é julgada já sabendo quais notas graves
   * estão mesmo tocando (e quais harmônicos são delas).
   */
  private decideSounding(long: Band, mid: Band): void {
    this.sounding.clear();
    this.strong.clear();
    this.overtoneRatio.clear();
    const cands = [...new Set([...this.context, ...[...this.entries.values()].map((e) => e.note.midi)])].sort((a, b) => a - b);
    for (const midi of cands) {
      const b = midiToFrequency(midi) < LOW_HZ ? long : mid;
      const h = this.harmonics(b, midi);
      const own = h.present && !this.overtoneOfLower(b, midi, cands);
      this.sounding.set(midi, own);
      // Só nota com fundamental própria "ocupa" harmônicos (a pedaleira de
      // 16' quase não tem fundamental no microfone e confundiria a conta).
      if (own && h.fundamental) this.strong.add(midi);
    }
  }

  /**
   * A nota esperada é só harmônico de uma nota mais grave? Testa as notas
   * uma oitava, uma 12ª, duas oitavas… abaixo (k = 2, 3, 4, 5, 6, 8).
   *
   * Uma nota tocada de verdade soma energia em TODOS os seus harmônicos, que
   * caem nos harmônicos k, 2k, 3k da nota grave. Um timbre natural varia aos
   * poucos de um harmônico para o seguinte; então, se esses harmônicos não se
   * destacam dos vizinhos (k−1, k+1, que a nota esperada não produz), quem
   * soa é só a nota grave.
   */
  private overtoneOfLower(b: Band, midi: number, cands: number[]): boolean {
    // Harmônicos de outras notas que soam (já decididas) não servem de vizinho
    // nem de prova: estariam somando a energia delas.
    const near = (freq: number, fp: number) => {
      const h = Math.round(freq / fp);
      return h >= 1 && h <= 8 && Math.abs(1200 * Math.log2(freq / (h * fp))) < 40;
    };
    const taken = (freq: number, ps: number[]) => ps.some((p) => near(freq, midiToFrequency(p)));
    // Notas mais graves já decididas; das mais agudas, só as que não podem ser
    // harmônico de uma grave que soa (essas ainda não dá para saber).
    const lower = cands.filter((p) => p < midi && this.strong.has(p));
    const upper = cands.filter((p) => p > midi && this.peakNear(b, midiToFrequency(p)) > 0 && !taken(midiToFrequency(p), lower));
    const isFundamental = (x: number) =>
      cands.some((p) => p !== midi && Math.abs(1200 * Math.log2(x / midiToFrequency(p))) < 40);
    for (const k of OVERTONES) {
      const low = midi - OVERTONE_SEMITONES[k];
      const f = midiToFrequency(low);
      const ps = [...lower, ...upper].filter((p) => p !== low);
      // A nota grave precisa soar por conta própria: algum harmônico dela que
      // a esperada não produz (fundamental, ou o seguinte) tem que existir —
      // e que não seja de outra nota tocada (Sol1 não "soa" só porque o Sol2
      // está tocando).
      let own = false;
      for (let h = 1; h <= 3 && !own; h++) if (h % k !== 0 && !taken(f * h, ps) && this.peakNear(b, f * h) > 0) own = true;
      if (!own) continue;
      // Nota grave fora do hino (engano da organista) só conta se for audível
      // de verdade: fundamental própria e acima de ~80 Hz (abaixo disso o
      // microfone do celular pega mais zumbido da rede que nota).
      // Nem pode ser só um harmônico de nota do hino — inclusive do 16' da
      // pedaleira, que soa uma oitava abaixo do escrito (o Mi♭1 do 16' soa
      // forte o Si♭2).
      const pedalSub = (p: number) => p < 52 && near(f, midiToFrequency(p - 12));
      if (!cands.includes(low) && (f < 80 || taken(f, ps) || cands.some(pedalSub) || this.peakNear(b, f) === 0)) continue;
      // Razão de cada harmônico (k, 2k, 3k) sobre a média dos vizinhos. Os
      // de cima pesam igual: neles a nota de verdade se destaca muito mais,
      // porque os harmônicos altos da nota grave já são fracos.
      let sum = 0;
      let count = 0;
      for (let j = 1; j <= 3; j++) {
        const h = j * k;
        if (f * (h + 1) > 5000) break;
        if (taken(f * h, ps)) continue;
        // Vizinho que é a fundamental de outra nota do hino também não serve:
        // se ela estiver tocando, o vizinho fica alto demais.
        const unusable = (x: number) => taken(x, ps) || isFundamental(x);
        const below = unusable(f * (h - 1)) ? null : this.magAt(b, f * (h - 1));
        const above = unusable(f * (h + 1)) ? null : this.magAt(b, f * (h + 1));
        let smooth: number;
        if (below !== null && above !== null) smooth = (below + above) / 2;
        // Só o de cima: ele subestima (os harmônicos vão caindo).
        else if (above !== null) smooth = above * 1.25;
        // Só o de baixo: ele exagera; e se for a fundamental (sempre a mais
        // forte), não serve.
        else if (below !== null && h - 1 > 1) smooth = below * 0.8;
        else continue;
        const obs = this.magAt(b, f * h);
        // Tudo no nível do ruído: esse harmônico não diz nada.
        if (Math.max(obs, smooth) < b.floor * 4) continue;
        sum += obs / Math.max(smooth, b.floor * 2);
        count++;
      }
      // Um harmônico só é pouca prova para descartar uma nota.
      if (count < 2) continue;
      const score = sum / count;
      this.overtoneRatio.set(midi, Math.min(this.overtoneRatio.get(midi) ?? Infinity, score));
      if (score < OVERTONE_MARGIN[k]) return true;
    }
    return false;
  }

  /** Maior magnitude perto de `f` (±1 faixa), mesmo sem pico definido. */
  private magAt(b: Band, f: number): number {
    const k = Math.round(f / b.binHz);
    let m = 0;
    for (let i = Math.max(1, k - 1); i <= Math.min(b.mags.length - 1, k + 1); i++) m = Math.max(m, b.mags[i]);
    return m;
  }

  /**
   * Volume da fundamental numa janela curta o bastante para ver a tecla solta
   * entre duas notas repetidas (com a reverberação da igreja a queda é
   * pequena): curta (0,05 s) do Dó3 para cima, média (0,09 s) abaixo, e
   * longa nos graves, onde a curta não separa as notas vizinhas.
   */
  private quickLevel(spectra: Spectra, midi: number): number {
    const [mags, hz] =
      midi >= QUICK_SHORT_FROM ? [spectra.short, this.hz.short] : midi >= 45 ? [spectra.mid, this.hz.mid] : [spectra.long, this.hz.long];
    const b = Math.round(midiToFrequency(midi) / hz);
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
    return { present, level, ratio: count, fundamental: !!hit[0] };
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
