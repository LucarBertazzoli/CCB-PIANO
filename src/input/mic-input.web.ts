import { MIC_FRAME_SIZE, PitchProcessor } from './pitch/pitch-processor';
import type { GuideNote, InputSource, NoteEmitter } from './types';

/** Timbre aprendido tocando: vale de um hino para o outro na mesma sessão. */
const learned = new Map<number, number[][]>();

/** Microfone no navegador (getUserMedia + Web Audio). */
export class MicInput implements InputSource {
  readonly kind = 'mic' as const;
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private node: ScriptProcessorNode | null = null;
  processor: PitchProcessor | null = null;
  private guide: GuideNote[] | null = null;
  private context: number[] = [];
  private profile: number[] | null = null;

  constructor(private sensitivity = 0.01) {}

  unavailableReason(): string | null {
    return typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function'
      ? null
      : 'Este navegador não permite usar o microfone.';
  }

  async start(emit: NoteEmitter): Promise<void> {
    const reason = this.unavailableReason();
    if (reason) throw new Error(reason);
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    this.ctx = new AudioContext();
    const source = this.ctx.createMediaStreamSource(this.stream);
    // ScriptProcessor é antigo, mas funciona em todos os navegadores sem arquivos extras.
    this.node = this.ctx.createScriptProcessor(MIC_FRAME_SIZE / 2, 1, 1);
    this.processor = new PitchProcessor(this.ctx.sampleRate, emit);
    this.processor.setSensitivity(this.sensitivity);
    this.processor.setGuide(this.guide, this.context);
    this.processor.setProfile(this.profile);
    this.processor.listener.learned = learned;
    this.node.onaudioprocess = (e) => this.processor?.push(e.inputBuffer.getChannelData(0));
    source.connect(this.node);
    // Conecta a um ganho zero para o nó processar sem tocar o som de volta.
    const mute = this.ctx.createGain();
    mute.gain.value = 0;
    this.node.connect(mute).connect(this.ctx.destination);
  }

  setGuide(notes: GuideNote[] | null, context: number[] = []): void {
    this.guide = notes;
    this.context = context;
    this.processor?.setGuide(notes, context);
  }

  setProfile(profile: number[] | null): void {
    this.profile = profile;
    this.processor?.setProfile(profile);
  }

  calibrate(midi: number, done: (profile: number[] | null) => void): void {
    if (!this.processor) return done(null);
    this.processor.calibrate(midi, (p) => {
      if (p) this.profile = p;
      done(p);
    });
  }

  stop(): void {
    this.processor?.flush();
    if (this.node) this.node.onaudioprocess = null;
    this.node?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close();
    this.node = null;
    this.stream = null;
    this.ctx = null;
    this.processor = null;
  }
}
