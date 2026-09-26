/**
 * Modelo de conteúdo do app. Tudo (hinos, exercícios, lições) é dado puro,
 * pronto para ser carregado de arquivos locais hoje e de uma API no futuro.
 */

export type Hand = 'right' | 'left';
export type HandSelection = 'right' | 'left' | 'both';
export type Instrument = 'piano' | 'organ';
export type Voice = 'soprano' | 'alto' | 'tenor' | 'bass' | 'pedal';
export type Finger = 1 | 2 | 3 | 4 | 5;

/** Uma nota da música. Tempos em batidas (semínima = 1). */
export interface NoteEvent {
  id: string;
  midi: number;
  start: number;
  duration: number;
  hand: Hand;
  finger?: Finger;
  voice?: Voice;
}

/** Pausa (silêncio) — usada só para desenhar a partitura. */
export interface RestEvent {
  start: number;
  duration: number;
  hand: Hand;
  voice?: Voice;
}

/** Trecho nomeado da música (estrofe, coro, frase) para praticar em partes. */
export interface Section {
  id: string;
  label: string;
  startBeat: number;
  endBeat: number;
}

export type SongKind = 'hymn' | 'exercise';

export interface Song {
  id: string;
  kind: SongKind;
  title: string;
  subtitle?: string;
  /** Número do hino no hinário (quando `kind === 'hymn'`). */
  hymnNumber?: number;
  /** Batidas por minuto (semínima). */
  tempo: number;
  timeSignature: [number, number];
  /** Armadura de clave em quintas: -7 (7 bemóis) .. 7 (7 sustenidos). */
  keySignature: number;
  /** 1 (muito fácil) .. 5 (avançado). */
  difficulty: 1 | 2 | 3 | 4 | 5;
  instruments: Instrument[];
  notes: NoteEvent[];
  rests?: RestEvent[];
  /** `false` esconde a fórmula de compasso (como nos primeiros Estudos do MOR). */
  showTimeSignature?: boolean;
  /**
   * Início de cada compasso em batidas (hinos importados: inclui anacruse e
   * compassos quebrados no fim da linha). Sem valor = compassos regulares.
   */
  measures?: number[];
  /** Início de cada linha (sistema) do hinário, em batidas. */
  lines?: number[];
  /** Fim da música em batidas. */
  endBeat?: number;
  /** Indicação de metrônomo como no hinário (ex.: ♪ = 112–144). */
  tempoMark?: { unit: 'q' | 'e' | 'q.' | 'h'; min: number; max: number; text?: string };
  composer?: string;
  sections?: Section[];
  tags?: string[];
  /** Origem/licença do arranjo. */
  credits?: string;
}
