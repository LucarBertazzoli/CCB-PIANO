import { computeAccuracy, starsFor, type HitRating, type ScoreSummary } from './scoring';
import type { TimedNote, Timeline } from './timeline';

/**
 * - `wait`   (Aprender): as notas param no teclado e esperam o aluno tocar.
 * - `rhythm` (Tocar): a música segue no andamento; o aluno precisa acertar o tempo.
 * - `demo`   (Ouvir): o app toca tudo sozinho para o aluno ver e ouvir.
 */
export type PracticeMode = 'wait' | 'rhythm' | 'demo';

export type SessionStatus = 'ready' | 'playing' | 'waiting' | 'paused' | 'finished';

export type NoteResult = 'pending' | 'hit' | 'missed' | 'auto';

export type SessionEvent =
  | { type: 'hit'; note: TimedNote; rating: HitRating; error: number }
  | { type: 'miss'; note: TimedNote }
  | { type: 'wrong'; midi: number }
  | { type: 'auto'; note: TimedNote }
  | { type: 'status'; status: SessionStatus }
  | { type: 'finished'; score: ScoreSummary };

export interface SessionConfig {
  timeline: Timeline;
  mode: PracticeMode;
  /** Segundos de contagem antes da primeira nota. */
  leadIn?: number;
  /**
   * `all`: acordes exigem todas as notas (teclado MIDI / toque).
   * `any`: basta uma nota do acorde (microfone, que só detecta uma nota por vez).
   */
  chordPolicy?: 'all' | 'any';
  /** Janela (s) para contar acerto no modo ritmo. */
  hitWindow?: number;
  /** Janela (s) para acerto "perfeito". */
  perfectWindow?: number;
  /** Latência da entrada (s), subtraída do instante do toque (ex.: microfone). */
  inputLatency?: number;
  /** No modo espera, quanto antes (s) da nota o toque já é aceito. */
  earlyTolerance?: number;
}

const GROUP_EPSILON = 0.03;
const END_PADDING = 0.6;

interface Group {
  time: number;
  notes: TimedNote[];
}

export class PracticeSession {
  readonly timeline: Timeline;
  readonly mode: PracticeMode;

  private cfg: Required<Omit<SessionConfig, 'timeline' | 'mode'>>;
  private listeners = new Set<(e: SessionEvent) => void>();

  private _time = 0;
  private _status: SessionStatus = 'ready';
  private resumeStatus: SessionStatus = 'playing';
  private results = new Map<string, NoteResult>();
  private _version = 0;

  private groups: Group[] = [];
  private groupIdx = 0;
  private autoNotes: TimedNote[] = [];
  private autoIdx = 0;
  private activeNotes: TimedNote[] = [];
  private missIdx = 0;

  private hits = 0;
  private perfect = 0;
  private missed = 0;
  private wrong = 0;
  private streak = 0;
  private bestStreak = 0;

  constructor(config: SessionConfig) {
    this.timeline = config.timeline;
    this.mode = config.mode;
    this.cfg = {
      leadIn: config.leadIn ?? 2,
      chordPolicy: config.chordPolicy ?? 'all',
      hitWindow: config.hitWindow ?? 0.2,
      perfectWindow: config.perfectWindow ?? 0.08,
      inputLatency: config.inputLatency ?? 0,
      earlyTolerance: config.earlyTolerance ?? 0.25,
    };
    this.reset();
  }

  // ------------------------------------------------------------------ estado

  get time(): number {
    return this._time;
  }

  get status(): SessionStatus {
    return this._status;
  }

  /** Incrementa sempre que o resultado de alguma nota muda (para re-renderizar). */
  get version(): number {
    return this._version;
  }

  get progress(): number {
    const d = this.timeline.duration;
    return d <= 0 ? 1 : Math.min(1, Math.max(0, this._time / d));
  }

  get streakCount(): number {
    return this.streak;
  }

  resultOf(noteId: string): NoteResult {
    return this.results.get(noteId) ?? 'pending';
  }

  /** Notas que o aluno deve tocar agora (para acender as teclas). */
  expectedNotes(): TimedNote[] {
    if (this.mode === 'wait') {
      const g = this.groups[this.groupIdx];
      if (!g) return [];
      const soon = g.time - this._time <= this.cfg.earlyTolerance;
      return soon ? g.notes.filter((n) => this.resultOf(n.id) === 'pending') : [];
    }
    const t = this._time;
    return this.timeline.notes.filter((n) => n.time <= t && t < n.time + n.duration);
  }

  score(): ScoreSummary {
    const total = this.activeNotes.length;
    const base = { total, hits: this.hits, perfect: this.perfect, wrong: this.wrong };
    const accuracy =
      this.mode === 'demo' ? 1 : computeAccuracy(this.mode === 'wait' ? 'wait' : 'rhythm', base);
    return {
      ...base,
      missed: this.missed,
      bestStreak: this.bestStreak,
      accuracy,
      stars: this.mode === 'demo' ? 0 : starsFor(accuracy),
    };
  }

  subscribe(fn: (e: SessionEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // --------------------------------------------------------------- controles

  reset(): void {
    this._time = -this.cfg.leadIn;
    this.results.clear();
    this.hits = this.perfect = this.missed = this.wrong = this.streak = this.bestStreak = 0;

    const demo = this.mode === 'demo';
    this.activeNotes = demo ? [] : this.timeline.notes.filter((n) => n.active);
    this.autoNotes = this.timeline.notes.filter((n) => demo || !n.active);
    this.autoIdx = 0;
    this.missIdx = 0;

    this.groups = [];
    for (const n of this.activeNotes) {
      const last = this.groups[this.groups.length - 1];
      if (last && n.time - last.time <= GROUP_EPSILON) last.notes.push(n);
      else this.groups.push({ time: n.time, notes: [n] });
    }
    this.groupIdx = 0;
    this._version++;
    this.setStatus('ready');
  }

  start(): void {
    if (this._status === 'ready' || this._status === 'finished') {
      if (this._status === 'finished') this.reset();
      this.setStatus('playing');
    } else if (this._status === 'paused') {
      this.setStatus(this.resumeStatus);
    }
  }

  pause(): void {
    if (this._status === 'playing' || this._status === 'waiting') {
      this.resumeStatus = this._status;
      this.setStatus('paused');
    }
  }

  /** Avança o relógio. Chamar a cada quadro com o tempo decorrido (s). */
  tick(dt: number): void {
    if (this._status !== 'playing') return;
    let target = this._time + dt;

    if (this.mode === 'wait') {
      const g = this.groups[this.groupIdx];
      if (g && target >= g.time) {
        target = g.time;
        this.advanceTo(target);
        this.setStatus('waiting');
        return;
      }
    }
    this.advanceTo(target);

    if (this.mode === 'rhythm') this.collectMisses();
    if (this.isComplete()) this.finish();
  }

  noteOn(midi: number): void {
    if (this._status !== 'playing' && this._status !== 'waiting') return;
    if (this.mode === 'demo') return;
    if (this.mode === 'wait') this.noteOnWait(midi);
    else this.noteOnRhythm(midi);
  }

  // ---------------------------------------------------------------- internos

  private noteOnWait(midi: number): void {
    const g = this.groups[this.groupIdx];
    if (!g || g.time - this._time > this.cfg.earlyTolerance) {
      this.registerWrong(midi);
      return;
    }
    const matches = g.notes.filter((n) => n.midi === midi && this.resultOf(n.id) === 'pending');
    if (matches.length === 0) {
      this.registerWrong(midi);
      return;
    }
    for (const n of matches) this.registerHit(n, 'perfect', 0);

    const pending = g.notes.filter((n) => this.resultOf(n.id) === 'pending');
    if (pending.length === 0 || this.cfg.chordPolicy === 'any') {
      for (const n of pending) this.registerHit(n, 'good', 0);
      this.groupIdx++;
      if (this._status === 'waiting') this.setStatus('playing');
      if (this.isComplete()) this.finish();
    }
  }

  private noteOnRhythm(midi: number): void {
    const t = this._time - this.cfg.inputLatency;
    let best: TimedNote | undefined;
    let bestErr = Infinity;
    for (const n of this.activeNotes) {
      if (n.time - t > this.cfg.hitWindow) break;
      if (n.midi !== midi || this.resultOf(n.id) !== 'pending') continue;
      const err = Math.abs(n.time - t);
      if (err <= this.cfg.hitWindow && err < bestErr) {
        best = n;
        bestErr = err;
      }
    }
    if (!best) {
      this.registerWrong(midi);
      return;
    }
    this.registerHit(best, bestErr <= this.cfg.perfectWindow ? 'perfect' : 'good', best.time - t);
  }

  private advanceTo(t: number): void {
    this._time = t;
    while (this.autoIdx < this.autoNotes.length && this.autoNotes[this.autoIdx].time <= t) {
      const n = this.autoNotes[this.autoIdx++];
      this.results.set(n.id, 'auto');
      this._version++;
      this.emit({ type: 'auto', note: n });
    }
  }

  private collectMisses(): void {
    const limit = this._time - this.cfg.inputLatency - this.cfg.hitWindow;
    while (this.missIdx < this.activeNotes.length && this.activeNotes[this.missIdx].time < limit) {
      const n = this.activeNotes[this.missIdx++];
      if (this.resultOf(n.id) === 'pending') {
        this.results.set(n.id, 'missed');
        this.missed++;
        this.streak = 0;
        this._version++;
        this.emit({ type: 'miss', note: n });
      }
    }
  }

  private registerHit(n: TimedNote, rating: HitRating, error: number): void {
    this.results.set(n.id, 'hit');
    this.hits++;
    if (rating === 'perfect') this.perfect++;
    this.streak++;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    this._version++;
    this.emit({ type: 'hit', note: n, rating, error });
  }

  private registerWrong(midi: number): void {
    this.wrong++;
    this.streak = 0;
    this.emit({ type: 'wrong', midi });
  }

  private isComplete(): boolean {
    const allResolved =
      this.mode === 'rhythm'
        ? this.missIdx >= this.activeNotes.length
        : this.groupIdx >= this.groups.length;
    return allResolved && this._time >= this.timeline.duration + END_PADDING;
  }

  private finish(): void {
    this.setStatus('finished');
    this.emit({ type: 'finished', score: this.score() });
  }

  private setStatus(s: SessionStatus): void {
    if (this._status === s) return;
    this._status = s;
    this.emit({ type: 'status', status: s });
  }

  private emit(e: SessionEvent): void {
    for (const fn of this.listeners) fn(e);
  }
}
