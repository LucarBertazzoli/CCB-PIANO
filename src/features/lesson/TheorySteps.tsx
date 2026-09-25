import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { synth } from '@/audio/synth';
import { keyboardLayout } from '@/components/keyboard-layout';
import { PianoKeyboard, type KeyHint } from '@/components/PianoKeyboard';
import { StaffNote } from '@/components/StaffNote';
import { Button } from '@/components/ui';
import type { TheoryStep } from '@/content/types';
import { inputHub } from '@/input/input-hub';
import { noteName } from '@/music/theory';
import { useSettings } from '@/store/settings';
import { colors, radius, space } from '@/theme';

type StepProps<T extends TheoryStep['type']> = {
  step: Extract<TheoryStep, { type: T }>;
  /** `score` 0..1 para passos avaliados (quiz, teclado). */
  onNext: (score?: number) => void;
};

/** Vídeo ou material oficial: abre o link e segue para o próximo passo. */
export function LinkStep({ step, onNext }: StepProps<'video' | 'material'>) {
  const [opened, setOpened] = useState(false);
  const url = step.type === 'video' && step.youtubeId ? `https://www.youtube.com/watch?v=${step.youtubeId}` : step.url;
  return (
    <View style={styles.center}>
      <Text style={styles.emoji}>{step.type === 'video' ? '🎬' : '📄'}</Text>
      <Text style={styles.title}>{step.title}</Text>
      {step.description ? <Text style={styles.body}>{step.description}</Text> : null}
      <View style={styles.row}>
        <Button
          title={step.type === 'video' ? 'Assistir' : 'Abrir material'}
          variant={opened ? 'secondary' : 'primary'}
          onPress={() => {
            if (!url) return;
            setOpened(true);
            void WebBrowser.openBrowserAsync(url);
          }}
        />
        <Button title={opened ? 'Próximo' : 'Pular'} variant={opened ? 'primary' : 'ghost'} onPress={() => onNext()} />
      </View>
    </View>
  );
}

/** Quiz de múltipla escolha, uma pergunta por vez. */
export function QuizStep({ step, onNext }: StepProps<'quiz'>) {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const q = step.questions[index];
  const answered = chosen !== null;

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
      <Text style={styles.counter}>
        {step.title} • {index + 1}/{step.questions.length}
      </Text>
      <Text style={styles.title}>{q.prompt}</Text>
      <View style={styles.options}>
        {q.options.map((opt, i) => {
          const isAnswer = i === q.answer;
          const bg = !answered
            ? colors.card
            : isAnswer
              ? colors.success
              : i === chosen
                ? colors.danger
                : colors.card;
          return (
            <Pressable
              key={i}
              disabled={answered}
              onPress={() => {
                setChosen(i);
                if (i === q.answer) setCorrect((c) => c + 1);
              }}
              style={[styles.option, { backgroundColor: bg }]}>
              <Text style={styles.optionText}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
      {answered && (
        <>
          <Text style={[styles.body, { color: chosen === q.answer ? colors.success : colors.danger }]}>
            {chosen === q.answer ? 'Muito bem!' : 'Quase! Veja a resposta certa.'}
          </Text>
          {q.explanation ? <Text style={styles.body}>{q.explanation}</Text> : null}
          <Button title="Continuar" onPress={advance} />
        </>
      )}
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
      // Pelo microfone aceitamos a nota em qualquer oitava do teclado real.
      const ok = e.midi === target || (e.source === 'mic' && e.midi % 12 === target % 12);
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
  }, [target]);

  useEffect(() => {
    if (index >= step.notes.length) {
      onNext(step.notes.length / (step.notes.length + mistakes));
    }
    // Só dispara ao terminar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const hints = new Map<number, KeyHint>();
  if (flash) hints.set(flash.midi, { state: flash.ok ? 'correct' : 'wrong' });
  if (target === undefined) return null;

  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <View style={[styles.center, { flex: 1 }]}>
        <Text style={styles.counter}>
          {step.title} • {index + 1}/{step.notes.length}
        </Text>
        {step.show === 'staff' ? (
          <StaffNote midi={target} height={Math.min(140, height * 0.3)} />
        ) : (
          <Text style={styles.bigNote}>{noteName(target, notation)}</Text>
        )}
        <Text style={styles.body}>Toque esta nota no teclado</Text>
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
  center: { alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.md, flexGrow: 1 },
  row: { flexDirection: 'row', gap: space.sm },
  emoji: { fontSize: 44 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', textAlign: 'center', maxWidth: 620 },
  body: { color: colors.textDim, fontSize: 16, textAlign: 'center', maxWidth: 560, lineHeight: 22 },
  counter: { color: colors.primary, fontWeight: '700' },
  options: { gap: space.sm, width: '100%', maxWidth: 640, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  option: {
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: radius.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionText: { color: colors.text, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  bigNote: { color: colors.text, fontSize: 64, fontWeight: '900' },
});
