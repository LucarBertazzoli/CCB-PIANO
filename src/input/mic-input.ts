import { AudioManager, AudioRecorder } from 'react-native-audio-api';

import { MIC_FRAME_SIZE, PitchProcessor } from './pitch/pitch-processor';
import type { GuideNote, InputSource, NoteEmitter } from './types';

/** Microfone no Android/iOS (react-native-audio-api). */
export class MicInput implements InputSource {
  readonly kind = 'mic' as const;
  private recorder: AudioRecorder | null = null;
  processor: PitchProcessor | null = null;
  private guide: GuideNote[] | null = null;

  constructor(private sensitivity = 0.01) {}

  unavailableReason(): string | null {
    return null;
  }

  async start(emit: NoteEmitter): Promise<void> {
    const permission = await AudioManager.requestRecordingPermissions();
    if (permission !== 'Granted') {
      throw new Error('Permita o acesso ao microfone para o app ouvir o seu teclado.');
    }
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'measurement',
      iosOptions: ['defaultToSpeaker', 'allowBluetoothA2DP'],
    });

    const sampleRate = 44100;
    this.processor = new PitchProcessor(sampleRate, emit);
    this.processor.setSensitivity(this.sensitivity);
    this.processor.setGuide(this.guide);
    const recorder = new AudioRecorder();
    const cb = recorder.onAudioReady(
      { sampleRate, bufferLength: MIC_FRAME_SIZE / 2, channelCount: 1 },
      (event) => this.processor?.push(event.buffer.getChannelData(0)),
    );
    if (cb.status === 'error') throw new Error(cb.message);
    const res = await recorder.start();
    if (res.status === 'error') throw new Error(res.message);
    this.recorder = recorder;
  }

  setGuide(notes: GuideNote[] | null): void {
    this.guide = notes;
    this.processor?.setGuide(notes);
  }

  stop(): void {
    this.processor?.flush();
    this.recorder?.clearOnAudioReady();
    void this.recorder?.stop();
    this.recorder = null;
    this.processor = null;
  }
}
