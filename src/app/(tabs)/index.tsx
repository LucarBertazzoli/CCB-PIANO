import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, Stars } from '@/components/ui';
import { allCourses, lessonsOf } from '@/content';
import { currentStreak, useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { colors, radius, space } from '@/theme';

/** Trilha de aprendizagem: unidades e lições em um caminho, como no Simply Piano. */
export default function LearnScreen() {
  const courses = allCourses();
  const [courseId, setCourseId] = useState(courses[0].id);
  const course = courses.find((c) => c.id === courseId) ?? courses[0];
  const lessonRecords = useProgress((s) => s.lessons);
  const practiceDays = useProgress((s) => s.practiceDays);
  const unlockAll = useSettings((s) => s.unlockAll);

  const refs = lessonsOf(course);
  const isUnlocked = (order: number) =>
    unlockAll || order === 0 || !!lessonRecords[refs[order - 1]?.lesson.id]?.completed;
  const nextLesson = refs.find((r) => !lessonRecords[r.lesson.id]?.completed) ?? refs[refs.length - 1];
  const streak = currentStreak(practiceDays);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>A paz de Deus!</Text>
            <Text style={styles.subtitle}>Vamos praticar hoje?</Text>
          </View>
          <View style={styles.streak}>
            <Text style={styles.streakNum}>🔥 {streak}</Text>
            <Text style={styles.streakLabel}>{streak === 1 ? 'dia' : 'dias'}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {courses.map((c) => (
            <Chip key={c.id} label={c.title} selected={c.id === course.id} onPress={() => setCourseId(c.id)} />
          ))}
        </ScrollView>

        <Text style={styles.courseDesc}>{course.description}</Text>

        {course.resources?.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {course.resources.map((r) => (
              <Chip key={r.url} label={`↗ ${r.label}`} onPress={() => void WebBrowser.openBrowserAsync(r.url)} />
            ))}
          </ScrollView>
        ) : null}

        {course.comingSoon ? (
          <View style={styles.soon}>
            <Text style={styles.unitTitle}>Em desenvolvimento</Text>
            <Text style={styles.unitDesc}>
              Este volume ainda está sendo preparado. Assim que o material for publicado, as unidades aparecerão aqui.
            </Text>
          </View>
        ) : null}

        {nextLesson && (
          <Pressable
            style={styles.continueCard}
            onPress={() => router.push({ pathname: '/licao/[id]', params: { id: nextLesson.lesson.id } })}>
            <Text style={styles.continueLabel}>CONTINUAR</Text>
            <Text style={styles.continueTitle}>{nextLesson.lesson.title}</Text>
            <Text style={styles.continueUnit}>{nextLesson.unit.title}</Text>
          </Pressable>
        )}

        {course.units.map((unit) => (
          <View key={unit.id} style={styles.unit}>
            <View style={styles.unitHeader}>
              <Text style={styles.unitTitle}>{unit.title}</Text>
              {unit.description ? <Text style={styles.unitDesc}>{unit.description}</Text> : null}
            </View>
            {unit.lessons.map((lesson) => {
              const ref = refs.find((r) => r.lesson.id === lesson.id)!;
              const record = lessonRecords[lesson.id];
              const unlocked = isUnlocked(ref.order);
              const offset = [0, 60, 90, 60, 0, -60, -90, -60][ref.order % 8];
              return (
                <View key={lesson.id} style={[styles.nodeRow, { transform: [{ translateX: offset }] }]}>
                  <Pressable
                    disabled={!unlocked}
                    onPress={() => router.push({ pathname: '/licao/[id]', params: { id: lesson.id } })}
                    style={({ pressed }) => [
                      styles.node,
                      record?.completed && styles.nodeDone,
                      !unlocked && styles.nodeLocked,
                      pressed && { transform: [{ scale: 0.95 }] },
                    ]}>
                    <Text style={styles.nodeIcon}>{!unlocked ? '🔒' : record?.completed ? '✓' : '▶'}</Text>
                  </Pressable>
                  <Text style={[styles.nodeTitle, !unlocked && { color: colors.textDim }]}>{lesson.title}</Text>
                  {record?.completed ? <Stars count={record.stars} size={14} /> : null}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.md, paddingBottom: 60, gap: space.md },
  header: { flexDirection: 'row', alignItems: 'center' },
  hello: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textDim, fontSize: 15 },
  streak: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  streakNum: { color: colors.warning, fontSize: 18, fontWeight: '800' },
  streakLabel: { color: colors.textDim, fontSize: 11 },
  continueCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  continueLabel: { color: '#CFE9FF', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  continueTitle: { color: '#fff', fontWeight: '800', fontSize: 22, marginTop: 4 },
  continueUnit: { color: '#CFE9FF', marginTop: 2 },
  courseDesc: { color: colors.textDim },
  soon: { backgroundColor: colors.bgElevated, borderRadius: radius.md, padding: space.md, gap: 4 },
  unit: { alignItems: 'center', gap: space.md, marginTop: space.md },
  unitHeader: {
    alignSelf: 'stretch',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: space.md,
  },
  unitTitle: { color: colors.text, fontWeight: '800', fontSize: 17 },
  unitDesc: { color: colors.textDim, marginTop: 2 },
  nodeRow: { alignItems: 'center', gap: 4 },
  node: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 5,
    borderBottomColor: colors.primaryDark,
  },
  nodeDone: { backgroundColor: colors.success, borderBottomColor: '#2E9E46' },
  nodeLocked: { backgroundColor: colors.card, borderBottomColor: colors.border },
  nodeIcon: { color: '#fff', fontSize: 26, fontWeight: '800' },
  nodeTitle: { color: colors.text, fontWeight: '700', textAlign: 'center', maxWidth: 160 },
});
