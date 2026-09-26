import { useEffect, useMemo, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import { synth } from '@/audio/synth';
import { organArrangement } from '@/content/organ';
import type { HandSelection, Song, Voice } from '@/content/types';
import { PracticeSession, type PracticeMode, type SessionStatus } from '@/engine/practice-session';
import type { ScoreSummary } from '@/engine/scoring';
import { buildTimeline } from '@/engine/timeline';
import { inputHub } from '@/input/input-hub';
import type { KeyHint } from '@/components/PianoKeyboard';
import { useSettings } from '@/store/settings';

export interface PracticeOptions {
  song: Song;
  hands: HandSelection;
  mode: PracticeMode;
  tempoFactor: number;
  sectionId?: string;
  /** Exercício de ritmo: qualquer tecla vale. */
  anyKey?: boolean;
  /** Liga o metrônomo mesmo que esteja desligado nos ajustes. */
  forceMetronome?: boolean;
  /** Vozes que o aluno toca (hinos a 4 vozes). */
  voices?: Voice[];
}

export type Feedback = { id: number; text: string; kind: 'good' | 'bad' };

const FLASH_MS = 220;

/**
 * Liga o motor de prática ao relógio de animação, ao som e às entradas
 * (toque, MIDI, microfone). Toda a regra de jogo fica em `PracticeSession`.
 */
export function usePractice({
  song: baseSong,
  hands,
  mode,
  tempoFactor,
  sectionId,
  anyKey,
  forceMetronome,
  voices,
}: PracticeOptions) {
  const inputSource = useSettings((s) => s.inputSource);
  const micLatency = useSettings((s) => s.micLatency);
  const playAccompaniment = useSettings((s) => s.playAccompaniment);
  const metronomeSetting = useSettings((s) => s.metronome);
  const metronome = metronomeSetting || !!forceMetronome;

  // No órgão, hinos a 4 vozes usam o arranjo da organista (legato + pedaleira).
  const instrument = useSettings((s) => s.instrument);
  const song = useMemo(
    () => (instrument === 'organ' && baseSong.kind === 'hymn' ? organArrangement(baseSong) : baseSong),
    [instrument, baseSong],
  );

  const section = song.sections?.find((s) => s.id === sectionId);
  const timeline = useMemo(
    () =>
      buildTimeline(song, {
        hands,
        tempoFactor,
        startBeat: section?.startBeat,
        endBeat: section?.endBeat,
        voices,
      }),
    [song, hands, tempoFactor, section?.startBeat, section?.endBeat, voices],
  );

  const session = useMemo(
    () =>
      new PracticeSession({
        timeline,
        mode,
        // Contagem de um compasso (em semínimas), entre 1,5 e 4 segundos.
        leadIn: Math.min(
          4,
          Math.max(1.5, timeline.secondsPerBeat * song.timeSignature[0] * (4 / song.timeSignature[1])),
        ),
        chordPolicy: inputSource === 'mic' ? 'any' : 'all',
        inputLatency: inputSource === 'mic' ? micLatency : 0,
        anyKey,
      }),
    [timeline, mode, inputSource, micLatency, song.timeSignature, anyKey],
  );

  const time = useSharedValue(session.time);
  const [status, setStatus] = useState<SessionStatus>(session.status);
  const [version, setVersion] = useState(0);
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState<ScoreSummary | null>(null);
  const [expectedKey, setExpectedKey] = useState('');
  const [pressed, setPressed] = useState<ReadonlySet<number>>(new Set());
  const [flashes, setFlashes] = useState<ReadonlyMap<number, 'correct' | 'wrong'>>(new Map());
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const feedbackId = useRef(0);

  const accompanimentRef = useRef(playAccompaniment);
  const metronomeRef = useRef(metronome);
  useEffect(() => {
    accompanimentRef.current = playAccompaniment;
    metronomeRef.current = metronome;
  }, [playAccompaniment, metronome]);

  // Eventos do motor → som e feedback visual.
  // Nova sessão (mudou mão/modo/andamento): reinicia o estado da tela.
  const [prevSession, setPrevSession] = useState(session);
  if (session !== prevSession) {
    setPrevSession(session);
    setStatus(session.status);
    setScore(null);
    setVersion(session.version);
  }

  useEffect(() => {
    const flash = (midi: number, kind: 'correct' | 'wrong') => {
      setFlashes((prev) => new Map(prev).set(midi, kind));
      setTimeout(() => {
        setFlashes((prev) => {
          if (prev.get(midi) !== kind) return prev;
          const next = new Map(prev);
          next.delete(midi);
          return next;
        });
      }, FLASH_MS);
    };
    const say = (text: string, kind: Feedback['kind']) =>
      setFeedback({ id: ++feedbackId.current, text, kind });

    const unsubscribe = session.subscribe((e) => {
      switch (e.type) {
        case 'auto':
          if (session.mode === 'demo' || accompanimentRef.current) {
            synth.play(e.note.midi, e.note.duration, e.note.active ? 0.7 : 0.45);
          }
          setVersion(session.version);
          break;
        case 'hit':
          flash(e.note.midi, 'correct');
          setVersion(session.version);
          if (session.mode === 'rhythm') say(e.rating === 'perfect' ? 'Perfeito!' : 'Bom!', 'good');
          break;
        case 'miss':
          setVersion(session.version);
          say('Perdeu', 'bad');
          break;
        case 'wrong':
          flash(e.midi, 'wrong');
          break;
        case 'status':
          setStatus(e.status);
          break;
        case 'finished':
          setScore(e.score);
          break;
      }
    });
    return () => {
      unsubscribe();
      synth.allNotesOff();
    };
  }, [session, time]);

  // Entradas do aluno.
  useEffect(() => {
    return inputHub.subscribe((e) => {
      if (e.type === 'on') {
        // O microfone ouve o instrumento real; não precisa tocar som de novo.
        if (e.source !== 'mic') synth.noteOn(e.midi, e.velocity);
        session.noteOn(e.midi);
      } else if (e.source !== 'mic') {
        synth.noteOff(e.midi);
      }
      setPressed(new Set(inputHub.heldNotes()));
    });
  }, [session]);

  // Relógio: avança o motor a cada quadro.
  useEffect(() => {
    let raf = 0;
    let last = 0;
    let lastBeat = Math.floor(session.time / timeline.secondsPerBeat);
    let lastProgress = -1;
    let lastExpected = '';
    const beatsPerBar = Math.max(1, Math.round(song.timeSignature[0] * (4 / song.timeSignature[1])));

    const loop = (now: number) => {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      session.tick(dt);
      time.set(session.time);

      if (session.status === 'playing' && metronomeRef.current) {
        const beat = Math.floor(session.time / timeline.secondsPerBeat);
        if (beat !== lastBeat) synth.click(((beat % beatsPerBar) + beatsPerBar) % beatsPerBar === 0);
        lastBeat = beat;
      }

      const p = Math.round(session.progress * 200) / 200;
      if (p !== lastProgress) {
        lastProgress = p;
        setProgress(p);
      }
      const expected = session
        .expectedNotes()
        .map((n) => n.id)
        .join(',');
      if (expected !== lastExpected) {
        lastExpected = expected;
        setExpectedKey(expected);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [session, time, timeline.secondsPerBeat, song.timeSignature]);

  // Dicas no teclado: teclas esperadas (cor da mão + dedo), acertos e erros.
  const hints = useMemo(() => {
    const map = new Map<number, KeyHint>();
    if (expectedKey) {
      for (const n of session.expectedNotes()) {
        if (!n.active && session.mode !== 'demo') continue;
        map.set(n.midi, {
          state: n.hand === 'right' ? 'expected-right' : 'expected-left',
          finger: n.finger,
        });
      }
    }
    for (const midi of pressed) {
      if (!map.has(midi)) map.set(midi, { state: 'pressed' });
    }
    for (const [midi, kind] of flashes) map.set(midi, { state: kind });
    return map;
  }, [expectedKey, pressed, flashes, session]);

  const controls = useMemo(
    () => ({
      start: () => {
        synth.unlock();
        session.start();
      },
      pause: () => session.pause(),
      restart: () => {
        synth.allNotesOff();
        session.reset();
        time.set(session.time);
        setScore(null);
        setVersion(session.version);
      },
    }),
    [session, time],
  );

  return {
    song,
    session,
    timeline,
    time,
    status,
    version,
    progress,
    score,
    hints,
    feedback,
    streak: session.streakCount,
    inputSource,
    ...controls,
  };
}
