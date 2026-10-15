import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { MOR_VOLUMES } from '@/content/mor-materiais';
import { MOR_GERAL, type MorFile, type MorGroup } from '@/content/mor-tipos';
import { getUnit, isUnlocked } from '@/content/trilha';
import { RoundButton, SectionTitle } from '@/features/player/controls';
import { useSettings } from '@/store/settings';
import { usePalette, useType } from '@/theme';

import { MorViewer, openMor } from './MorViewer';
import { LessonChip } from './TrailList';

const TYPE_ICON: Record<MorFile['type'], IconName> = { pdf: 'doc', slides: 'slides', imagem: 'image' };

/**
 * Página de uma unidade da trilha (ou dos materiais gerais de um volume):
 * lições de tocar, plano de aula e as atividades publicadas pela CCB.
 * `id` é `v1-u3` (unidade) ou `v1` (volume).
 */
export function Materials({ id }: { id: string }) {
  const p = usePalette();
  const t = useType();
  const insets = useSafeAreaInsets();
  const stars = useSettings((s) => s.lessonStars);
  const [viewing, setViewing] = useState<MorFile | null>(null);

  const unit = getUnit(id);
  const volume = unit?.volume ?? (id === 'v2' ? 2 : 1);
  const kicker = unit ? `VOLUME ${volume} · UNIDADE ${unit.number}` : `VOLUME ${volume}`;
  const title = unit ? (unit.mor?.title ?? unit.title) : 'Materiais do volume';

  const groups: MorGroup[] = unit
    ? [
        ...(unit.mor ? [{ title: 'Plano de aula', files: [{ id: unit.mor.plano, title: `Plano de aula da Unidade ${unit.number}`, type: 'pdf' as const }] }] : []),
        ...(unit.mor?.groups ?? []),
      ]
    : [
        { title: 'Planos de aula e cadernos', files: MOR_VOLUMES[volume] },
        { title: 'Para todos os volumes', files: MOR_GERAL },
      ];

  const exit = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={[styles.screen, { backgroundColor: p.bg }]}>
      <View style={[styles.head, { paddingTop: insets.top + 12, paddingLeft: insets.left + 20, paddingRight: insets.right + 20 }]}>
        <RoundButton icon="back" size={40} onPress={exit} accessibilityLabel="Voltar à trilha" />
        <View style={styles.headText}>
          <Text style={[t.bold, styles.kicker, { color: p.textDim }]}>{kicker}</Text>
          <Text style={[t.regular, styles.title, { color: p.text }]} numberOfLines={2}>
            {title}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.listInner, { paddingLeft: insets.left + 20, paddingRight: insets.right + 20, paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}>
        {unit && unit.lessons.length ? (
          <View style={styles.section}>
            <SectionTitle>Tocar</SectionTitle>
            <View style={styles.chips}>
              {unit.lessons.map((l) => (
                <LessonChip key={l.id} lesson={l} stars={stars[l.id] ?? 0} locked={!isUnlocked(l.id, stars)} />
              ))}
            </View>
          </View>
        ) : null}

        {groups.map((g) => (
          <View key={g.title} style={styles.section}>
            <SectionTitle>{`${g.title}${g.files.length > 1 ? ` · ${g.files.length}` : ''}`}</SectionTitle>
            <View style={styles.grid}>
              {g.files.map((f) => (
                <Pressable
                  key={f.id || f.url}
                  onPress={() => openMor(f, setViewing)}
                  accessibilityRole="button"
                  accessibilityLabel={f.title}
                  style={({ pressed }) => [styles.file, { backgroundColor: p.surface, borderColor: p.border }, pressed && { opacity: 0.7 }]}>
                  <Icon name={TYPE_ICON[f.type]} size={18} color={p.primary} />
                  <Text style={[t.regular, styles.fileText, { color: p.text }]} numberOfLines={2}>
                    {f.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Text style={[t.regular, styles.note, { color: p.textFaint }]}>
          Materiais do MOR publicados pela Congregação Cristã no Brasil.
        </Text>
      </ScrollView>

      {viewing ? <MorViewer file={viewing} onClose={() => setViewing(null)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%', maxWidth: 1020, alignSelf: 'center', paddingBottom: 10 },
  headText: { flex: 1, gap: 2 },
  kicker: { fontSize: 10, letterSpacing: 1.2 },
  title: { fontSize: 22, letterSpacing: -0.3 },
  list: { flex: 1 },
  listInner: { width: '100%', maxWidth: 1020, alignSelf: 'center', gap: 18 },
  section: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  file: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexGrow: 1,
    flexBasis: 280,
    maxWidth: 480,
  },
  fileText: { flex: 1, fontSize: 13, lineHeight: 17 },
  note: { fontSize: 11 },
});
