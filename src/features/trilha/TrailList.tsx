import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { synth } from '@/audio/synth';
import { Icon } from '@/components/Icon';
import { isUnlocked, TRILHA, unitProgress, type Lesson, type Unit } from '@/content/trilha';
import { Segmented } from '@/features/player/controls';
import { useSettings } from '@/store/settings';
import { usePalette, useType } from '@/theme';

/**
 * Trilha de aprendizagem: lista simples, na ordem do MOR (Volume → Unidade →
 * lições). Tocar numa lição abre a mesma tela de tocar dos hinos.
 */
export function TrailList() {
  const p = usePalette();
  const t = useType();
  const [volume, setVolume] = useState<1 | 2>(1);
  const vol = TRILHA.find((v) => v.volume === volume)!;
  const stars = useSettings((s) => s.lessonStars);

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={[t.regular, styles.heading, { color: p.text }]}>Trilha de aprendizagem</Text>
          <Text style={[t.regular, styles.sub, { color: p.textDim }]}>
            Órgão, lição por lição, na ordem do MOR — Método de Estudos para Órgão Eletrônico.
          </Text>
        </View>
        <Segmented
          compact
          options={TRILHA.map((v) => ({ value: v.volume, label: v.title }))}
          value={volume}
          onChange={(v) => setVolume(v as 1 | 2)}
        />
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listInner} showsVerticalScrollIndicator={false}>
        {vol.units.map((u) => (
          <UnitCard key={u.id} unit={u} stars={stars} />
        ))}
        <Text style={[t.regular, styles.note, { color: p.textFaint }]}>
          Os Estudos e Exercícios aparecem “em preparação” até serem transcritos do livro do método.
        </Text>
      </ScrollView>
    </View>
  );
}

function UnitCard({ unit, stars }: { unit: Unit; stars: Record<string, number> }) {
  const p = usePalette();
  const t = useType();
  const { done, total } = unitProgress(unit, stars);
  return (
    <View style={[styles.card, { backgroundColor: p.surface, borderColor: p.border }]}>
      <View style={styles.cardHead}>
        <Text style={[t.bold, styles.unitNumber, { color: p.textDim }]}>UNIDADE {unit.number}</Text>
        <Text style={[t.bold, styles.unitTitle, { color: p.text }]} numberOfLines={1}>
          {unit.title}
        </Text>
        <Text style={[t.regular, styles.count, { color: p.textFaint }]}>
          {total ? `${done} de ${total}` : 'em preparação'}
        </Text>
      </View>
      <View style={styles.lessons}>
        {unit.lessons.map((l) => (
          <LessonChip key={l.id} lesson={l} stars={stars[l.id] ?? 0} locked={!isUnlocked(l.id, stars)} />
        ))}
      </View>
    </View>
  );
}

function LessonChip({ lesson, stars, locked }: { lesson: Lesson; stars: number; locked: boolean }) {
  const p = usePalette();
  const t = useType();
  if (!lesson.available) {
    return (
      <View style={[styles.chip, styles.chipPending, { borderColor: p.border }]} accessibilityLabel={`${lesson.title}, em preparação`}>
        <Text style={[t.regular, styles.chipText, { color: p.textFaint }]}>{lesson.title}</Text>
      </View>
    );
  }
  if (locked) {
    return (
      <View style={[styles.chip, { borderColor: p.border }]} accessibilityLabel={`${lesson.title}, bloqueada: termine a lição anterior`}>
        <Icon name="lock" size={11} color={p.textFaint} />
        <Text style={[t.regular, styles.chipText, { color: p.textFaint }]}>{lesson.title}</Text>
      </View>
    );
  }
  return (
    <Pressable
      onPress={() => {
        synth.unlock();
        router.push({ pathname: '/licao/[id]', params: { id: lesson.id } });
      }}
      accessibilityRole="button"
      accessibilityLabel={[lesson.title, lesson.detail, stars ? `${stars} de 3 estrelas` : null].filter(Boolean).join(', ')}
      style={({ pressed }) => [styles.chip, { backgroundColor: p.surfaceStrong, borderColor: p.border }, pressed && { opacity: 0.7 }]}>
      {stars ? (
        <View style={styles.stars}>
          {[0, 1, 2].map((i) => (
            <Icon key={i} name={i < stars ? 'star' : 'starOutline'} size={10} color={p.primary} />
          ))}
        </View>
      ) : (
        <Icon name="play" size={11} color={p.primary} />
      )}
      <Text style={[t.bold, styles.chipText, { color: p.text }]}>{lesson.title}</Text>
      {lesson.detail ? (
        <Text style={[t.regular, styles.chipDetail, { color: p.textDim }]} numberOfLines={1}>
          {lesson.detail}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', maxWidth: 980, alignSelf: 'center', paddingHorizontal: 28, paddingTop: 6, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'flex-end', gap: 16 },
  headText: { flex: 1, gap: 4 },
  heading: { fontSize: 24, letterSpacing: -0.3 },
  sub: { fontSize: 12 },
  list: { flex: 1 },
  listInner: { gap: 10, paddingBottom: 28 },
  card: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  unitNumber: { fontSize: 10, letterSpacing: 1.2 },
  unitTitle: { fontSize: 15, flexShrink: 1 },
  count: { fontSize: 11, marginLeft: 'auto' },
  lessons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, height: 32, maxWidth: 300 },
  chipPending: { borderStyle: 'dashed' },
  stars: { flexDirection: 'row', gap: 1 },
  chipText: { fontSize: 12 },
  chipDetail: { fontSize: 11, flexShrink: 1 },
  note: { fontSize: 11, lineHeight: 16, marginTop: 4 },
});
