import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/ui';
import { hymnCatalog, type HymnEntry } from '@/content/songs/hymns';
import { colors, radius, space } from '@/theme';

type Filter = 'hinos' | 'coros';

const RAIL = 84; // largura do menu lateral
const SIDE = 300; // coluna da esquerda (busca e destaques)

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Hinário: todos os hinos pelo número, como o índice do hinário da organista. */
export default function HymnsScreen() {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('hinos');

  const catalog = useMemo(() => hymnCatalog(), []);
  const list = useMemo(() => {
    const q = normalize(query.trim());
    return catalog.filter((h) => {
      if (!q && h.kind !== (filter === 'hinos' ? 'hino' : 'coro')) return false;
      if (!q) return true;
      return String(h.number) === q || String(h.number).startsWith(q) || normalize(h.title).includes(q);
    });
  }, [catalog, query, filter]);

  // Em paisagem: busca à esquerda, grade de hinos à direita.
  const wide = width - RAIL > 640;
  const gridWidth = Math.max(240, (wide ? width - RAIL - SIDE : width - RAIL) - space.md * 2);
  const columns = Math.max(2, Math.floor(gridWidth / 150));
  const cellWidth = (gridWidth - 8 * (columns - 1)) / columns;

  const open = (h: HymnEntry) => router.push({ pathname: '/hino/[songId]', params: { songId: h.songId } });

  const side = (
    <View style={[styles.side, wide && { width: SIDE }]}>
      <Text style={styles.title}>Hinário</Text>
      <Text style={styles.subtitle}>Escolha um hino para aprender no piano ou no órgão.</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Número ou nome do hino"
        placeholderTextColor={colors.textDim}
        style={styles.search}
        inputMode="search"
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label="Hinos (480)" selected={filter === 'hinos'} onPress={() => setFilter('hinos')} />
        <Chip label="Coros (6)" selected={filter === 'coros'} onPress={() => setFilter('coros')} />
      </View>
      <Text style={styles.sourceNote}>
        Hinário nº 5 a 4 vozes. No órgão, a partitura segue o formato do hinário da organista, com pedaleira.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, wide && { flexDirection: 'row' }]} edges={['top', 'right']}>
      {side}
      <FlatList
        key={columns}
        style={{ flex: 1 }}
        data={list}
        numColumns={columns}
        keyExtractor={(h) => String(h.number)}
        contentContainerStyle={{ padding: space.md, paddingBottom: 40, gap: 8 }}
        columnWrapperStyle={{ gap: 8 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => open(item)}
            accessibilityLabel={`${item.kind === 'coro' ? 'Coro' : 'Hino'} ${item.number}, ${item.title}`}
            style={({ pressed }) => [styles.cell, { width: cellWidth }, pressed && { opacity: 0.7 }]}>
            <Text style={styles.cellNumber}>{item.kind === 'coro' ? `Coro ${item.number}` : item.number}</Text>
            <Text numberOfLines={2} style={styles.cellTitle}>
              {item.title}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum hino encontrado.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  side: {
    padding: space.md,
    gap: space.sm,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.textDim },
  sectionLabel: { color: colors.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  search: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notice: { backgroundColor: colors.card, borderRadius: radius.md, padding: space.sm },
  noticeText: { color: colors.warning },
  extra: { backgroundColor: colors.primaryDark, borderRadius: radius.md, padding: space.md },
  extraTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  extraSub: { color: '#CFE9FF', fontSize: 12, marginTop: 2 },
  cell: {
    minHeight: 74,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 10,
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cellNumber: { color: colors.primary, fontWeight: '900', fontSize: 18 },
  cellTitle: { color: colors.text, fontSize: 12, fontWeight: '600' },
  sourceNote: { color: colors.textDim, fontSize: 11 },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: 40 },
});
