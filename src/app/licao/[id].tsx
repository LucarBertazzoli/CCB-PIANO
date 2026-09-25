import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { keyboardLayout } from '@/components/keyboard-layout';
import { PianoKeyboard, type KeyHint } from '@/components/PianoKeyboard';
import { Button, Stars } from '@/components/ui';
import { getLesson, getSong } from '@/content';
import type { LessonStep } from '@/content/types';
import { starsFor } from '@/engine/scoring';
import { FindKeyStep, LinkStep, QuizStep } from '@/features/lesson/TheorySteps';
import type { PracticeMode } from '@/engine/practice-session';
import { PracticePlayer } from '@/features/player/PracticePlayer';
import { useLandscape } from '@/features/player/use-landscape';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { colors, radius, space } from '@/theme';

const STEP_MODE: Record<Exclude<LessonStep['type'], 'intro'>, PracticeMode> = {
  watch: 'demo',
  practice: 'wait',
  play: 'rhythm',
};

/** Executa uma lição passo a passo: explicação → ouvir → praticar → tocar. */
export default function LessonScreen() {
  useLandscape();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ref = getLesson(id);
  const [stepIndex, setStepIndex] = useState(0);
  const [stars, setStars] = useState<number[]>([]);
  const completeLesson = useProgress((s) => s.completeLesson);
  const recordSongResult = useProgress((s) => s.recordSongResult);

  if (!ref) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>Lição não encontrada</Text>
        <Button title="Voltar" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const { lesson } = ref;
  const steps = lesson.steps;
  const done = stepIndex >= steps.length;
  const lessonStars = (stars.length ? Math.min(...stars) : 3) as 0 | 1 | 2 | 3;

  const next = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex >= steps.length) completeLesson(lesson.id, lessonStars);
    setStepIndex(nextIndex);
  };

  if (done) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.celebrate}>🎉</Text>
        <Text style={styles.title}>Lição concluída!</Text>
        <Stars count={lessonStars} size={40} />
        <Text style={styles.body}>{lesson.title}</Text>
        <Button title="Voltar à trilha" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const step = steps[stepIndex];
  const header = (
    <View style={styles.dots}>
      {steps.map((s, i) => (
        <View key={i} style={[styles.dot, i < stepIndex && styles.dotDone, i === stepIndex && styles.dotCurrent]} />
      ))}
    </View>
  );

  if (step.type === 'video' || step.type === 'material' || step.type === 'quiz' || step.type === 'find-key') {
    const onScored = (score?: number) => {
      if (score !== undefined) setStars((prev) => [...prev, starsFor(score)]);
      next();
    };
    return (
      <SafeAreaView style={styles.safe}>
        {header}
        {lesson.status === 'draft' && stepIndex === 0 ? (
          <Text style={styles.draft}>
            Os estudos interativos desta unidade estão em preparação. Por enquanto, use o material oficial.
          </Text>
        ) : null}
        <View style={{ flex: 1 }}>
          {step.type === 'quiz' ? (
            <QuizStep key={stepIndex} step={step} onNext={onScored} />
          ) : step.type === 'find-key' ? (
            <FindKeyStep key={stepIndex} step={step} onNext={onScored} />
          ) : (
            <LinkStep key={stepIndex} step={step} onNext={onScored} />
          )}
        </View>
        <Button title="Sair da lição" variant="ghost" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  if (step.type === 'intro') {
    return (
      <SafeAreaView style={styles.safe}>
        {header}
        <IntroStep step={step} onNext={next} onExit={() => router.back()} />
      </SafeAreaView>
    );
  }

  const song = getSong(step.songId);
  if (!song) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.title}>Música “{step.songId}” não encontrada</Text>
        <Button title="Pular" onPress={next} />
      </SafeAreaView>
    );
  }

  const minStars = step.type === 'play' ? (step.minStars ?? 1) : 0;
  return (
    <PracticePlayer
      key={stepIndex}
      song={song}
      title={`${lesson.title} • ${step.title}`}
      initialHands={step.hands}
      initialMode={STEP_MODE[step.type]}
      initialTempo={step.type === 'watch' ? 1 : (step.tempoFactor ?? 1)}
      sectionId={step.sectionId}
      locked
      onExit={() => router.back()}
      onFinished={(score, mode) => {
        if (mode !== 'demo') recordSongResult(song.id, score.stars, score.accuracy);
      }}
      continueLabel={stepIndex === steps.length - 1 ? 'Concluir' : 'Continuar'}
      continueBlockedReason={(score) =>
        score.stars < minStars ? `Consiga ${minStars} ${minStars === 1 ? 'estrela' : 'estrelas'} para continuar.` : null
      }
      onContinue={(score) => {
        if (step.type === 'play') setStars((prev) => [...prev, score.stars]);
        next();
      }}
    />
  );
}

function IntroStep({
  step,
  onNext,
  onExit,
}: {
  step: Extract<LessonStep, { type: 'intro' }>;
  onNext: () => void;
  onExit: () => void;
}) {
  const { width } = useWindowDimensions();
  const notation = useSettings((s) => s.notation);
  const highlight = step.highlight;
  const layout = useMemo(() => {
    if (!highlight?.length) return null;
    const low = Math.min(48, Math.floor(Math.min(...highlight) / 12) * 12);
    const high = Math.max(72, Math.ceil((Math.max(...highlight) + 1) / 12) * 12);
    return keyboardLayout(low, high, Math.min(width - 32, 720));
  }, [highlight, width]);
  const hints = useMemo(
    () =>
      new Map<number, KeyHint>(
        (highlight ?? []).map((m) => [m, { state: m < 60 ? 'expected-left' : 'expected-right' }]),
      ),
    [highlight],
  );

  return (
    <View style={styles.intro}>
      <Text style={styles.title}>{step.title}</Text>
      <Text style={styles.body}>{step.body}</Text>
      {layout ? <PianoKeyboard layout={layout} height={110} hints={hints} notation={notation} /> : null}
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Button title="Sair" variant="secondary" onPress={onExit} />
        <Button title="Próximo" onPress={onNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: space.md },
  intro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.md },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', textAlign: 'center' },
  body: { color: colors.textDim, fontSize: 17, textAlign: 'center', maxWidth: 560, lineHeight: 24 },
  celebrate: { fontSize: 56 },
  draft: {
    color: colors.warning,
    textAlign: 'center',
    paddingHorizontal: space.md,
    paddingTop: space.sm,
  },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', paddingTop: space.sm },
  dot: { width: 28, height: 6, borderRadius: radius.pill, backgroundColor: colors.card },
  dotDone: { backgroundColor: colors.success },
  dotCurrent: { backgroundColor: colors.primary },
});
