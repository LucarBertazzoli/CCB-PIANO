/**
 * Detecção de altura (pitch) monofônica pelo algoritmo YIN
 * (de Cheveigné & Kawahara, 2002). Funciona em JS puro para rodar igual
 * no navegador, Android e iOS.
 */
export interface PitchResult {
  /** Frequência em Hz, ou null se não houver nota clara. */
  frequency: number | null;
  /** 0..1 (quanto maior, mais confiável). */
  clarity: number;
  /** Volume RMS do quadro. */
  rms: number;
}

export interface YinOptions {
  sampleRate: number;
  /** Limiar da função de diferença normalizada (menor = mais rígido). */
  threshold?: number;
  minFrequency?: number;
  maxFrequency?: number;
}

export function rms(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

export function detectPitch(buffer: Float32Array, opts: YinOptions): PitchResult {
  const threshold = opts.threshold ?? 0.12;
  const minF = opts.minFrequency ?? 50;
  const maxF = opts.maxFrequency ?? 2100;
  const level = rms(buffer);

  const half = Math.floor(buffer.length / 2);
  const minTau = Math.max(2, Math.floor(opts.sampleRate / maxF));
  const maxTau = Math.min(half, Math.ceil(opts.sampleRate / minF));
  if (maxTau <= minTau) return { frequency: null, clarity: 0, rms: level };

  // 1-2. Função de diferença + média cumulativa normalizada.
  const d = new Float32Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau++) {
    let sum = 0;
    for (let i = 0; i < half; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    d[tau] = sum;
  }
  d[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    running += d[tau];
    d[tau] = running === 0 ? 1 : (d[tau] * tau) / running;
  }

  // 3. Primeiro mínimo abaixo do limiar.
  let tauEstimate = -1;
  for (let tau = minTau; tau <= maxTau; tau++) {
    if (d[tau] < threshold) {
      while (tau + 1 <= maxTau && d[tau + 1] < d[tau]) tau++;
      tauEstimate = tau;
      break;
    }
  }
  if (tauEstimate === -1) return { frequency: null, clarity: 0, rms: level };

  // 4. Interpolação parabólica para precisão sub-amostra.
  let betterTau = tauEstimate;
  if (tauEstimate > 1 && tauEstimate < maxTau) {
    const s0 = d[tauEstimate - 1];
    const s1 = d[tauEstimate];
    const s2 = d[tauEstimate + 1];
    const denom = 2 * (2 * s1 - s2 - s0);
    if (denom !== 0) betterTau = tauEstimate + (s2 - s0) / denom;
  }

  return {
    frequency: opts.sampleRate / betterTau,
    clarity: Math.max(0, 1 - d[tauEstimate]),
    rms: level,
  };
}
