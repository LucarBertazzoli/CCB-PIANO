import { useEffect, useMemo, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import { synth } from '@/audio/synth';
import { organArrangement } from '@/content/organ';
import type { HandSelection, Song, Voice } from '@/content/types';
import { PracticeSession, type PracticeMode, type SessionStatus } from '@/engine/practice-session';
import type { ScoreSummary } from '@/engine/scoring';
import { buildTimeline } from '@/engine/timeline';
import { inputHub } from '@/input/input-hub';
import type { KeyTarget } from '@/input/types';
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
  // Teclas pressionadas e piscadas, com o teclado de origem ("upper:67", "any:60"…),
  // para acender só o teclado onde o aluno tocou.
  const [pressed, setPressed] = useState<ReadonlySet<string>>(new Set());
  const [flashes, setFlashes] = useState<ReadonlyMap<string, 'correct' | 'wrong'>>(new Map());
  const lastTarget = useRef<KeyTarget | 'any'>('any');
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
      const key = `${lastTarget.current}:${midi}`;
      setFlashes((prev) => new Map(prev).set(key, kind));
      setTimeout(() => {
        setFlashes((prev) => {
          if (prev.get(key) !== kind) return prev;
          const next = new Map(prev);
          next.delete(key);
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
      const key = `${e.target ?? 'any'}:${e.midi}`;
      if (e.type === 'on') {
        lastTarget.current = e.target ?? 'any';
        // O microfone ouve o instrumento real; não precisa tocar som de novo.
        if (e.source !== 'mic') synth.noteOn(e.midi, e.velocity);
        session.noteOn(e.midi);
        setPressed((prev) => new Set(prev).add(key));
      } else {
        if (e.source !== 'mic') synth.noteOff(e.midi);
        setPressed((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
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

  // Dicas nos teclados: teclas esperadas (cor do manual + dedo), acertos e erros.
  // Separadas por manual superior (mão direita), inferior (mão esquerda) e pedaleira.
  const hintSets = useMemo(() => {
    const right = new Map<number, KeyHint>();
    const left = new Map<number, KeyHint>();
    const pedal = new Map<number, KeyHint>();
    const manual = new Map<number, KeyHint>();
    if (expectedKey) {
      for (const n of session.expectedNotes()) {
        if (!n.active && session.mode !== 'demo') continue;
        if (n.voice === 'pedal') {
          pedal.set(n.midi, { state: 'expected-pedal' });
          continue;
        }
        const hint: KeyHint = { state: n.hand === 'right' ? 'expected-right' : 'expected-left', finger: n.finger };
        (n.hand === 'right' ? right : left).set(n.midi, hint);
        if (!manual.has(n.midi) || n.hand === 'right') manual.set(n.midi, hint);
      }
    }
    // Toque na tela: só o teclado tocado; MIDI/microfone ("any"): todos.
    const targets: [Map<number, KeyHint>, KeyTarget][] = [
      [right, 'upper'],
      [left, 'lower'],
      [pedal, 'pedal'],
      [manual, 'main'],
    ];
    for (const [map, target] of targets) {
      for (const key of pressed) {
        const [t, m] = key.split(':');
        const midi = Number(m);
        if ((t === target || t === 'any') && !map.has(midi)) map.set(midi, { state: 'pressed' });
      }
      for (const [key, kind] of flashes) {
        const [t, m] = key.split(':');
        if (t === target || t === 'any') map.set(Number(m), { state: kind });
      }
    }
    return { manual, right, left, pedal };
  }, [expectedKey, pressed, flashes, session]);
  const hints = hintSets.manual;

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
    hintSets,
    feedback,
    streak: session.streakCount,
    inputSource,
    ...controls,
  };
}
