import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/ui';
import { allHymns } from '@/content';
import { hymnCatalog, type HymnEntry } from '@/content/songs/hymns';
import { colors, radius, space } from '@/theme';

type Filter = 'all' | 'ready';

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
  const [filter, setFilter] = useState<Filter>('all');
  const [notice, setNotice] = useState<number | null>(null);

  const extras = allHymns().filter((h) => !h.hymnNumber);
  const catalog = useMemo(() => hymnCatalog(), []);
  const readyCount = catalog.filter((h) => h.songId).length;
  const list = useMemo(() => {
    const q = normalize(query.trim());
    return catalog.filter((h) => {
      if (filter === 'ready' && !h.songId) return false;
      if (!q) return true;
      return String(h.number).startsWith(q) || (h.title ? normalize(h.title).includes(q) : false);
    });
  }, [catalog, query, filter]);

  // Em paisagem: busca à esquerda, grade de hinos à direita.
  const wide = width - RAIL > 640;
  const gridWidth = Math.max(240, (wide ? width - RAIL - SIDE : width - RAIL) - space.md * 2);
  const columns = Math.max(4, Math.floor(gridWidth / 78));
  const cellWidth = (gridWidth - 8 * (columns - 1)) / columns;

  const open = (h: HymnEntry) => {
    if (h.songId) router.push({ pathname: '/hino/[songId]', params: { songId: h.songId } });
    else setNotice(h.number);
  };

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
        <Chip label="Todos (480)" selected={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label={`Com partitura (${readyCount})`} selected={filter === 'ready'} onPress={() => setFilter('ready')} />
      </View>
      {notice !== null ? (
        <Pressable onPress={() => setNotice(null)} style={styles.notice}>
          <Text style={styles.noticeText}>
            A partitura do hino {notice} ainda está sendo preparada. Toque para fechar.
          </Text>
        </Pressable>
      ) : null}
      {extras.length ? (
        <View style={{ gap: 8, marginTop: space.sm }}>
          <Text style={styles.sectionLabel}>PARA TESTAR</Text>
          {extras.map((s) => (
            <Pressable
              key={s.id}
              style={styles.extra}
              onPress={() => router.push({ pathname: '/hino/[songId]', params: { songId: s.id } })}>
              <Text style={styles.extraTitle}>{s.title}</Text>
              {s.subtitle ? <Text style={styles.extraSub}>{s.subtitle}</Text> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
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
            accessibilityLabel={`Hino ${item.number}${item.title ? `, ${item.title}` : ''}`}
            style={({ pressed }) => [styles.cell, { width: cellWidth }, item.songId ? styles.cellReady : null, pressed && { opacity: 0.7 }]}>
            <Text style={[styles.cellNumber, !item.songId && styles.cellNumberDim]}>{item.number}</Text>
            {item.title ? (
              <Text numberOfLines={2} style={styles.cellTitle}>
                {item.title}
              </Text>
            ) : null}
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
    minHeight: 62,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  cellReady: { backgroundColor: colors.primaryDark, borderWidth: 1, borderColor: colors.primary },
  cellNumber: { color: colors.text, fontWeight: '900', fontSize: 20 },
  cellNumberDim: { color: colors.textDim },
  cellTitle: { color: colors.textDim, fontSize: 10, textAlign: 'center' },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: 40 },
});
