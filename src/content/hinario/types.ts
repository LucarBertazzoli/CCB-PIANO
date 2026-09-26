/** Formato compacto dos hinos importados (ver scripts/importar-hinario.py). */
export interface HymnFile {
  kind: 'hino' | 'coro';
  n: number;
  title: string;
  composer: string;
  /** Armadura em quintas (-7..7). */
  key: number;
  time: [number, number];
  /** Faixa de andamento em semínimas por minuto. */
  tempo: [number, number];
  /** Indicação original: unidade (q, e, q., h), faixa e expressão. */
  tempoMark: { unit: 'q' | 'e' | 'q.' | 'h'; min: number; max: number; text: string };
  /** Início de cada compasso (ticks; 480 = semínima). */
  measures: number[];
  end: number;
  /** Início de cada linha (sistema) do hinário. */
  lines: number[];
  /** [midi, início, duração, voz (0=S 1=A 2=T 3=B)] */
  notes: [number, number, number, number][];
  /** [início, duração, pauta (0=Sol 1=Fá)] */
  rests: [number, number, number][];
}

export interface HymnIndexEntry {
  kind: 'hino' | 'coro';
  n: number;
  title: string;
}
