import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Underline } from '@/features/player/controls';
import { hymnCatalog, type HymnEntry } from '@/content/hymnal';
import { font, usePalette } from '@/theme';

/**
 * Entrada do app: extremamente minimalista. Um campo para digitar o número
 * ou o nome, a escolha entre Hinos e Coros e uma roda que gira até o hino.
 */

type Kind = HymnEntry['kind'];

const ITEM = 44;
const VISIBLE = 5;

const CATALOG = hymnCatalog();

/** Remove acentos e caixa para a busca por nome. */
function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function open(entry: HymnEntry) {
  router.push({ pathname: '/tocar/[songId]', params: { songId: entry.songId } });
}

export default function Home() {
  const p = usePalette();
  const [kind, setKind] = useState<Kind>('hino');
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const wheel = useRef<ScrollView>(null);

  const list = useMemo(() => CATALOG.filter((h) => h.kind === kind), [kind]);

  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    if (/^\d+$/.test(q)) {
      const exact = list.filter((h) => String(h.number) === q);
      const rest = list.filter((h) => String(h.number).startsWith(q) && String(h.number) !== q);
      return [...exact, ...rest].slice(0, 6);
    }
    return list.filter((h) => normalize(h.title).includes(q)).slice(0, 6);
  }, [list, query]);

  const scrollTo = (i: number, animated = true) => {
    wheel.current?.scrollTo({ y: i * ITEM, animated });
    setIndex(i);
  };

  // Número digitado exato: a roda gira até ele.
  const changeQuery = (text: string) => {
    setQuery(text);
    const n = Number(text.trim());
    if (!Number.isInteger(n) || n <= 0) return;
    const i = list.findIndex((h) => h.number === n);
    if (i >= 0) scrollTo(i);
  };

  const changeKind = (k: Kind) => {
    setKind(k);
    setIndex(0);
    wheel.current?.scrollTo({ y: 0, animated: false });
  };

  const onWheelScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / ITEM);
    const clamped = Math.max(0, Math.min(list.length - 1, i));
    if (clamped !== index) setIndex(clamped);
  };

  const submit = () => {
    if (results.length > 0) open(results[0]);
    else if (!query.trim()) open(list[index]);
  };

  const current = list[index];
  const pad = ((VISIBLE - 1) / 2) * ITEM;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: p.bg }]} edges={['left', 'right']}>
      <View style={styles.main}>
        <Text style={[styles.title, { color: p.text }]}>Hinário</Text>
        <Text style={[styles.subtitle, { color: p.textDim }]}>Congregação Cristã no Brasil</Text>

        <View style={styles.kind}>
          <Underline
            options={[
              { value: 'hino', label: 'Hinos' },
              { value: 'coro', label: 'Coros' },
            ]}
            value={kind}
            onChange={changeKind}
          />
        </View>

        <View style={[styles.field, { backgroundColor: p.surface, borderColor: p.border }]}>
          <TextInput
            value={query}
            onChangeText={changeQuery}
            onSubmitEditing={submit}
            placeholder={kind === 'hino' ? 'Número ou nome do hino' : 'Número ou nome do coro'}
            placeholderTextColor={p.textFaint}
            returnKeyType="go"
            autoCorrect={false}
            style={[styles.input, { color: p.text }]}
            accessibilityLabel="Buscar hino"
          />
          <Pressable
            onPress={submit}
            accessibilityRole="button"
            accessibilityLabel="Abrir"
            style={[styles.go, { backgroundColor: query.trim() ? p.primary : p.surfaceStrong }]}>
            <Text style={[styles.goText, { color: query.trim() ? p.primaryText : p.textDim }]}>↑</Text>
          </Pressable>
        </View>

        {results.length > 0 ? (
          <ScrollView
            style={[styles.results, { borderColor: p.border }]}
            keyboardShouldPersistTaps="handled">
            {results.map((h) => (
              <Pressable
                key={h.songId}
                onPress={() => open(h)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.result, pressed && { backgroundColor: p.surface }]}>
                <Text style={[styles.resultNumber, { color: p.textDim }]}>{h.number}</Text>
                <Text style={[styles.resultTitle, { color: p.text }]} numberOfLines={1}>
                  {h.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : query.trim() ? (
          <Text style={[styles.empty, { color: p.textFaint }]}>Nenhum {kind} encontrado.</Text>
        ) : null}
      </View>

      <View style={styles.side}>
        <View style={{ height: ITEM * VISIBLE }}>
          <View
            pointerEvents="none"
            style={[styles.band, { top: pad, borderColor: p.border, backgroundColor: p.surface }]}
          />
          <ScrollView
            ref={wheel}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM}
            decelerationRate="fast"
            onScroll={onWheelScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingVertical: pad }}>
            {list.map((h, i) => {
              const d = Math.abs(i - index);
              return (
                <Pressable
                  key={h.songId}
                  onPress={() => (i === index ? open(h) : scrollTo(i))}
                  accessibilityRole="button"
                  accessibilityLabel={`${h.number} ${h.title}`}
                  style={styles.wheelItem}>
                  <Text
                    style={[
                      styles.wheelNumber,
                      { color: d === 0 ? p.text : p.textFaint, opacity: d > 2 ? 0.3 : 1 - d * 0.2 },
                    ]}>
                    {h.number}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        {current ? (
          <Pressable
            onPress={() => open(current)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.pick, pressed && { opacity: 0.7 }]}>
            <Text style={[styles.pickTitle, { color: p.text }]} numberOfLines={2}>
              {current.title}
            </Text>
            <Text style={[styles.pickAction, { color: p.textDim }]}>Abrir ›</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, gap: 40 },
  main: { flex: 1, maxWidth: 560, marginLeft: 'auto' },
  title: { fontFamily: font, fontSize: 30, fontWeight: '700', letterSpacing: 0.5 },
  subtitle: { fontFamily: font, fontSize: 12, marginTop: 4, letterSpacing: 0.4 },
  kind: { marginTop: 22, marginBottom: 14 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 26,
    borderWidth: 1,
    paddingLeft: 20,
    paddingRight: 6,
    height: 52,
  },
  input: { flex: 1, fontFamily: font, fontSize: 16, height: '100%', outlineStyle: 'none' } as never,
  go: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  goText: { fontFamily: font, fontSize: 18, fontWeight: '700' },
  results: { maxHeight: 150, marginTop: 8 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, height: 36, borderRadius: 18 },
  resultNumber: { fontFamily: font, fontSize: 13, width: 32, textAlign: 'right' },
  resultTitle: { fontFamily: font, fontSize: 14, flexShrink: 1 },
  empty: { fontFamily: font, fontSize: 13, marginTop: 12, marginLeft: 20 },
  side: { width: 190, alignItems: 'center', marginRight: 'auto' },
  band: { position: 'absolute', left: 0, right: 0, height: ITEM, borderRadius: 14, borderWidth: 1 },
  wheelItem: { height: ITEM, alignItems: 'center', justifyContent: 'center' },
  wheelNumber: { fontFamily: font, fontSize: 22, fontWeight: '600' },
  pick: { marginTop: 10, alignItems: 'center', minHeight: 44 },
  pickTitle: { fontFamily: font, fontSize: 13, textAlign: 'center' },
  pickAction: { fontFamily: font, fontSize: 12, marginTop: 4 },
});
