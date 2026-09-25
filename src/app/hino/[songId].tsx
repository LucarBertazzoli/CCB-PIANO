import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Chip, SectionTitle, Stars } from '@/components/ui';
import { getSong } from '@/content';
import type { HandSelection } from '@/content/types';
import type { PracticeMode } from '@/engine/practice-session';
import { useProgress } from '@/store/progress';
import { colors, space } from '@/theme';

/** Detalhes da música: escolher mãos, trecho e modo antes de tocar. */
export default function SongDetailScreen() {
  const { songId } = useLocalSearchParams<{ songId: string }>();
  const song = getSong(songId);
  const record = useProgress((s) => s.songs[songId]);
  const [hands, setHands] = useState<HandSelection>('right');
  const [section, setSection] = useState<string | undefined>(undefined);

  if (!song) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>Música não encontrada</Text>
        <Button title="Voltar" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const play = (mode: PracticeMode) =>
    router.push({
      pathname: '/tocar/[songId]',
      params: { songId: song.id, hands, mode, ...(section ? { section } : {}) },
    });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Voltar</Text>
        </Pressable>
        {song.kind === 'hymn' ? <Text style={styles.number}>Hino {song.hymnNumber}</Text> : null}
        <Text style={styles.title}>{song.title}</Text>
        {song.subtitle ? <Text style={styles.subtitle}>{song.subtitle}</Text> : null}
        <View style={styles.row}>
          <Stars count={record?.bestStars ?? 0} />
          {record ? (
            <Text style={styles.meta}>
              Melhor: {Math.round(record.bestAccuracy * 100)}% • {record.plays} vezes
            </Text>
          ) : null}
        </View>

        <SectionTitle>Mãos</SectionTitle>
        <View style={styles.row}>
          <Chip label="Mão direita" selected={hands === 'right'} onPress={() => setHands('right')} />
          <Chip label="Mão esquerda" selected={hands === 'left'} onPress={() => setHands('left')} />
          <Chip label="Ambas" selected={hands === 'both'} onPress={() => setHands('both')} />
        </View>

        {song.sections?.length ? (
          <>
            <SectionTitle>Trecho</SectionTitle>
            <View style={[styles.row, { flexWrap: 'wrap' }]}>
              <Chip label="Música inteira" selected={!section} onPress={() => setSection(undefined)} />
              {song.sections.map((s) => (
                <Chip key={s.id} label={s.label} selected={section === s.id} onPress={() => setSection(s.id)} />
              ))}
            </View>
          </>
        ) : null}

        <SectionTitle>Como praticar</SectionTitle>
        <Card style={styles.modeCard}>
          <Text style={styles.modeTitle}>🎧 Ouvir</Text>
          <Text style={styles.modeText}>Veja as notas caindo e ouça como a música soa.</Text>
          <Button title="Ouvir" variant="secondary" onPress={() => play('demo')} />
        </Card>
        <Card style={styles.modeCard}>
          <Text style={styles.modeTitle}>🐢 Aprender</Text>
          <Text style={styles.modeText}>As notas esperam você tocar. Ideal para decorar o caminho dos dedos.</Text>
          <Button title="Aprender" onPress={() => play('wait')} />
        </Card>
        <Card style={styles.modeCard}>
          <Text style={styles.modeTitle}>🎵 Tocar</Text>
          <Text style={styles.modeText}>A música segue no andamento e você ganha estrelas pela precisão.</Text>
          <Button title="Tocar" variant="secondary" onPress={() => play('rhythm')} />
        </Card>
        {song.credits ? <Text style={styles.credits}>{song.credits}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.md, gap: space.sm, paddingBottom: 60 },
  back: { color: colors.primary, fontSize: 16, fontWeight: '600', marginBottom: space.sm },
  number: { color: colors.primary, fontWeight: '800' },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textDim },
  meta: { color: colors.textDim, fontSize: 13 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  modeCard: { gap: 8 },
  modeTitle: { color: colors.text, fontWeight: '800', fontSize: 17 },
  modeText: { color: colors.textDim },
  credits: { color: colors.textDim, fontSize: 12, marginTop: space.lg },
});
