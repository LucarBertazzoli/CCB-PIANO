import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, Stars } from '@/components/ui';
import { allCourses, lessonsOf } from '@/content';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { colors, radius, space } from '@/theme';

/** Cores das unidades ao longo da trilha (alternadas, como “mundos”). */
const UNIT_COLORS = ['#3FA9F5', '#8E6CFF', '#2FBF8F', '#F5A43F', '#F2607A', '#35B6C9'];
/** Deslocamento horizontal dos nós, formando um caminho em zigue-zague. */
const ZIGZAG = [0, 56, 84, 56, 0, -56, -84, -56];

/** Trilha de aprendizagem: unidades e lições em um caminho, como no Simply Piano. */
export default function PathScreen() {
  const courses = allCourses();
  const [courseId, setCourseId] = useState(courses[0].id);
  const course = courses.find((c) => c.id === courseId) ?? courses[0];
  const lessonRecords = useProgress((s) => s.lessons);
  const unlockAll = useSettings((s) => s.unlockAll);

  const refs = lessonsOf(course);
  const isUnlocked = (order: number) =>
    unlockAll || order === 0 || !!lessonRecords[refs[order - 1]?.lesson.id]?.completed;
  const nextLesson = refs.find((r) => !lessonRecords[r.lesson.id]?.completed);
  const open = (id: string) => router.push({ pathname: '/licao/[id]', params: { id } });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.hello}>A paz de Deus!</Text>
          <Text style={styles.subtitle}>{course.description}</Text>
        </View>

        {courses.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {courses.map((c) => (
              <Chip key={c.id} label={c.title} selected={c.id === course.id} onPress={() => setCourseId(c.id)} />
            ))}
          </ScrollView>
        ) : null}

        {nextLesson ? (
          <Pressable style={styles.continueCard} onPress={() => open(nextLesson.lesson.id)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.continueLabel}>{nextLesson.order === 0 ? 'COMEÇAR' : 'CONTINUAR'}</Text>
              <Text style={styles.continueTitle}>{nextLesson.lesson.title}</Text>
              <Text style={styles.continueUnit}>{nextLesson.unit.title}</Text>
            </View>
            <View style={styles.playBig}>
              <Text style={styles.playBigIcon}>▶</Text>
            </View>
          </Pressable>
        ) : (
          <View style={styles.continueCard}>
            <Text style={styles.continueTitle}>Você concluiu a trilha! 🎉</Text>
          </View>
        )}

        {course.units.map((unit, unitIndex) => {
          const color = UNIT_COLORS[unitIndex % UNIT_COLORS.length];
          return (
            <View key={unit.id} style={styles.unit}>
              <View style={[styles.unitHeader, { backgroundColor: color }]}>
                <Text style={styles.unitNumber}>NÍVEL {unitIndex + 1}</Text>
                <Text style={styles.unitTitle}>{unit.title}</Text>
                {unit.description ? <Text style={styles.unitDesc}>{unit.description}</Text> : null}
              </View>
              {unit.lessons.map((lesson) => {
                const ref = refs.find((r) => r.lesson.id === lesson.id)!;
                const record = lessonRecords[lesson.id];
                const unlocked = isUnlocked(ref.order);
                const current = nextLesson?.lesson.id === lesson.id;
                return (
                  <Animated.View
                    key={lesson.id}
                    entering={FadeInUp.delay(Math.min(ref.order, 8) * 40)}
                    style={[styles.nodeRow, { transform: [{ translateX: ZIGZAG[ref.order % ZIGZAG.length] }] }]}>
                    {current ? <Text style={styles.here}>Você está aqui</Text> : null}
                    <Pressable
                      disabled={!unlocked}
                      onPress={() => open(lesson.id)}
                      accessibilityLabel={lesson.title}
                      style={({ pressed }) => [
                        styles.node,
                        { backgroundColor: color, borderBottomColor: shade(color) },
                        record?.completed && styles.nodeDone,
                        !unlocked && styles.nodeLocked,
                        current && styles.nodeCurrent,
                        pressed && { transform: [{ scale: 0.94 }] },
                      ]}>
                      <Text style={styles.nodeIcon}>{!unlocked ? '🔒' : record?.completed ? '✓' : (lesson.icon ?? '▶')}</Text>
                    </Pressable>
                    <Text style={[styles.nodeTitle, !unlocked && { color: colors.textDim }]}>{lesson.title}</Text>
                    {record?.completed ? <Stars count={record.stars} size={14} /> : null}
                  </Animated.View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Escurece uma cor hex (borda inferior “3D” dos botões). */
function shade(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.round(v * 0.72));
  const r = f(n >> 16);
  const g = f((n >> 8) & 0xff);
  const b = f(n & 0xff);
  return `rgb(${r},${g},${b})`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.md, paddingBottom: 80, gap: space.md },
  hello: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textDim, fontSize: 14, marginTop: 2 },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  continueLabel: { color: '#CFE9FF', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  continueTitle: { color: '#fff', fontWeight: '800', fontSize: 22, marginTop: 4 },
  continueUnit: { color: '#CFE9FF', marginTop: 2 },
  playBig: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBigIcon: { color: colors.primaryDark, fontSize: 24, fontWeight: '900', marginLeft: 3 },
  unit: { alignItems: 'center', gap: space.md, marginTop: space.md },
  unitHeader: {
    alignSelf: 'stretch',
    borderRadius: radius.md,
    padding: space.md,
  },
  unitNumber: { color: 'rgba(255,255,255,0.8)', fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  unitTitle: { color: '#fff', fontWeight: '800', fontSize: 18 },
  unitDesc: { color: 'rgba(255,255,255,0.85)', marginTop: 2, fontSize: 12 },
  nodeRow: { alignItems: 'center', gap: 4 },
  here: {
    color: colors.bg,
    backgroundColor: colors.warning,
    fontWeight: '800',
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  node: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 6,
  },
  nodeCurrent: { borderWidth: 4, borderColor: '#fff', borderBottomWidth: 6 },
  nodeDone: { backgroundColor: colors.success, borderBottomColor: '#2E9E46' },
  nodeLocked: { backgroundColor: colors.card, borderBottomColor: colors.border },
  nodeIcon: { color: '#fff', fontSize: 28, fontWeight: '800' },
  nodeTitle: { color: colors.text, fontWeight: '700', textAlign: 'center', maxWidth: 170 },
});
