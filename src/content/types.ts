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

export type SongKind = 'hymn' | 'exercise' | 'piece';

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

/** Passos de uma lição (inspirado no fluxo "aprender → praticar → tocar"). */
export type LessonStep =
  | {
      type: 'intro';
      title: string;
      body: string;
      /** Teclas para destacar no teclado ilustrativo. */
      highlight?: number[];
      illustration?: Illustration;
    }
  | {
      type: 'watch';
      title: string;
      songId: string;
      hands: HandSelection;
      sectionId?: string;
      view?: 'falling' | 'sheet';
    }
  | {
      type: 'practice';
      title: string;
      songId: string;
      hands: HandSelection;
      sectionId?: string;
      /** Multiplicador de andamento (1 = original). */
      tempoFactor?: number;
      /** `sheet` para treinar leitura na partitura. */
      view?: 'falling' | 'sheet';
    }
  | {
      type: 'play';
      title: string;
      songId: string;
      hands: HandSelection;
      sectionId?: string;
      tempoFactor?: number;
      view?: 'falling' | 'sheet';
      /** Estrelas mínimas para concluir o passo. */
      minStars?: 1 | 2 | 3;
    };

/** Ilustração opcional de uma pergunta ou explicação. */
export interface Illustration {
  /** Notas desenhadas numa pauta (clave escolhida pela altura, ou forçada). */
  staff?: number[];
  clef?: 'treble' | 'bass';
  /** Escreve as teclas pretas como bemóis (ex.: Si♭). */
  flats?: boolean;
  /** Teclas destacadas num teclado. */
  keys?: number[];
  /** Figuras musicais desenhadas lado a lado. */
  figures?: FigureName[];
}

export type FigureName =
  | 'semibreve'
  | 'minima'
  | 'seminima'
  | 'colcheia'
  | 'pausa-semibreve'
  | 'pausa-minima'
  | 'pausa-seminima'
  | 'pausa-colcheia'
  | 'minima-pontuada';

export interface QuizQuestion {
  prompt: string;
  options: string[];
  /** Índice da opção correta. */
  answer: number;
  explanation?: string;
  illustration?: Illustration;
}

/** Um som tocado numa atividade de percepção auditiva. */
export interface ListenSound {
  /** Nota ou acorde (MIDI). */
  midi: number | number[];
  /** Duração em batidas (andamento da rodada). */
  beats: number;
  /** 0..1 (fraco/forte). */
  velocity?: number;
  instrument?: Instrument;
  /** Silêncio em vez de som. */
  rest?: boolean;
}

export interface ListenRound {
  question: string;
  sounds: ListenSound[];
  options: string[];
  answer: number;
  explanation?: string;
  /** Batidas por minuto (padrão 90). */
  tempo?: number;
  illustration?: Illustration;
}

/** Passos de teoria e percepção (quizzes, ouvir, ritmo, leitura no teclado). */
export type TheoryStep =
  | {
      type: 'quiz';
      title: string;
      questions: QuizQuestion[];
    }
  | {
      /** Percepção auditiva: o app toca, o aluno responde. */
      type: 'listen';
      title: string;
      rounds: ListenRound[];
    }
  | {
      /** Leitura rítmica: figuras na pauta, qualquer tecla, com metrônomo. */
      type: 'rhythm';
      title: string;
      songId: string;
      hint?: string;
    }
  | {
      /** Mostra uma nota (nome ou na pauta) e o aluno precisa tocá-la no teclado. */
      type: 'find-key';
      title: string;
      notes: number[];
      show: 'name' | 'staff';
      /** Aceita a nota em qualquer oitava (ex.: “encontre um Dó”). */
      anyOctave?: boolean;
      clef?: 'treble' | 'bass';
    };

export type AnyLessonStep = LessonStep | TheoryStep;

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  steps: AnyLessonStep[];
  /** Emoji/ícone curto do nó na trilha. */
  icon?: string;
}

export interface Unit {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instrument: Instrument | 'both';
  units: Unit[];
}
