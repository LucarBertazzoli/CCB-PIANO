import { MicInput } from './mic-input';
import { MidiInput } from './midi-input';
import type { GuideNote, InputSource, InputSourceKind, NoteInputEvent } from './types';

type Listener = (e: NoteInputEvent) => void;

/**
 * Ponto único por onde passam todas as notas tocadas pelo aluno, venham do
 * teclado na tela, de um teclado MIDI ou do microfone.
 */
class InputHub {
  private listeners = new Set<Listener>();
  private external: InputSource | null = null;
  private held = new Set<number>();
  private _kind: InputSourceKind = 'touch';
  private _error: string | null = null;
  private statusListeners = new Set<() => void>();
  private guide: GuideNote[] | null = null;
  private context: number[] = [];
  private profile: number[] | null = null;

  get kind(): InputSourceKind {
    return this._kind;
  }

  get error(): string | null {
    return this._error;
  }

  get source(): InputSource | null {
    return this.external;
  }

  /** Notas atualmente pressionadas. */
  heldNotes(): ReadonlySet<number> {
    return this.held;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  onStatusChange(fn: () => void): () => void {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  emit = (e: NoteInputEvent): void => {
    if (e.type === 'on') this.held.add(e.midi);
    else this.held.delete(e.midi);
    for (const fn of this.listeners) fn(e);
  };

  /**
   * Notas que o aluno deve tocar agora (o microfone confere cada uma, o que
   * permite reconhecer acordes). `null` quando nenhum hino está tocando.
   */
  setGuide(notes: GuideNote[] | null, context: number[] = []): void {
    this.guide = notes;
    this.context = context;
    this.external?.setGuide?.(notes, context);
  }

  /** Timbre do órgão calibrado (fica valendo para o microfone). */
  setProfile(profile: number[] | null): void {
    this.profile = profile;
    this.external?.setProfile?.(profile);
  }

  /**
   * Calibra o timbre: a organista toca e segura `midi` sozinha. Resolve com o
   * timbre medido (ou null: microfone desligado ou som instável).
   */
  calibrate(midi: number, timeoutMs = 8000): Promise<number[] | null> {
    const src = this.external;
    if (!src?.calibrate) return Promise.resolve(null);
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), timeoutMs);
      src.calibrate!(midi, (p) => {
        clearTimeout(timer);
        if (p) this.profile = p;
        resolve(p);
      });
    });
  }

  /** Liga a fonte escolhida. O teclado na tela funciona sempre. */
  async use(kind: InputSourceKind, opts: { micSensitivity?: number } = {}): Promise<void> {
    this.stopExternal();
    this._kind = kind;
    this._error = null;
    if (kind !== 'touch') {
      const source: InputSource = kind === 'midi' ? new MidiInput() : new MicInput(opts.micSensitivity);
      const reason = source.unavailableReason();
      if (reason) {
        this._error = reason;
      } else {
        try {
          source.setGuide?.(this.guide, this.context);
          source.setProfile?.(this.profile);
          await source.start(this.emit);
          this.external = source;
        } catch (err) {
          this._error = err instanceof Error ? err.message : String(err);
        }
      }
    }
    this.notifyStatus();
  }

  stop(): void {
    this.stopExternal();
    this.notifyStatus();
  }

  private stopExternal(): void {
    this.external?.stop();
    this.external = null;
    for (const midi of [...this.held]) this.emit({ type: 'off', midi, velocity: 0, source: this._kind });
  }

  private notifyStatus(): void {
    for (const fn of this.statusListeners) fn();
  }
}

export const inputHub = new InputHub();
