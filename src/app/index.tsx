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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { hymnCatalog, type HymnEntry } from '@/content/hymnal';
import { RoundButton, Segmented } from '@/features/player/controls';
import { AppearanceSettings } from '@/features/settings/AppearanceSettings';
import { useSettings } from '@/store/settings';
import { usePalette, useType } from '@/theme';
import { withAlpha } from '@/theme/color';

/**
 * Entrada do app: uma pergunta, um campo de busca (número ou nome) e, ao lado,
 * a roda que gira até o hino. Os últimos hinos abertos ficam à mão.
 */

type Kind = HymnEntry['kind'];

const ITEM = 46;
const VISIBLE = 5;
const CATALOG = hymnCatalog();
const BY_ID = new Map(CATALOG.map((h) => [h.songId, h]));
const COUNT: Record<Kind, number> = {
  hino: CATALOG.filter((h) => h.kind === 'hino').length,
  coro: CATALOG.filter((h) => h.kind === 'coro').length,
};

/** Remove acentos e caixa para a busca por nome. */
function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function open(entry: HymnEntry) {
  const { recent, set } = useSettings.getState();
  set({ recent: [entry.songId, ...recent.filter((id) => id !== entry.songId)].slice(0, 6) });
  router.push({ pathname: '/tocar/[songId]', params: { songId: entry.songId } });
}

function label(h: HymnEntry) {
  return h.kind === 'coro' ? `Coro ${h.number}` : `Hino ${h.number}`;
}

export default function Home() {
  const p = usePalette();
  const t = useType();
  const recentIds = useSettings((s) => s.recent);
  const [look, setLook] = useState(false);
  const [kind, setKind] = useState<Kind>('hino');
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [index, setIndex] = useState(0);
  const wheel = useRef<ScrollView>(null);

  const list = useMemo(() => CATALOG.filter((h) => h.kind === kind), [kind]);
  const recent = recentIds.map((id) => BY_ID.get(id)).filter((h): h is HymnEntry => !!h).slice(0, 4);

  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    if (/^\d+$/.test(q)) {
      const exact = list.filter((h) => String(h.number) === q);
      const rest = list.filter((h) => String(h.number).startsWith(q) && String(h.number) !== q);
      return [...exact, ...rest].slice(0, 5);
    }
    return list.filter((h) => normalize(h.title).includes(q)).slice(0, 5);
  }, [list, query]);

  const scrollTo = (i: number) => {
    wheel.current?.scrollTo({ y: i * ITEM, animated: true });
    setIndex(i);
  };

  // Número digitado: a roda gira até ele.
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
    const i = Math.max(0, Math.min(list.length - 1, Math.round(e.nativeEvent.contentOffset.y / ITEM)));
    if (i !== index) setIndex(i);
  };

  const submit = () => {
    if (results.length > 0) open(results[0]);
    else if (!query.trim()) open(list[index]);
  };

  const current = list[index];
  const pad = ((VISIBLE - 1) / 2) * ITEM;
  const hasQuery = query.trim().length > 0;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: p.bg }]} edges={['left', 'right']}>
      {/* Topo: marca discreta e aparência */}
      <View style={styles.top}>
        <Text style={[t.bold, styles.brand, { color: p.textDim }]}>HINÁRIO  ·  CCB</Text>
        <RoundButton icon="contrast" size={38} onPress={() => setLook(true)} accessibilityLabel="Aparência: fonte e cores" />
      </View>

      <View style={styles.main}>
        {/* Esquerda: pergunta, busca e recentes */}
        <Animated.View entering={FadeInDown.duration(380)} style={styles.left}>
          <Text style={[t.regular, styles.heading, { color: p.text }]}>Qual hino vamos tocar?</Text>

          <View
            style={[
              styles.field,
              { backgroundColor: p.surface, borderColor: focused ? withAlpha(p.text, 0.4) : p.border },
            ]}>
            <Icon name="search" size={18} color={p.textDim} />
            <TextInput
              value={query}
              onChangeText={changeQuery}
              onSubmitEditing={submit}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={kind === 'hino' ? 'Número ou nome do hino' : 'Número ou nome do coro'}
              placeholderTextColor={p.textFaint}
              returnKeyType="go"
              autoCorrect={false}
              style={[t.regular, styles.input, { color: p.text }]}
              accessibilityLabel="Buscar hino"
            />
            <Pressable
              onPress={submit}
              disabled={!hasQuery}
              accessibilityRole="button"
              accessibilityLabel="Abrir"
              style={[styles.go, { backgroundColor: hasQuery ? p.primary : 'transparent' }]}>
              <Icon name="arrowUp" size={18} color={hasQuery ? p.primaryText : p.textFaint} />
            </Pressable>
          </View>

          <View style={styles.kindRow}>
            <Segmented
              compact
              options={[
                { value: 'hino', label: `Hinos  ${COUNT.hino}` },
                { value: 'coro', label: `Coros  ${COUNT.coro}` },
              ]}
              value={kind}
              onChange={(v) => changeKind(v as Kind)}
            />
          </View>

          {hasQuery ? (
            <View style={[styles.results, { backgroundColor: p.surface, borderColor: p.border }]}>
              {results.length ? (
                <ScrollView keyboardShouldPersistTaps="handled">
                  {results.map((h, i) => (
                    <Pressable
                      key={h.songId}
                      onPress={() => open(h)}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.result,
                        i < results.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.border },
                        pressed && { backgroundColor: p.surfaceStrong },
                      ]}>
                      <Text style={[t.bold, styles.resultNumber, { color: p.text }]}>{h.number}</Text>
                      <Text style={[t.regular, styles.resultTitle, { color: p.text }]} numberOfLines={1}>
                        {h.title}
                      </Text>
                      <Icon name="chevronRight" size={16} color={p.textFaint} />
                    </Pressable>
                  ))}
                </ScrollView>
              ) : (
                <Text style={[t.regular, styles.empty, { color: p.textDim }]}>
                  Nenhum {kind} com “{query.trim()}”.
                </Text>
              )}
            </View>
          ) : recent.length ? (
            <View style={styles.recentBox}>
              <Text style={[t.bold, styles.caption, { color: p.textFaint }]}>RECENTES</Text>
              <View style={styles.recentRow}>
                {recent.map((h) => (
                  <Pressable
                    key={h.songId}
                    onPress={() => open(h)}
                    accessibilityRole="button"
                    accessibilityLabel={`${label(h)}, ${h.title}`}
                    style={({ pressed }) => [styles.chip, { borderColor: p.border }, pressed && { backgroundColor: p.surface }]}>
                    <Text style={[t.bold, styles.chipNumber, { color: p.text }]}>{h.kind === 'coro' ? `C${h.number}` : h.number}</Text>
                    <Text style={[t.regular, styles.chipTitle, { color: p.textDim }]} numberOfLines={1}>
                      {h.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <Text style={[t.regular, styles.tip, { color: p.textFaint }]}>
              Digite o número ou parte do nome — ou gire a roda ao lado.
            </Text>
          )}
        </Animated.View>

        {/* Direita: roda que gira até o hino */}
        <Animated.View entering={FadeIn.duration(500).delay(120)} style={styles.right}>
          <View style={[styles.wheelCard, { backgroundColor: p.bg, borderColor: p.border }]}>
            <View pointerEvents="none" style={[styles.band, { top: pad, backgroundColor: p.surfaceStrong }]} />
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
                if (d > 8) return <View key={h.songId} style={{ height: ITEM }} />;
                return (
                  <Pressable
                    key={h.songId}
                    onPress={() => (i === index ? open(h) : scrollTo(i))}
                    accessibilityRole="button"
                    accessibilityLabel={`${label(h)}, ${h.title}`}
                    style={[styles.wheelItem, { opacity: d === 0 ? 1 : d === 1 ? 0.55 : 0.28 }]}>
                    <Text style={[t.bold, styles.wheelNumber, { color: p.text }]}>{h.number}</Text>
                    <Text style={[d === 0 ? t.bold : t.regular, styles.wheelTitle, { color: p.text }]} numberOfLines={1}>
                      {h.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Fade color={p.bg} />
          </View>

          <Pressable
            onPress={() => current && open(current)}
            accessibilityRole="button"
            accessibilityLabel={current ? `Tocar ${label(current)}` : 'Tocar'}
            style={({ pressed }) => [styles.play, { backgroundColor: p.primary }, pressed && { opacity: 0.8 }]}>
            <Icon name="play" size={16} color={p.primaryText} />
            <Text style={[t.bold, styles.playText, { color: p.primaryText }]}>
              {current ? `Tocar ${label(current).toLowerCase()}` : 'Tocar'}
            </Text>
          </Pressable>
        </Animated.View>
      </View>

      {look ? (
        <Animated.View entering={FadeIn.duration(160)} style={[StyleSheet.absoluteFill, styles.sheet, { backgroundColor: withAlpha(p.bg, 0.96) }]}>
          <View style={styles.sheetHeader}>
            <Text style={[t.bold, styles.sheetTitle, { color: p.text }]}>Aparência</Text>
            <RoundButton icon="close" size={40} onPress={() => setLook(false)} accessibilityLabel="Fechar" />
          </View>
          <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
            <AppearanceSettings />
          </ScrollView>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

/** Esmaece o alto e o pé da roda, como um seletor de verdade. */
function Fade({ color }: { color: string }) {
  const h = ITEM * 1.6;
  return (
    <>
      <View pointerEvents="none" style={[styles.fade, { top: 0, height: h }]}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="fadeTop" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.9} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#fadeTop)" />
        </Svg>
      </View>
      <View pointerEvents="none" style={[styles.fade, { bottom: 0, height: h }]}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="fadeBottom" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0} />
              <Stop offset="1" stopColor={color} stopOpacity={0.9} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#fadeBottom)" />
        </Svg>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 14,
  },
  brand: { fontSize: 11, letterSpacing: 2.4 },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 44,
    paddingHorizontal: 40,
    paddingBottom: 28,
    maxWidth: 980,
    width: '100%',
    alignSelf: 'center',
  },
  // Altura fixa: a lista de resultados cresce para baixo sem empurrar o título.
  left: { flex: 1, gap: 14, height: 300, justifyContent: 'flex-start', paddingTop: 24 },
  heading: { fontSize: 28, letterSpacing: -0.3, marginBottom: 4 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 28,
    borderWidth: 1,
    paddingLeft: 20,
    paddingRight: 7,
    height: 56,
  },
  input: { flex: 1, fontSize: 16, height: '100%', outlineStyle: 'none' } as never,
  go: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  kindRow: { flexDirection: 'row' },
  results: { borderRadius: 18, borderWidth: 1, maxHeight: 134, overflow: 'hidden' },
  result: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, height: 44 },
  resultNumber: { fontSize: 14, minWidth: 30 },
  resultTitle: { fontSize: 14, flex: 1 },
  empty: { fontSize: 13, padding: 16 },
  recentBox: { gap: 8 },
  caption: { fontSize: 10, letterSpacing: 1.6, marginLeft: 4 },
  recentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 36,
    maxWidth: 230,
  },
  chipNumber: { fontSize: 13 },
  chipTitle: { fontSize: 12, flexShrink: 1 },
  tip: { fontSize: 12, marginLeft: 4 },
  right: { width: 280, gap: 12 },
  wheelCard: { height: ITEM * VISIBLE, borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  band: { position: 'absolute', left: 8, right: 8, height: ITEM, borderRadius: 14 },
  wheelItem: { height: ITEM, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22 },
  wheelNumber: { fontSize: 20, minWidth: 40, textAlign: 'right' },
  wheelTitle: { fontSize: 13, flex: 1 },
  fade: { position: 'absolute', left: 0, right: 0 },
  play: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 48,
    borderRadius: 24,
  },
  playText: { fontSize: 15 },
  sheet: { paddingHorizontal: 28, paddingTop: 16 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    maxWidth: 860,
    width: '100%',
    alignSelf: 'center',
  },
  sheetTitle: { fontSize: 20 },
  sheetBody: { paddingBottom: 28, maxWidth: 860, width: '100%', alignSelf: 'center' },
});
