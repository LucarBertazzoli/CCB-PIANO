/**
 * FFT real (radix-2, iterativa) com janela de Hann. Devolve a magnitude de
 * cada faixa de frequência. JS puro, igual na web, Android e iOS.
 */
export class Spectrum {
  readonly size: number;
  readonly magnitudes: Float32Array;
  private re: Float64Array;
  private im: Float64Array;
  private window: Float32Array;
  private rev: Uint32Array;
  private cos: Float64Array;
  private sin: Float64Array;

  constructor(size: number) {
    if (size & (size - 1)) throw new Error('O tamanho da FFT precisa ser potência de 2.');
    this.size = size;
    this.magnitudes = new Float32Array(size / 2);
    this.re = new Float64Array(size);
    this.im = new Float64Array(size);
    this.window = new Float32Array(size);
    for (let i = 0; i < size; i++) this.window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
    const bits = Math.log2(size);
    this.rev = new Uint32Array(size);
    for (let i = 0; i < size; i++) {
      let r = 0;
      for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
      this.rev[i] = r;
    }
    this.cos = new Float64Array(size / 2);
    this.sin = new Float64Array(size / 2);
    for (let i = 0; i < size / 2; i++) {
      this.cos[i] = Math.cos((2 * Math.PI * i) / size);
      this.sin[i] = -Math.sin((2 * Math.PI * i) / size);
    }
  }

  /** Calcula o espectro de `samples` (comprimento = size). */
  compute(samples: Float32Array): Float32Array {
    const { size, re, im, rev, window } = this;
    for (let i = 0; i < size; i++) {
      re[rev[i]] = samples[i] * window[i];
      im[i] = 0;
    }
    for (let len = 2; len <= size; len <<= 1) {
      const half = len >> 1;
      const step = size / len;
      for (let start = 0; start < size; start += len) {
        for (let k = 0; k < half; k++) {
          const c = this.cos[k * step];
          const s = this.sin[k * step];
          const a = start + k;
          const b = a + half;
          const tr = re[b] * c - im[b] * s;
          const ti = re[b] * s + im[b] * c;
          re[b] = re[a] - tr;
          im[b] = im[a] - ti;
          re[a] += tr;
          im[a] += ti;
        }
      }
    }
    const scale = 4 / size;
    for (let i = 0; i < size / 2; i++) this.magnitudes[i] = Math.hypot(re[i], im[i]) * scale;
    return this.magnitudes;
  }
}
