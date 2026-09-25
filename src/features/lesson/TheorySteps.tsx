import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { synth } from '@/audio/synth';
import { IllustrationView } from '@/components/IllustrationView';
import { keyboardLayout } from '@/components/keyboard-layout';
import { PianoKeyboard, type KeyHint } from '@/components/PianoKeyboard';
import { StaffNote } from '@/components/StaffNote';
import { Button } from '@/components/ui';
import type { ListenSound, TheoryStep } from '@/content/types';
import { inputHub } from '@/input/input-hub';
import { noteName, pitchClass } from '@/music/theory';
import { useSettings } from '@/store/settings';
import { colors, radius, space } from '@/theme';

type StepProps<T extends TheoryStep['type']> = {
  step: Extract<TheoryStep, { type: T }>;
  /** `score` 0..1 para passos avaliados. */
  onNext: (score?: number) => void;
};

/** Botões de resposta com retorno visual (verde/vermelho), como no Simply Piano. */
function AnswerOptions({
  options,
  answer,
  chosen,
  onChoose,
}: {
  options: string[];
  answer: number;
  chosen: number | null;
  onChoose: (i: number) => void;
}) {
  const answered = chosen !== null;
  return (
    <View style={styles.options}>
      {options.map((opt, i) => {
        const bg = !answered ? colors.card : i === answer ? colors.success : i === chosen ? colors.danger : colors.card;
        return (
          <Pressable
            key={i}
            disabled={answered}
            onPress={() => onChoose(i)}
            style={({ pressed }) => [
              styles.option,
              { backgroundColor: bg, flexBasis: options.length <= 4 ? `${100 / options.length - 3}%` : '45%' },
              pressed && { transform: [{ scale: 0.97 }] },
            ]}>
            <Text style={styles.optionText}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Feedback({ ok, explanation, onContinue }: { ok: boolean; explanation?: string; onContinue: () => void }) {
  return (
    <Animated.View entering={FadeIn.duration(150)} style={styles.feedback}>
      <View style={{ flexShrink: 1, gap: 2 }}>
        <Text style={[styles.feedbackTitle, { color: ok ? colors.success : colors.danger }]}>
          {ok ? 'Muito bem!' : 'Quase! Veja a resposta certa.'}
        </Text>
        {explanation ? <Text style={styles.explanation}>{explanation}</Text> : null}
      </View>
      <Button title="Continuar" onPress={onContinue} />
    </Animated.View>
  );
}

function RoundCounter({ title, index, total }: { title: string; index: number; total: number }) {
  return (
    <View style={styles.counterRow}>
      <Text style={styles.counter}>{title}</Text>
      <View style={styles.pips}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.pip, i < index && styles.pipDone, i === index && styles.pipCurrent]} />
        ))}
      </View>
    </View>
  );
}

/** Quiz de múltipla escolha, com pauta/teclado/figuras ilustrando a pergunta. */
export function QuizStep({ step, onNext }: StepProps<'quiz'>) {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const q = step.questions[index];

  const advance = () => {
    if (index + 1 >= step.questions.length) {
      onNext(correct / step.questions.length);
      return;
    }
    setIndex(index + 1);
    setChosen(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.center}>
      <RoundCounter title={step.title} index={index} total={step.questions.length} />
      <Text style={styles.title}>{q.prompt}</Text>
      {q.illustration ? <IllustrationView illustration={q.illustration} compact /> : null}
      <AnswerOptions
        options={q.options}
        answer={q.answer}
        chosen={chosen}
        onChoose={(i) => {
          setChosen(i);
          if (i === q.answer) setCorrect((c) => c + 1);
        }}
      />
      {chosen !== null && <Feedback ok={chosen === q.answer} explanation={q.explanation} onContinue={advance} />}
    </ScrollView>
  );
}

/** Toca uma sequência de sons (notas, acordes e silêncios). */
function playSounds(sounds: ListenSound[], tempo: number): number {
  const spb = 60 / tempo;
  let t = 0;
  for (const s of sounds) {
    const seconds = s.beats * spb;
    if (!s.rest) {
      const midis = Array.isArray(s.midi) ? s.midi : [s.midi];
      const start = t;
      setTimeout(() => {
        for (const m of midis) synth.play(m, seconds, s.velocity ?? 0.7, s.instrument);
      }, start * 1000);
    }
    t += seconds;
  }
  return t;
}

/** Percepção auditiva: o app toca e o aluno responde (grave/agudo, subiu/desceu…). */
export function ListenStep({ step, onNext }: StepProps<'listen'>) {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [playing, setPlaying] = useState(false);
  const round = step.rounds[index];
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const play = useCallback(() => {
    synth.unlock();
    setPlaying(true);
    const total = playSounds(round.sounds, round.tempo ?? 90);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPlaying(false), total * 1000 + 150);
  }, [round]);

  // Toca automaticamente ao abrir cada rodada.
  useEffect(() => {
    const t = setTimeout(play, 350);
    return () => clearTimeout(t);
  }, [play]);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const advance = () => {
    if (index + 1 >= step.rounds.length) {
      onNext(correct / step.rounds.length);
      return;
    }
    setIndex(index + 1);
    setChosen(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.center}>
      <RoundCounter title={step.title} index={index} total={step.rounds.length} />
      <Text style={styles.title}>{round.question}</Text>
      <Pressable onPress={play} style={[styles.listenBtn, playing && styles.listenBtnOn]} accessibilityLabel="Ouvir de novo">
        <Text style={styles.listenIcon}>{playing ? '♪' : '▶'}</Text>
      </Pressable>
      {chosen === null ? <Text style={styles.hint}>{playing ? 'Ouça…' : 'Toque para ouvir de novo'}</Text> : null}
      {round.illustration ? <IllustrationView illustration={round.illustration} compact /> : null}
      <AnswerOptions
        options={round.options}
        answer={round.answer}
        chosen={chosen}
        onChoose={(i) => {
          setChosen(i);
          if (i === round.answer) setCorrect((c) => c + 1);
        }}
      />
      {chosen !== null && <Feedback ok={chosen === round.answer} explanation={round.explanation} onContinue={advance} />}
    </ScrollView>
  );
}

/** Mostra uma nota (nome ou pauta) e espera o aluno tocá-la no teclado. */
export function FindKeyStep({ step, onNext }: StepProps<'find-key'>) {
  const { width, height } = useWindowDimensions();
  const notation = useSettings((s) => s.notation);
  const inputSource = useSettings((s) => s.inputSource);
  const micSensitivity = useSettings((s) => s.micSensitivity);
  const [index, setIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [flash, setFlash] = useState<{ midi: number; ok: boolean } | null>(null);
  const target = step.notes[index];
  const done = index >= step.notes.length;

  const layout = useMemo(() => {
    const low = Math.min(48, Math.floor(Math.min(...step.notes) / 12) * 12);
    const high = Math.max(72, Math.ceil((Math.max(...step.notes) + 1) / 12) * 12);
    return keyboardLayout(low, high, width - 16);
  }, [step.notes, width]);

  useEffect(() => {
    void inputHub.use(inputSource, { micSensitivity });
    return () => inputHub.stop();
  }, [inputSource, micSensitivity]);

  useEffect(() => {
    return inputHub.subscribe((e) => {
      if (e.source !== 'mic') {
        if (e.type === 'on') synth.noteOn(e.midi, e.velocity);
        else synth.noteOff(e.midi);
      }
      if (e.type !== 'on' || target === undefined) return;
      // Pelo microfone (ou quando a atividade pede) aceitamos a nota em qualquer oitava.
      const ok =
        e.midi === target || ((step.anyOctave || e.source === 'mic') && pitchClass(e.midi) === pitchClass(target));
      setFlash({ midi: e.midi, ok });
      if (ok) {
        setTimeout(() => {
          setFlash(null);
          setIndex((i) => i + 1);
        }, 350);
      } else {
        setMistakes((m) => m + 1);
      }
    });
  }, [target, step.anyOctave]);

  useEffect(() => {
    if (done) onNext(step.notes.length / (step.notes.length + mistakes));
    // Só dispara ao terminar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (done || target === undefined) return null;
  const hints = new Map<number, KeyHint>();
  if (flash) hints.set(flash.midi, { state: flash.ok ? 'correct' : 'wrong' });

  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <View style={[styles.center, { flex: 1 }]}>
        <RoundCounter title={step.title} index={index} total={step.notes.length} />
        <Animated.View key={index} entering={ZoomIn.duration(160)} style={{ alignItems: 'center' }}>
          {step.show === 'staff' ? (
            <StaffNote midi={target} clef={step.clef} height={Math.min(140, height * 0.3)} />
          ) : (
            <Text style={styles.bigNote}>{noteName(target, notation)}</Text>
          )}
        </Animated.View>
        <Text style={styles.body}>
          {step.anyOctave ? 'Toque esta nota em qualquer lugar do teclado' : 'Toque esta nota no teclado'}
        </Text>
      </View>
      <View style={{ alignItems: 'center', paddingBottom: space.sm }}>
        <PianoKeyboard
          layout={layout}
          height={Math.min(160, height * 0.32)}
          hints={hints}
          notation={notation}
          showLabels={false}
          onNoteOn={(midi) => inputHub.emit({ type: 'on', midi, velocity: 0.8, source: 'touch' })}
          onNoteOff={(midi) => inputHub.emit({ type: 'off', midi, velocity: 0, source: 'touch' })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: space.sm + 4, padding: space.md, flexGrow: 1 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center', maxWidth: 640 },
  body: { color: colors.textDim, fontSize: 16, textAlign: 'center', maxWidth: 560, lineHeight: 22 },
  hint: { color: colors.textDim, fontSize: 13 },
  counterRow: { alignItems: 'center', gap: 6 },
  counter: { color: colors.primary, fontWeight: '800', letterSpacing: 0.5 },
  pips: { flexDirection: 'row', gap: 4 },
  pip: { width: 16, height: 5, borderRadius: 3, backgroundColor: colors.card },
  pipDone: { backgroundColor: colors.success },
  pipCurrent: { backgroundColor: colors.primary },
  options: {
    gap: space.sm,
    width: '100%',
    maxWidth: 640,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  option: {
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: radius.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 4,
  },
  optionText: { color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  feedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    maxWidth: 640,
    width: '100%',
    justifyContent: 'space-between',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: space.sm,
    paddingLeft: space.md,
  },
  explanation: { color: colors.textDim, fontSize: 14 },
  feedbackTitle: { fontSize: 18, fontWeight: '900' },
  bigNote: { color: colors.text, fontSize: 64, fontWeight: '900' },
  listenBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 5,
    borderBottomColor: colors.primaryDark,
  },
  listenBtnOn: { backgroundColor: colors.success, borderBottomColor: '#2E9E46' },
  listenIcon: { color: '#fff', fontSize: 28, fontWeight: '900' },
});
