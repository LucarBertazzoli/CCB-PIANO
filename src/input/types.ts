export type InputSourceKind = 'touch' | 'midi' | 'mic';

/** Em qual teclado da tela a nota foi tocada (para acender só ele). */
export type KeyTarget = 'main' | 'upper' | 'lower' | 'pedal';

export interface NoteInputEvent {
  type: 'on' | 'off';
  midi: number;
  /** 0..1 */
  velocity: number;
  source: InputSourceKind;
  /** Teclado da tela que originou o toque (ausente para MIDI/microfone). */
  target?: KeyTarget;
}

/** Nota que o aluno deve tocar agora (o microfone procura por ela). */
export interface GuideNote {
  id: string;
  midi: number;
  /** A mesma voz repete a nota: a tecla precisa ser solta e tocada de novo. */
  restrike?: boolean;
  /** Nota da pedaleira do órgão (o registro de 16' soa uma oitava abaixo). */
  pedal?: boolean;
}

export type NoteEmitter = (e: NoteInputEvent) => void;

/** Uma fonte externa de notas (teclado MIDI, microfone...). */
export interface InputSource {
  readonly kind: InputSourceKind;
  /** Mensagem amigável caso a fonte não esteja disponível nesta plataforma. */
  unavailableReason(): string | null;
  start(emit: NoteEmitter): Promise<void>;
  stop(): void;
  /** Notas esperadas agora (`null` = nenhum hino tocando). Só o microfone usa. */
  setGuide?(notes: GuideNote[] | null, context?: number[]): void;
}
