import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IllustrationView } from '@/components/IllustrationView';
import { Button, Stars } from '@/components/ui';
import { getLesson, getSong, nextLessonAfter } from '@/content';
import type { AnyLessonStep, LessonStep } from '@/content/types';
import type { PracticeMode } from '@/engine/practice-session';
import { starsFor } from '@/engine/scoring';
import { FindKeyStep, ListenStep, QuizStep } from '@/features/lesson/TheorySteps';
import { PracticePlayer } from '@/features/player/PracticePlayer';
import { useLandscape } from '@/features/player/use-landscape';
import { useProgress } from '@/store/progress';
import { colors, radius, space } from '@/theme';

const STEP_MODE: Record<'watch' | 'practice' | 'play' | 'rhythm', PracticeMode> = {
  watch: 'demo',
  practice: 'wait',
  play: 'rhythm',
  rhythm: 'rhythm',
};

/** Executa uma lição passo a passo, como uma fase do Simply Piano. */
export default function LessonScreen() {
  useLandscape();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ref = getLesson(id);
  const [stepIndex, setStepIndex] = useState(0);
  const [stars, setStars] = useState<number[]>([]);
  const completeLesson = useProgress((s) => s.completeLesson);

  if (!ref) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.title}>Lição não encontrada</Text>
        <Button title="Voltar" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const { lesson } = ref;
  const steps = lesson.steps;
  const done = stepIndex >= steps.length;
  const lessonStars = (stars.length ? Math.min(...stars) : 3) as 0 | 1 | 2 | 3;
  const exit = () => router.back();

  const next = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex >= steps.length) completeLesson(lesson.id, lessonStars);
    setStepIndex(nextIndex);
  };
  const scored = (score?: number) => {
    if (score !== undefined) setStars((prev) => [...prev, starsFor(score)]);
    next();
  };

  if (done) {
    const following = nextLessonAfter(lesson.id);
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Animated.Text entering={ZoomIn.springify()} style={styles.celebrate}>
          🎹
        </Animated.Text>
        <Text style={styles.title}>Lição concluída!</Text>
        <Animated.View entering={FadeInDown.delay(150)}>
          <Stars count={lessonStars} size={44} />
        </Animated.View>
        <Text style={styles.body}>{lesson.title}</Text>
        <View style={styles.row}>
          <Button title="Voltar à trilha" variant="secondary" onPress={exit} />
          {following ? (
            <Button
              title="Próxima lição"
              onPress={() => router.replace({ pathname: '/licao/[id]', params: { id: following.lesson.id } })}
            />
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  const step = steps[stepIndex];

  if (step.type === 'watch' || step.type === 'practice' || step.type === 'play' || step.type === 'rhythm') {
    return <PlayerStep key={stepIndex} step={step} lessonTitle={lesson.title} last={stepIndex === steps.length - 1} onExit={exit} onDone={scored} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LessonTopBar progress={stepIndex / steps.length} onExit={exit} />
      <View style={{ flex: 1 }}>
        {step.type === 'intro' ? (
          <IntroStep key={stepIndex} step={step} onNext={next} />
        ) : step.type === 'quiz' ? (
          <QuizStep key={stepIndex} step={step} onNext={scored} />
        ) : step.type === 'listen' ? (
          <ListenStep key={stepIndex} step={step} onNext={scored} />
        ) : (
          <FindKeyStep key={stepIndex} step={step} onNext={scored} />
        )}
      </View>
    </SafeAreaView>
  );
}

function LessonTopBar({ progress, onExit }: { progress: number; onExit: () => void }) {
  return (
    <View style={styles.topBar}>
      <Pressable onPress={onExit} hitSlop={12} style={styles.close} accessibilityLabel="Sair da lição">
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(4, progress * 100)}%` }]} />
      </View>
    </View>
  );
}

function PlayerStep({
  step,
  lessonTitle,
  last,
  onExit,
  onDone,
}: {
  step: Extract<AnyLessonStep, { type: 'watch' | 'practice' | 'play' | 'rhythm' }>;
  lessonTitle: string;
  last: boolean;
  onExit: () => void;
  onDone: (score?: number) => void;
}) {
  const recordSongResult = useProgress((s) => s.recordSongResult);
  const song = getSong(step.songId);
  if (!song) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.title}>Música “{step.songId}” não encontrada</Text>
        <Button title="Pular" onPress={() => onDone()} />
      </SafeAreaView>
    );
  }
  const rhythm = step.type === 'rhythm';
  const minStars = step.type === 'play' ? (step.minStars ?? 1) : rhythm ? 1 : 0;
  const view = rhythm ? 'sheet' : step.view;
  return (
    <PracticePlayer
      song={song}
      title={`${lessonTitle} • ${step.title}`}
      initialHands={rhythm ? 'right' : step.hands}
      initialMode={STEP_MODE[step.type]}
      initialTempo={rhythm || step.type === 'watch' ? 1 : (step.tempoFactor ?? 1)}
      sectionId={rhythm ? undefined : step.sectionId}
      view={view}
      staves={rhythm ? 'treble' : undefined}
      rhythmOnly={rhythm}
      hint={rhythm ? (step.hint ?? 'Toque qualquer tecla no ritmo das figuras, junto com o metrônomo.') : undefined}
      locked
      onExit={onExit}
      onFinished={(score, mode) => {
        if (mode !== 'demo' && !rhythm) recordSongResult(song.id, score.stars, score.accuracy);
      }}
      continueLabel={last ? 'Concluir' : 'Continuar'}
      continueBlockedReason={(score) =>
        score.stars < minStars ? `Consiga ${minStars} ${minStars === 1 ? 'estrela' : 'estrelas'} para continuar.` : null
      }
      onContinue={(score) => onDone(step.type === 'play' || rhythm ? score.accuracy : undefined)}
    />
  );
}

function IntroStep({ step, onNext }: { step: Extract<LessonStep, { type: 'intro' }>; onNext: () => void }) {
  const illustration = step.illustration ?? (step.highlight ? { keys: step.highlight } : undefined);
  return (
    <Animated.ScrollView entering={FadeInDown.duration(200)} contentContainerStyle={styles.intro}>
      <Text style={styles.title}>{step.title}</Text>
      <Text style={styles.body}>{step.body}</Text>
      {illustration ? <IllustrationView illustration={illustration} /> : null}
      <Button title="Entendi" onPress={onNext} style={{ minWidth: 180 }} />
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.md },
  row: { flexDirection: 'row', gap: space.sm },
  intro: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.md },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', textAlign: 'center', maxWidth: 680 },
  body: { color: colors.textDim, fontSize: 17, textAlign: 'center', maxWidth: 600, lineHeight: 24 },
  celebrate: { fontSize: 60 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingTop: space.sm },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: colors.text, fontWeight: '800' },
  track: { flex: 1, height: 12, borderRadius: radius.pill, backgroundColor: colors.card, overflow: 'hidden' },
  fill: { height: 12, borderRadius: radius.pill, backgroundColor: colors.success },
});
