import type { InputSource, NoteEmitter } from './types';

/**
 * Teclado MIDI no Android/iOS.
 *
 * TODO: integrar um módulo nativo de MIDI (USB/Bluetooth). A interface já está
 * pronta: basta chamar `emit({ type: 'on' | 'off', midi, velocity, source: 'midi' })`.
 */
export class MidiInput implements InputSource {
  readonly kind = 'midi' as const;

  unavailableReason(): string | null {
    return 'Teclado MIDI no celular ainda não está disponível. Use o microfone ou a versão web.';
  }

  async start(_emit: NoteEmitter): Promise<void> {
    throw new Error(this.unavailableReason()!);
  }

  stop(): void {}
}
