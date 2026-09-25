import type { InputSource, NoteEmitter } from './types';

type MIDIMessage = { data: Uint8Array };
type MIDIPort = { onmidimessage: ((m: MIDIMessage) => void) | null };
type MIDIAccess = {
  inputs: Map<string, MIDIPort>;
  onstatechange: (() => void) | null;
};

/** Teclado MIDI via Web MIDI API (Chrome/Edge/Android Chrome). */
export class MidiInput implements InputSource {
  readonly kind = 'midi' as const;
  private access: MIDIAccess | null = null;

  unavailableReason(): string | null {
    const nav = typeof navigator !== 'undefined' ? (navigator as unknown as Record<string, unknown>) : null;
    return nav && typeof nav.requestMIDIAccess === 'function'
      ? null
      : 'Este navegador não suporta teclados MIDI. Use o Chrome ou o Edge.';
  }

  async start(emit: NoteEmitter): Promise<void> {
    const reason = this.unavailableReason();
    if (reason) throw new Error(reason);
    const nav = navigator as unknown as { requestMIDIAccess: () => Promise<MIDIAccess> };
    this.access = await nav.requestMIDIAccess();

    const handler = (m: MIDIMessage) => {
      const [status, note, velocity] = m.data;
      const cmd = status & 0xf0;
      if (cmd === 0x90 && velocity > 0) {
        emit({ type: 'on', midi: note, velocity: velocity / 127, source: 'midi' });
      } else if (cmd === 0x80 || (cmd === 0x90 && velocity === 0)) {
        emit({ type: 'off', midi: note, velocity: 0, source: 'midi' });
      }
    };
    const bind = () => this.access?.inputs.forEach((input) => (input.onmidimessage = handler));
    bind();
    this.access.onstatechange = bind;
  }

  stop(): void {
    this.access?.inputs.forEach((input) => (input.onmidimessage = null));
    if (this.access) this.access.onstatechange = null;
    this.access = null;
  }
}
