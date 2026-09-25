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
    }
  | {
      type: 'watch';
      title: string;
      songId: string;
      hands: HandSelection;
      sectionId?: string;
    }
  | {
      type: 'practice';
      title: string;
      songId: string;
      hands: HandSelection;
      sectionId?: string;
      /** Multiplicador de andamento (1 = original). */
      tempoFactor?: number;
    }
  | {
      type: 'play';
      title: string;
      songId: string;
      hands: HandSelection;
      sectionId?: string;
      tempoFactor?: number;
      /** Estrelas mínimas para concluir o passo. */
      minStars?: 1 | 2 | 3;
    };

export interface QuizQuestion {
  prompt: string;
  options: string[];
  /** Índice da opção correta. */
  answer: number;
  explanation?: string;
}

/** Passos de conteúdo/teoria (vídeos e materiais oficiais, quizzes, teclado interativo). */
export type TheoryStep =
  | {
      type: 'video';
      title: string;
      /** Vídeo do YouTube (id) ou playlist/URL. */
      youtubeId?: string;
      url?: string;
      description?: string;
    }
  | {
      type: 'material';
      title: string;
      url: string;
      description?: string;
    }
  | {
      type: 'quiz';
      title: string;
      questions: QuizQuestion[];
    }
  | {
      /** Mostra uma nota (nome ou na pauta) e o aluno precisa tocá-la no teclado. */
      type: 'find-key';
      title: string;
      notes: number[];
      show: 'name' | 'staff';
    };

export type AnyLessonStep = LessonStep | TheoryStep;

export interface ExternalSource {
  label: string;
  url: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  steps: AnyLessonStep[];
  /** `draft`: conteúdo interativo ainda em preparação (mostra só materiais). */
  status?: 'ready' | 'draft';
  sources?: ExternalSource[];
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
  /** Recursos gerais do curso (treinamento, playlists, cadernos). */
  resources?: ExternalSource[];
  /** Curso ainda não publicado pela fonte oficial. */
  comingSoon?: boolean;
}
