import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, Stars } from '@/components/ui';
import { allHymns, allSongs, type Song } from '@/content';
import { useProgress } from '@/store/progress';
import { colors, radius, space } from '@/theme';

type Filter = 'hymns' | 'others';

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export default function HymnsScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('hymns');
  const records = useProgress((s) => s.songs);

  const list = useMemo(() => {
    const base = filter === 'hymns' ? allHymns() : allSongs().filter((s) => s.kind !== 'hymn' && !s.tags?.includes('ritmo'));
    const q = normalize(query.trim());
    if (!q) return base;
    return base.filter(
      (s) => normalize(s.title).includes(q) || (s.hymnNumber !== undefined && String(s.hymnNumber) === q),
    );
  }, [query, filter]);

  const renderItem = ({ item }: { item: Song }) => (
    <Pressable
      style={({ pressed }) => [styles.item, pressed && { opacity: 0.8 }]}
      onPress={() => router.push({ pathname: '/hino/[songId]', params: { songId: item.id } })}>
      <View style={styles.number}>
        <Text style={styles.numberText}>{item.kind === 'hymn' ? item.hymnNumber : '♪'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        {item.subtitle ? (
          <Text numberOfLines={1} style={styles.itemSub}>
            {item.subtitle}
          </Text>
        ) : null}
        <Text style={styles.itemMeta}>
          {'●'.repeat(item.difficulty)}
          {'○'.repeat(5 - item.difficulty)} • {item.instruments.map((i) => (i === 'piano' ? 'Piano' : 'Órgão')).join(' / ')}
        </Text>
      </View>
      <Stars count={records[item.id]?.bestStars ?? 0} size={14} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Hinos</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por número ou nome"
          placeholderTextColor={colors.textDim}
          style={styles.search}
          inputMode="search"
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="Hinário" selected={filter === 'hymns'} onPress={() => setFilter('hymns')} />
          <Chip label="Exercícios e peças" selected={filter === 'others'} onPress={() => setFilter('others')} />
        </View>
      </View>
      <FlatList
        data={list}
        keyExtractor={(s) => s.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: space.md, gap: space.sm }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {filter === 'hymns' && !query
              ? 'Os hinos serão adicionados em breve.'
              : 'Nenhum resultado para a busca.'}
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: space.md, gap: space.sm },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space.md,
  },
  number: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { color: colors.primary, fontWeight: '800', fontSize: 17 },
  itemTitle: { color: colors.text, fontWeight: '700', fontSize: 16 },
  itemSub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  itemMeta: { color: colors.textDim, fontSize: 12, marginTop: 4 },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: 40 },
});
