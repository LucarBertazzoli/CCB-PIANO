import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, SectionTitle, Stars } from '@/components/ui';
import { allCourses, getSong, lessonsOf } from '@/content';
import { currentStreak, dayKey, useProgress } from '@/store/progress';
import { colors, space } from '@/theme';

export default function ProgressScreen() {
  const { songs, lessons, practiceDays, practiceSeconds } = useProgress();
  const streak = currentStreak(practiceDays);
  const minutes = Math.round(practiceSeconds / 60);

  // Últimos 7 dias
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { key: dayKey(d), label: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][d.getDay()] };
  });

  const played = Object.entries(songs).sort((a, b) => b[1].lastPlayedAt - a[1].lastPlayedAt);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Seu progresso</Text>
        <View style={styles.stats}>
          <Card style={styles.stat}>
            <Text style={styles.statNum}>🔥 {streak}</Text>
            <Text style={styles.statLabel}>dias seguidos</Text>
          </Card>
          <Card style={styles.stat}>
            <Text style={styles.statNum}>{minutes}</Text>
            <Text style={styles.statLabel}>minutos tocados</Text>
          </Card>
          <Card style={styles.stat}>
            <Text style={styles.statNum}>{Object.values(lessons).filter((l) => l.completed).length}</Text>
            <Text style={styles.statLabel}>lições concluídas</Text>
          </Card>
        </View>

        <SectionTitle>Esta semana</SectionTitle>
        <View style={styles.week}>
          {week.map((d) => (
            <View key={d.key} style={{ alignItems: 'center', gap: 4 }}>
              <View style={[styles.day, practiceDays.includes(d.key) && styles.dayOn]} />
              <Text style={styles.statLabel}>{d.label}</Text>
            </View>
          ))}
        </View>

        <SectionTitle>Cursos</SectionTitle>
        {allCourses()
          .filter((c) => c.units.length)
          .map((c) => {
            const refs = lessonsOf(c);
            const done = refs.filter((r) => lessons[r.lesson.id]?.completed).length;
            return (
              <View key={c.id} style={{ marginBottom: space.sm }}>
                <Text style={styles.courseTitle}>
                  {c.title} — {done}/{refs.length}
                </Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${(done / Math.max(1, refs.length)) * 100}%` }]} />
                </View>
              </View>
            );
          })}

        <SectionTitle>Músicas tocadas</SectionTitle>
        {played.length === 0 ? <Text style={styles.statLabel}>Nenhuma ainda. Vamos começar?</Text> : null}
        {played.map(([id, r]) => (
          <View key={id} style={styles.songRow}>
            <Text style={styles.songTitle}>{getSong(id)?.title ?? id}</Text>
            <Text style={styles.statLabel}>{Math.round(r.bestAccuracy * 100)}%</Text>
            <Stars count={r.bestStars} size={14} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.md, paddingBottom: 60 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: space.md },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { color: colors.text, fontSize: 24, fontWeight: '900' },
  statLabel: { color: colors.textDim, fontSize: 12 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.card },
  dayOn: { backgroundColor: colors.success },
  courseTitle: { color: colors.text, fontWeight: '600', marginBottom: 4 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.card, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: colors.primary },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  songTitle: { flex: 1, color: colors.text, fontWeight: '600' },
});
