import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Ellipse, G, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import type { Song, Voice } from '@/content/types';
import type { NoteResult } from '@/engine/practice-session';
import type { TimedNote, Timeline } from '@/engine/timeline';
import { createSpeller } from '@/music/spelling';
import { usePalette, useType, type Palette } from '@/theme';

/**
 * Partitura no formato do hinário da organista.
 *
 * - Cada sistema corresponde a uma LINHA do hinário (as mesmas quebras do
 *   livro); em telas estreitas uma linha pode ser dividida em duas.
 * - Pautas: Sol (soprano/contralto), Fá (tenor/baixo) e, no órgão, a
 *   pedaleira.
 * - Hastes por voz, armadura, fórmula de compasso, indicação de metrônomo,
 *   acidentes por compasso, pausas e dedilhado (quando houver).
 * - Um cursor acompanha a música e a página rola sozinha.
 */

interface Props {
  width: number;
  height: number;
  song: Song;
  timeline: Timeline;
  time: SharedValue<number>;
  resultOf: (id: string) => NoteResult;
  version: number;
  showFingers?: boolean;
}

type StaffName = 'treble' | 'bass' | 'pedal';


const UP_VOICES: Voice[] = ['soprano', 'tenor'];
const SHARP_STEPS = [38, 35, 39, 36, 33, 37, 34]; // posição dos ♯ da armadura na clave de Sol
const FLAT_STEPS = [34, 37, 33, 36, 32, 35, 31];
const TEMPO_GLYPH: Record<string, string> = { q: '♩', e: '♪', 'q.': '♩.', h: '𝅗𝅥' };

interface Layout {
  gap: number;
  marginX: number;
  topPad: number;
  systemHeight: number;
  systems: number;
  hasPedal: boolean;
  /** Por compasso: início (batidas), x, largura, sistema. */
  starts: number[];
  lens: number[];
  xs: number[];
  ws: number[];
  sys: number[];
  /** Primeiro compasso de cada sistema. */
  firstOfSystem: number[];
  headerFirst: number;
  header: number;
}

function computeLayout(width: number, height: number, song: Song, timeline: Timeline, hasPedal: boolean): Layout {
  // Espaçamento das linhas: o sistema inteiro (com pedaleira) precisa caber na tela.
  const gap = Math.max(5, Math.min(10, width / 100, height / (hasPedal ? 32 : 23)));
  const marginX = 14;
  const keyCount = Math.abs(song.keySignature);
  const header = gap * 4.6 + keyCount * gap * 1.05 + gap * 0.6;
  const headerFirst = header + (song.showTimeSignature === false ? 0 : gap * 2.4);
  const ms = timeline.measureStarts;
  const count = ms.length - 1;
  const starts = ms.slice(0, count);
  const lens = starts.map((s, i) => ms[i + 1] - s);
  const lineSet = new Set(timeline.lineStarts.map((b) => Math.round(b * 1000)));

  // Monta os sistemas: quebra onde o hinário quebra a linha, ou quando não cabe.
  const minBeat = gap * 3.4;
  const pad = gap * 2.6;
  const sys: number[] = [];
  const firstOfSystem: number[] = [];
  let used = 0;
  for (let m = 0; m < count; m++) {
    const need = lens[m] * minBeat + pad;
    const available = width - marginX * 2 - (firstOfSystem.length <= 1 ? headerFirst : header);
    const lineBreak = m > 0 && lineSet.has(Math.round(starts[m] * 1000));
    if (m === 0 || lineBreak || used + need > available) {
      firstOfSystem.push(m);
      used = 0;
    }
    sys.push(firstOfSystem.length - 1);
    used += need;
  }

  // Distribui a largura de cada sistema proporcionalmente à duração dos compassos.
  const xs: number[] = new Array(count).fill(0);
  const ws: number[] = new Array(count).fill(0);
  for (let s = 0; s < firstOfSystem.length; s++) {
    const from = firstOfSystem[s];
    const to = s + 1 < firstOfSystem.length ? firstOfSystem[s + 1] : count;
    const left = marginX + (s === 0 ? headerFirst : header);
    const available = width - marginX - left;
    const weights = lens.slice(from, to).map((l) => l + 0.9);
    const total = weights.reduce((a, b) => a + b, 0);
    let x = left;
    for (let m = from; m < to; m++) {
      xs[m] = x;
      ws[m] = (weights[m - from] / total) * available;
      x += ws[m];
    }
  }

  return {
    gap,
    marginX,
    topPad: Math.max(gap * 7.5, 46),
    systemHeight: gap * (hasPedal ? 31 : 21),
    systems: firstOfSystem.length,
    hasPedal,
    starts,
    lens,
    xs,
    ws,
    sys,
    firstOfSystem,
    headerFirst,
    header,
  };
}

export const HymnScore = memo(function HymnScore({
  width,
  height,
  song,
  timeline,
  time,
  resultOf,
  showFingers = true,
}: Props) {
  const pal = usePalette();
  const type = useType();
  const INK = pal.ink;
  const INK_SOFT = pal.textDim;
  const STAFF_COLOR = pal.staff;
  const hasPedal = timeline.notes.some((n) => n.voice === 'pedal');
  const L = useMemo(() => computeLayout(width, height, song, timeline, hasPedal), [width, height, song, timeline, hasPedal]);
  const { gap, marginX, topPad, systemHeight } = L;
  const half = gap / 2;
  const padL = gap * 1.6;
  const padR = gap * 0.9;
  const keyCount = Math.abs(song.keySignature);
  const contentHeight = topPad + L.systems * systemHeight + gap * 2;

  // Geometria vertical de um sistema.
  const sysTop = (i: number) => topPad + i * systemHeight;
  const staffBottom = (i: number, staff: StaffName) =>
    sysTop(i) + gap * (staff === 'treble' ? 7 : staff === 'bass' ? 17 : 27);
  const yOf = (i: number, step: number, staff: StaffName) =>
    staffBottom(i, staff) - (step - (staff === 'treble' ? 30 : 18)) * half;

  const measureOf = (beat: number) => {
    let lo = 0;
    let hi = L.starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (L.starts[mid] <= beat + 1e-6) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  };
  const beatX = (beat: number) => {
    const m = measureOf(beat);
    const f = Math.min(1, Math.max(0, (beat - L.starts[m]) / L.lens[m]));
    return L.xs[m] + padL + f * (L.ws[m] - padL - padR);
  };

  // Número real do primeiro compasso do trecho (para numerar os sistemas).
  const measureOffset = (song.measures ?? []).filter((b) => b < timeline.originBeat - 1e-6).length;

  // ------------------------------------------------------------- cursor (thread de UI)
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const spb = timeline.secondsPerBeat;
  const { starts, lens, xs, ws, sys } = L;
  const cursorStyle = useAnimatedStyle(() => {
    const beat = Math.max(0, time.value / spb);
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= beat + 1e-6) lo = mid;
      else hi = mid - 1;
    }
    const f = Math.min(1, Math.max(0, (beat - starts[lo]) / lens[lo]));
    const x = xs[lo] + padL + f * (ws[lo] - padL - padR);
    return { transform: [{ translateX: x - gap * 1.4 }, { translateY: topPad + sys[lo] * systemHeight + gap * 1.5 }] };
  });

  useAnimatedReaction(
    () => {
      const beat = Math.max(0, time.value / spb);
      let lo = 0;
      let hi = starts.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (starts[mid] <= beat + 1e-6) lo = mid;
        else hi = mid - 1;
      }
      return sys[lo];
    },
    (system, prev) => {
      if (system !== prev) {
        const target = topPad + system * systemHeight - gap * 4;
        scrollTo(scrollRef, 0, Math.max(0, target), true);
      }
    },
  );

  // ------------------------------------------------------------- pautas, claves, barras
  const staticLayer = useMemo(() => {
    const out: React.ReactNode[] = [];
    const staves: StaffName[] = hasPedal ? ['treble', 'bass', 'pedal'] : ['treble', 'bass'];
    for (let i = 0; i < L.systems; i++) {
      const first = L.firstOfSystem[i];
      const last = (i + 1 < L.systems ? L.firstOfSystem[i + 1] : L.starts.length) - 1;
      const x0 = marginX;
      const x1 = L.xs[last] + L.ws[last];
      for (const staff of staves) {
        const baseStep = staff === 'treble' ? 30 : 18;
        for (let k = 0; k < 5; k++) {
          const yy = yOf(i, baseStep + k * 2, staff);
          out.push(<Line key={`l${i}${staff}${k}`} x1={x0} x2={x1} y1={yy} y2={yy} stroke={STAFF_COLOR} strokeWidth={1} />);
        }
        // Clave
        out.push(
          staff === 'treble' ? (
            <SvgText key={`c${i}${staff}`} x={x0 + gap * 0.3} y={yOf(i, 32, 'treble') + gap * 1.25} fontSize={gap * 5.2} fill={INK}>
              𝄞
            </SvgText>
          ) : (
            <SvgText key={`c${i}${staff}`} x={x0 + gap * 0.4} y={yOf(i, 24, staff) + gap * 1.9} fontSize={gap * 3.6} fill={INK}>
              𝄢
            </SvgText>
          ),
        );
        // Armadura
        const steps = song.keySignature >= 0 ? SHARP_STEPS : FLAT_STEPS;
        for (let k = 0; k < keyCount; k++) {
          const st = staff === 'treble' ? steps[k] : steps[k] - 14;
          out.push(
            <SvgText key={`k${i}${staff}${k}`} x={x0 + gap * 4.3 + k * gap * 1.05} y={yOf(i, st, staff) + half * 0.9} fontSize={gap * 1.9} fill={INK}>
              {song.keySignature >= 0 ? '♯' : '♭'}
            </SvgText>,
          );
        }
        // Fórmula de compasso (primeiro sistema)
        if (i === 0 && song.showTimeSignature !== false) {
          const tx = x0 + gap * 4.5 + keyCount * gap * 1.05 + gap * 0.3;
          const mid = staff === 'treble' ? 34 : 22;
          out.push(
            <SvgText key={`ts${staff}u`} x={tx} y={yOf(i, mid + 2, staff)} fontSize={gap * 2.2} fontWeight="bold" fill={INK}>
              {song.timeSignature[0]}
            </SvgText>,
            <SvgText key={`ts${staff}l`} x={tx} y={yOf(i, mid - 2, staff)} fontSize={gap * 2.2} fontWeight="bold" fill={INK}>
              {song.timeSignature[1]}
            </SvgText>,
          );
        }
      }
      // Chave e barra inicial (manuais), barra inicial da pedaleira
      const tTop = yOf(i, 38, 'treble');
      const bBot = yOf(i, 18, 'bass');
      out.push(<Rect key={`br${i}`} x={x0 - 6} y={tTop} width={3} height={bBot - tTop} fill={INK} rx={1.5} />);
      out.push(<Line key={`sb${i}`} x1={x0} x2={x0} y1={tTop} y2={hasPedal ? yOf(i, 18, 'pedal') : bBot} stroke={INK} strokeWidth={1.4} />);
      // Barras de compasso
      for (let m = first; m <= last; m++) {
        const xr = L.xs[m] + L.ws[m];
        const final = m === L.starts.length - 1;
        const segments: [number, number][] = [[tTop, bBot]];
        if (hasPedal) segments.push([yOf(i, 26, 'pedal'), yOf(i, 18, 'pedal')]);
        segments.forEach(([a, b], k) => {
          out.push(<Line key={`b${m}${k}`} x1={xr} x2={xr} y1={a} y2={b} stroke={INK} strokeWidth={1.1} />);
          if (final) {
            out.push(<Line key={`bf${m}${k}`} x1={xr - 5} x2={xr - 5} y1={a} y2={b} stroke={INK} strokeWidth={1} />);
            out.push(<Rect key={`bt${m}${k}`} x={xr - 2} y={a} width={3.5} height={b - a} fill={INK} />);
          }
        });
      }
      if (i > 0) {
        out.push(
          <SvgText key={`mn${i}`} x={x0 + 1} y={tTop - gap * 1.3} fontSize={gap * 1.15} fontFamily={type.family} fill={INK_SOFT}>
            {first + 1 + measureOffset}
          </SvgText>,
        );
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L, song.keySignature, song.timeSignature, song.showTimeSignature, measureOffset, pal, type]);

  // ------------------------------------------------------------- notas
  const spellers: Record<StaffName, ReturnType<typeof createSpeller>> = {
    treble: createSpeller(song.keySignature),
    bass: createSpeller(song.keySignature),
    pedal: createSpeller(song.keySignature),
  };
  const noteLayer = timeline.notes.map((n) => {
    const rel = n.beat - timeline.originBeat;
    const m = measureOf(rel);
    const i = L.sys[m];
    const staff: StaffName = n.voice === 'pedal' ? 'pedal' : n.hand === 'right' ? 'treble' : 'bass';
    const sp = spellers[staff](n.midi, String(m));
    const cx = beatX(rel);
    const cy = yOf(i, sp.step, staff);
    const color = colorFor(pal, n, resultOf(n.id));
    const { base, dots } = splitDuration(n.beats);
    const hollow = base >= 2;
    const middleStep = staff === 'treble' ? 34 : 22;
    const up = n.voice && n.voice !== 'pedal' ? UP_VOICES.includes(n.voice) : sp.step < middleStep;
    const stemX = up ? cx + half * 1.22 : cx - half * 1.22;
    const stemEnd = up ? cy - gap * 3.2 : cy + gap * 3.2;
    const bottomStep = staff === 'treble' ? 30 : 18;
    const ledgers: number[] = [];
    for (let s = bottomStep - 2; s >= sp.step; s -= 2) ledgers.push(s);
    for (let s = bottomStep + 10; s <= sp.step; s += 2) ledgers.push(s);
    return (
      <G key={n.id}>
        {ledgers.map((s) => (
          <Line key={s} x1={cx - half * 2.1} x2={cx + half * 2.1} y1={yOf(i, s, staff)} y2={yOf(i, s, staff)} stroke={STAFF_COLOR} strokeWidth={1} />
        ))}
        {sp.sign ? (
          <SvgText x={cx - gap * 2.1} y={cy + half * 0.95} fontSize={gap * 1.7} fill={color}>
            {sp.sign}
          </SvgText>
        ) : null}
        <Ellipse
          cx={cx}
          cy={cy}
          rx={half * 1.3}
          ry={half * 0.92}
          fill={hollow ? 'none' : color}
          stroke={color}
          strokeWidth={hollow ? 1.8 : 1}
          transform={`rotate(-20 ${cx} ${cy})`}
        />
        {Array.from({ length: dots }, (_, d) => (
          <Ellipse key={`d${d}`} cx={cx + gap * (1.25 + d * 0.7)} cy={sp.step % 2 === 0 ? cy - half * 0.6 : cy} rx={1.8} ry={1.8} fill={color} />
        ))}
        {base < 4 ? <Line x1={stemX} x2={stemX} y1={cy} y2={stemEnd} stroke={color} strokeWidth={1.2} /> : null}
        {base <= 0.5 ? flag(stemX, stemEnd, up, base <= 0.25 ? 2 : 1, gap, color) : null}
        {showFingers && n.finger ? (
          <SvgText x={cx - 3} y={up ? cy + gap * 1.9 : cy - gap * 1.1} fontSize={gap * 1.15} fontFamily={type.boldFamily} fontWeight={type.boldWeight === '700' ? 'bold' : 'normal'} fill={INK_SOFT}>
            {n.finger}
          </SvgText>
        ) : null}
      </G>
    );
  });

  // ------------------------------------------------------------- pausas
  const restLayer = timeline.rests.map((r, k) => {
    const rel = r.time / timeline.secondsPerBeat;
    const m = measureOf(rel);
    const i = L.sys[m];
    const staff: StaffName = r.hand === 'right' ? 'treble' : 'bass';
    const y = yOf(i, staff === 'treble' ? 34 : 22, staff);
    const cx = beatX(rel) + gap * 0.3;
    if (r.beats >= 4) return <Rect key={`r${k}`} x={cx - gap * 0.6} y={y - gap} width={gap * 1.2} height={half} fill={INK} />;
    if (r.beats >= 2) return <Rect key={`r${k}`} x={cx - gap * 0.6} y={y - half} width={gap * 1.2} height={half} fill={INK} />;
    if (r.beats >= 1) {
      return (
        <Polyline
          key={`r${k}`}
          points={`${cx - gap * 0.3},${y - gap * 1.5} ${cx + gap * 0.3},${y - gap * 0.6} ${cx - gap * 0.3},${y} ${cx + gap * 0.3},${y + gap * 0.9} ${cx - gap * 0.4},${y + gap * 1.1} ${cx + gap * 0.1},${y + gap * 1.7}`}
          fill="none"
          stroke={INK}
          strokeWidth={1.8}
        />
      );
    }
    return (
      <G key={`r${k}`}>
        <Ellipse cx={cx - gap * 0.2} cy={y - half} rx={half * 0.45} ry={half * 0.45} fill={INK} />
        <Line x1={cx - gap * 0.2} x2={cx + gap * 0.4} y1={y - half} y2={y - half * 1.3} stroke={INK} strokeWidth={1.5} />
        <Line x1={cx + gap * 0.4} x2={cx - gap * 0.1} y1={y - half * 1.3} y2={y + gap} stroke={INK} strokeWidth={1.5} />
      </G>
    );
  });

  const mark = song.tempoMark;
  const tempoText = mark
    ? `${TEMPO_GLYPH[mark.unit] ?? '♩'} = ${mark.min}${mark.max !== mark.min ? `–${mark.max}` : ''}${mark.text ? `  ${mark.text}` : ''}`
    : `♩ = ${song.tempo}`;

  return (
    <View style={[styles.paper, { width, height, backgroundColor: pal.paper }]}>
      <Animated.ScrollView ref={scrollRef} contentContainerStyle={{ height: contentHeight }} showsVerticalScrollIndicator>
        <View style={styles.header}>
          <Text style={[styles.headerNumber, type.bold, { color: INK }]}>{song.hymnNumber ?? ''}</Text>
          <Text style={[styles.headerTitle, type.bold, { color: INK }]} numberOfLines={1}>
            {song.title}
          </Text>
          <View style={{ alignItems: 'flex-end' }}>
            {song.composer ? <Text style={[styles.headerSmall, type.regular, { color: INK }]}>{song.composer}</Text> : null}
            <Text style={[styles.headerSmall, type.regular, { color: INK }]}>({tempoText})</Text>
          </View>
        </View>
        <Animated.View
          pointerEvents="none"
          style={[styles.cursor, { width: gap * 2.8, height: systemHeight - gap * 4, backgroundColor: pal.cursor, borderLeftColor: pal.cursorEdge }, cursorStyle]}
        />
        <Svg width={width} height={contentHeight} style={StyleSheet.absoluteFill}>
          {staticLayer}
          {restLayer}
          {noteLayer}
        </Svg>
      </Animated.ScrollView>
    </View>
  );
});

/** Separa uma duração em figura base + pontos de aumento. */
function splitDuration(beats: number): { base: number; dots: number } {
  for (const base of [4, 2, 1, 0.5, 0.25, 0.125]) {
    if (Math.abs(beats - base) < 1e-6) return { base, dots: 0 };
    if (Math.abs(beats - base * 1.5) < 1e-6) return { base, dots: 1 };
    if (Math.abs(beats - base * 1.75) < 1e-6) return { base, dots: 2 };
  }
  // Durações longas ou ligadas: mostra a figura mais próxima.
  if (beats > 4) return { base: 4, dots: 0 };
  const base = [2, 1, 0.5, 0.25].find((b) => beats >= b) ?? 0.25;
  return { base, dots: 0 };
}

function flag(x: number, y: number, up: boolean, count: number, gap: number, color: string) {
  return (
    <G>
      {Array.from({ length: count }, (_, k) => {
        const yy = y + (up ? k * gap * 0.8 : -k * gap * 0.8);
        return (
          <Polyline
            key={k}
            points={`${x},${yy} ${x + gap * 0.9},${yy + (up ? gap * 1.1 : -gap * 1.1)} ${x + gap * 0.7},${yy + (up ? gap * 2 : -gap * 2)}`}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
          />
        );
      })}
    </G>
  );
}

/** Preto: o que você toca; cinza: o que o app toca; já tocadas: acinzentadas. */
function colorFor(p: Palette, n: TimedNote, result: NoteResult): string {
  if (result === 'hit') return p.inkHit;
  if (result === 'missed') return p.inkMissed;
  if (!n.active) return p.inkInactive;
  if (n.voice === 'pedal') return p.inkPedal;
  return n.hand === 'right' ? p.inkRight : p.inkLeft;
}

const styles = StyleSheet.create({
  paper: { overflow: 'hidden' },
  header: {
    position: 'absolute',
    top: 6,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerNumber: { fontSize: 20, minWidth: 20 },
  headerTitle: { fontSize: 16, flex: 1, textAlign: 'center' },
  headerSmall: { fontSize: 10 },
  cursor: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 6,
    borderLeftWidth: 2,
  },
});
