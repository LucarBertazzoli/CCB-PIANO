import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, SectionTitle, Stars } from '@/components/ui';
import { getSong } from '@/content';
import type { HandSelection, Voice } from '@/content/types';
import type { PracticeMode } from '@/engine/practice-session';
import { useProgress } from '@/store/progress';
import { useSettings, type ViewMode } from '@/store/settings';
import { colors, space } from '@/theme';

const VOICES: { value: Voice; label: string; hand: 'right' | 'left' }[] = [
  { value: 'soprano', label: 'Soprano', hand: 'right' },
  { value: 'alto', label: 'Contralto', hand: 'right' },
  { value: 'tenor', label: 'Tenor', hand: 'left' },
  { value: 'bass', label: 'Baixo', hand: 'left' },
  { value: 'pedal', label: 'Pedaleira', hand: 'left' },
];

const MODES: { mode: PracticeMode; icon: string; title: string; text: string; primary?: boolean }[] = [
  { mode: 'demo', icon: '🎧', title: 'Ouvir', text: 'O app toca o hino e você acompanha a partitura.' },
  { mode: 'wait', icon: '🐢', title: 'Aprender', text: 'Para em cada nota e espera você tocar. Sem pressa.', primary: true },
  { mode: 'rhythm', icon: '🎵', title: 'Tocar', text: 'No andamento, com estrelas pela precisão.' },
];

/** Detalhes do hino: instrumento, visualização, mãos/vozes, trecho e modo. */
export default function HymnDetailScreen() {
  const { songId } = useLocalSearchParams<{ songId: string }>();
  const song = getSong(songId);
  const record = useProgress((s) => s.songs[songId]);
  const instrument = useSettings((s) => s.instrument);
  const viewMode = useSettings((s) => s.viewMode);
  const set = useSettings((s) => s.set);
  const [hands, setHands] = useState<HandSelection>('right');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [section, setSection] = useState<string | undefined>(undefined);

  if (!song) {
    return (
      <SafeAreaView style={[styles.safe, { padding: space.md, gap: space.md }]}>
        <Text style={styles.title}>Hino não encontrado</Text>
        <Button title="Voltar" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const hasVoices = song.notes.some((n) => n.voice);
  const view: ViewMode = viewMode === 'falling' ? 'falling' : 'page';

  const toggleVoice = (v: Voice) => {
    const next = voices.includes(v) ? voices.filter((x) => x !== v) : [...voices, v];
    setVoices(next);
    // Ajusta as mãos para cobrir as vozes escolhidas.
    if (next.length) {
      const handsUsed = new Set(next.map((x) => VOICES.find((o) => o.value === x)!.hand));
      setHands(handsUsed.size === 2 ? 'both' : [...handsUsed][0]);
    }
  };

  const play = (mode: PracticeMode) =>
    router.push({
      pathname: '/tocar/[songId]',
      params: {
        songId: song.id,
        hands,
        mode,
        view,
        ...(voices.length ? { voices: voices.join(',') } : {}),
        ...(section ? { section } : {}),
      },
    });

  return (
    <SafeAreaView style={[styles.safe, styles.columns]}>
      <ScrollView style={{ flex: 1.3 }} contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Hinário</Text>
        </Pressable>
        {song.hymnNumber ? <Text style={styles.number}>Hino {song.hymnNumber}</Text> : null}
        {song.tempoMark ? (
          <Text style={styles.meta}>
            {song.timeSignature.join('/')} • {song.tempoMark.unit === 'e' ? '♪' : song.tempoMark.unit === 'h' ? 'mínima' : '♩'} = {song.tempoMark.min}–{song.tempoMark.max}
          </Text>
        ) : null}
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

        <SectionTitle>Instrumento</SectionTitle>
        <View style={styles.row}>
          <Chip label="🎹 Piano" selected={instrument === 'piano'} onPress={() => set({ instrument: 'piano' })} />
          <Chip label="⛪ Órgão" selected={instrument === 'organ'} onPress={() => set({ instrument: 'organ' })} />
        </View>

        <SectionTitle>Ver como</SectionTitle>
        <View style={styles.row}>
          <Chip label="♪ Partitura" selected={view === 'page'} onPress={() => set({ viewMode: 'page' })} />
          <Chip label="▮ Notas caindo" selected={view === 'falling'} onPress={() => set({ viewMode: 'falling' })} />
        </View>

        <SectionTitle>O que você vai tocar</SectionTitle>
        <View style={[styles.row, { flexWrap: 'wrap' }]}>
          <Chip label="Mão direita" selected={hands === 'right' && !voices.length} onPress={() => { setVoices([]); setHands('right'); }} />
          <Chip label="Mão esquerda" selected={hands === 'left' && !voices.length} onPress={() => { setVoices([]); setHands('left'); }} />
          <Chip label="Duas mãos" selected={hands === 'both' && !voices.length} onPress={() => { setVoices([]); setHands('both'); }} />
          {instrument === 'organ' ? (
            <Chip
              label="Mãos + pedaleira"
              selected={voices.length === 5}
              onPress={() => {
                setVoices(['soprano', 'alto', 'tenor', 'bass', 'pedal']);
                setHands('both');
              }}
            />
          ) : null}
        </View>
        {hasVoices ? (
          <>
            <Text style={styles.hint}>
              Ou escolha as vozes (as outras tocam junto com você).
              {instrument === 'organ' ? ' No órgão a pedaleira toca sozinha, a menos que você a escolha.' : ''}
            </Text>
            <View style={[styles.row, { flexWrap: 'wrap' }]}>
              {VOICES.filter((v) => v.value !== 'pedal' || instrument === 'organ').map((v) => (
                <Chip key={v.value} label={v.label} selected={voices.includes(v.value)} onPress={() => toggleVoice(v.value)} />
              ))}
            </View>
          </>
        ) : null}

        {song.sections?.length ? (
          <>
            <SectionTitle>Trecho</SectionTitle>
            <View style={[styles.row, { flexWrap: 'wrap' }]}>
              <Chip label="Hino inteiro" selected={!section} onPress={() => setSection(undefined)} />
              {song.sections.map((s) => (
                <Chip key={s.id} label={s.label} selected={section === s.id} onPress={() => setSection(s.id)} />
              ))}
            </View>
          </>
        ) : null}

        {song.credits ? <Text style={styles.credits}>{song.credits}</Text> : null}
      </ScrollView>

      {/* Coluna da direita: como praticar */}
      <ScrollView style={styles.right} contentContainerStyle={styles.content}>
        <SectionTitle>Como praticar</SectionTitle>
        <View style={styles.modes}>
          {MODES.map((m) => (
            <Pressable key={m.mode} onPress={() => play(m.mode)} style={({ pressed }) => [styles.modeCard, m.primary && styles.modeCardPrimary, pressed && { opacity: 0.85 }]}>
              <Text style={styles.modeIcon}>{m.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.modeTitle}>{m.title}</Text>
                <Text style={[styles.modeText, m.primary && { color: '#DDEFFF' }]}>{m.text}</Text>
              </View>
              <Text style={styles.modeGo}>›</Text>
            </Pressable>
          ))}
        </View>
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
  hint: { color: colors.textDim, fontSize: 13, marginTop: space.sm },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  columns: { flexDirection: 'row' },
  right: { flex: 1, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border },
  modes: { gap: space.sm },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 4,
  },
  modeCardPrimary: { backgroundColor: colors.primaryDark, borderColor: colors.primary },
  modeIcon: { fontSize: 26 },
  modeGo: { color: colors.text, fontSize: 28, fontWeight: '300' },
  modeTitle: { color: colors.text, fontWeight: '800', fontSize: 17 },
  modeText: { color: colors.textDim },
  credits: { color: colors.textDim, fontSize: 12, marginTop: space.lg },
});
