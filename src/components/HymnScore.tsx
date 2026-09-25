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

/**
 * Partitura completa no formato do hinário da organista: sistemas com duas
 * pautas (soprano/contralto na clave de Sol, tenor/baixo na clave de Fá),
 * hastes por voz, dedilhado, armadura, fórmula de compasso e metrônomo.
 * Um cursor percorre a partitura e a página rola sozinha.
 */

interface Props {
  width: number;
  height: number;
  song: Song;
  timeline: Timeline;
  time: SharedValue<number>;
  resultOf: (id: string) => NoteResult;
  version: number;
  /** Mostra o número dos dedos. */
  showFingers?: boolean;
}

const PAPER = '#FBF8F1';
const INK = '#1D1D1F';
const INK_SOFT = '#8A8A94';
const STAFF = '#3C3C44';
const HIT = '#1FA64A';
const MISS = '#D93A3F';
const ACTIVE_RIGHT = '#1565C0';
const ACTIVE_LEFT = '#6A2FB8';
const CURSOR = 'rgba(33,150,243,0.16)';

const UP_VOICES: Voice[] = ['soprano', 'tenor'];

interface Layout {
  gap: number;
  bpb: number;
  measuresPerSystem: number;
  systems: number;
  measureWidth: number;
  headerFirst: number;
  header: number;
  marginX: number;
  systemHeight: number;
  topPad: number;
  totalMeasures: number;
}

function computeLayout(width: number, song: Song, timeline: Timeline): Layout {
  const gap = Math.max(7, Math.min(10, width / 95));
  const bpb = song.timeSignature[0] * (4 / song.timeSignature[1]);
  const totalBeats = Math.max(bpb, timeline.duration / timeline.secondsPerBeat);
  const totalMeasures = Math.ceil(totalBeats / bpb - 1e-6);
  const keyCount = Math.abs(song.keySignature);
  const marginX = 12;
  const header = gap * 4.4 + keyCount * gap * 1.1 + gap * 0.8;
  const headerFirst = header + (song.showTimeSignature === false ? 0 : gap * 2.6);
  const usable = width - marginX * 2 - headerFirst;
  const minMeasure = bpb * gap * 4.6;
  const measuresPerSystem = Math.max(1, Math.min(totalMeasures, Math.floor(usable / minMeasure)));
  const measureWidth = usable / measuresPerSystem;
  const systems = Math.ceil(totalMeasures / measuresPerSystem);
  return {
    gap,
    bpb,
    measuresPerSystem,
    systems,
    measureWidth,
    headerFirst,
    header,
    marginX,
    systemHeight: gap * 21,
    topPad: gap * 7,
    totalMeasures,
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
  const L = useMemo(() => computeLayout(width, song, timeline), [width, song, timeline]);
  const { gap, bpb, measuresPerSystem, measureWidth, marginX, systemHeight, topPad } = L;
  const half = gap / 2;
  const padL = gap * 1.7;
  const padR = gap * 0.9;
  const keyCount = Math.abs(song.keySignature);
  const contentHeight = topPad + L.systems * systemHeight + gap * 4;

  // Geometria de um sistema: topo das pautas.
  const sysTop = (i: number) => topPad + i * systemHeight;
  const trebleBottom = (i: number) => sysTop(i) + gap * 7;
  const bassBottom = (i: number) => sysTop(i) + gap * 17;
  const yOf = (i: number, step: number, staff: 'treble' | 'bass') =>
    staff === 'treble' ? trebleBottom(i) - (step - 30) * half : bassBottom(i) - (step - 18) * half;
  const headerOf = (i: number) => (i === 0 ? L.headerFirst : L.header);
  const measureX = (m: number) => {
    const i = Math.floor(m / measuresPerSystem);
    return marginX + headerOf(i) + (m % measuresPerSystem) * measureWidth;
  };
  const beatX = (beatRel: number) => {
    const m = Math.min(L.totalMeasures - 1, Math.floor(beatRel / bpb + 1e-6));
    const within = beatRel - m * bpb;
    return measureX(m) + padL + (within / bpb) * (measureWidth - padL - padR);
  };
  const systemOf = (beatRel: number) =>
    Math.floor(Math.min(L.totalMeasures - 1, Math.floor(beatRel / bpb + 1e-6)) / measuresPerSystem);

  // ------------------------------------------------------------- cursor
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const spb = timeline.secondsPerBeat;
  const cursorStyle = useAnimatedStyle(() => {
    const beat = Math.max(0, time.value / spb);
    const m = Math.min(L.totalMeasures - 1, Math.floor(beat / bpb + 1e-6));
    const i = Math.floor(m / measuresPerSystem);
    const within = Math.min(bpb, beat - m * bpb);
    const header = i === 0 ? L.headerFirst : L.header;
    const x = marginX + header + (m % measuresPerSystem) * measureWidth + padL + (within / bpb) * (measureWidth - padL - padR);
    return { transform: [{ translateX: x - gap * 1.4 }, { translateY: topPad + i * systemHeight + gap * 1.5 }] };
  });

  // Rola a página para manter o sistema atual visível.
  useAnimatedReaction(
    () => {
      const beat = Math.max(0, time.value / spb);
      const m = Math.min(L.totalMeasures - 1, Math.floor(beat / bpb + 1e-6));
      return Math.floor(m / measuresPerSystem);
    },
    (system, prev) => {
      if (system !== prev) {
        const target = topPad + system * systemHeight - gap * 3;
        scrollTo(scrollRef, 0, Math.max(0, target - (system > 0 ? systemHeight * 0.35 : 0)), true);
      }
    },
  );

  // ------------------------------------------------------------- desenho estático (pautas)
  const staticLayer = useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let i = 0; i < L.systems; i++) {
      const count = Math.min(measuresPerSystem, L.totalMeasures - i * measuresPerSystem);
      const x0 = marginX;
      const x1 = measureX(i * measuresPerSystem + count - 1) + measureWidth;
      const tTop = yOf(i, 38, 'treble');
      const bBot = yOf(i, 18, 'bass');
      // Linhas das pautas
      for (let k = 0; k < 5; k++) {
        const s = 30 + k * 2;
        out.push(<Line key={`t${i}${k}`} x1={x0} x2={x1} y1={yOf(i, s, 'treble')} y2={yOf(i, s, 'treble')} stroke={STAFF} strokeWidth={1} />);
        const b = 18 + k * 2;
        out.push(<Line key={`b${i}${k}`} x1={x0} x2={x1} y1={yOf(i, b, 'bass')} y2={yOf(i, b, 'bass')} stroke={STAFF} strokeWidth={1} />);
      }
      // Chave do sistema e barra inicial
      out.push(<Line key={`sys${i}`} x1={x0} x2={x0} y1={tTop} y2={bBot} stroke={INK} strokeWidth={1.4} />);
      out.push(<Rect key={`brace${i}`} x={x0 - 5} y={tTop} width={3} height={bBot - tTop} fill={INK} rx={1.5} />);
      // Claves
      out.push(
        <SvgText key={`cs${i}`} x={x0 + gap * 0.3} y={yOf(i, 32, 'treble') + gap * 1.25} fontSize={gap * 5.2} fill={INK}>
          𝄞
        </SvgText>,
      );
      out.push(
        <SvgText key={`cf${i}`} x={x0 + gap * 0.4} y={yOf(i, 24, 'bass') + gap * 1.9} fontSize={gap * 3.6} fill={INK}>
          𝄢
        </SvgText>,
      );
      // Armadura
      const sharpsT = [38, 35, 39, 36, 33, 37, 34];
      const flatsT = [34, 37, 33, 36, 32, 35, 31];
      const steps = song.keySignature >= 0 ? sharpsT : flatsT;
      for (let k = 0; k < keyCount; k++) {
        const kx = x0 + gap * 4.2 + k * gap * 1.1;
        const glyph = song.keySignature >= 0 ? '♯' : '♭';
        out.push(
          <SvgText key={`kt${i}${k}`} x={kx} y={yOf(i, steps[k], 'treble') + half * 0.9} fontSize={gap * 1.9} fill={INK}>
            {glyph}
          </SvgText>,
        );
        out.push(
          <SvgText key={`kb${i}${k}`} x={kx} y={yOf(i, steps[k] - 14, 'bass') + half * 0.9} fontSize={gap * 1.9} fill={INK}>
            {glyph}
          </SvgText>,
        );
      }
      // Fórmula de compasso (só no primeiro sistema)
      if (i === 0 && song.showTimeSignature !== false) {
        const tx = x0 + gap * 4.4 + keyCount * gap * 1.1 + gap * 0.4;
        for (const [staff, mid] of [['treble', 34], ['bass', 22]] as const) {
          out.push(
            <SvgText key={`tsu${staff}`} x={tx} y={yOf(i, mid + 2, staff) + gap * 0.05} fontSize={gap * 2.2} fontWeight="bold" fill={INK}>
              {song.timeSignature[0]}
            </SvgText>,
          );
          out.push(
            <SvgText key={`tsl${staff}`} x={tx} y={yOf(i, mid - 2, staff) + gap * 0.05} fontSize={gap * 2.2} fontWeight="bold" fill={INK}>
              {song.timeSignature[1]}
            </SvgText>,
          );
        }
      }
      // Barras de compasso (atravessam as duas pautas) e número do compasso
      for (let k = 0; k < count; k++) {
        const m = i * measuresPerSystem + k;
        const xr = measureX(m) + measureWidth;
        const last = m === L.totalMeasures - 1;
        out.push(<Line key={`bar${m}`} x1={xr} x2={xr} y1={tTop} y2={bBot} stroke={INK} strokeWidth={1.1} />);
        if (last) {
          out.push(<Line key={`bar${m}a`} x1={xr - 4} x2={xr - 4} y1={tTop} y2={bBot} stroke={INK} strokeWidth={1} />);
          out.push(<Rect key={`bar${m}b`} x={xr - 1} y={tTop} width={3.5} height={bBot - tTop} fill={INK} />);
        }
      }
      const firstMeasure = i * measuresPerSystem + 1 + Math.round(timeline.originBeat / bpb);
      if (i > 0) {
        out.push(
          <SvgText key={`mn${i}`} x={x0 + 2} y={tTop - gap * 1.2} fontSize={gap * 1.2} fill={INK_SOFT}>
            {firstMeasure}
          </SvgText>,
        );
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L, song.keySignature, song.timeSignature, song.showTimeSignature]);

  // ------------------------------------------------------------- notas
  const origin = timeline.originBeat;
  // Grafadores separados por pauta (os acidentes valem por pauta e compasso).
  const spellers = { treble: createSpeller(song.keySignature), bass: createSpeller(song.keySignature) };
  const noteLayer = timeline.notes.map((n) => {
    const rel = n.beat - origin;
    const i = systemOf(rel);
    const staff = n.hand === 'right' ? 'treble' : 'bass';
    const measure = Math.floor(rel / bpb + 1e-6);
    const sp = spellers[staff](n.midi, String(measure));
    const cx = beatX(rel);
    const cy = yOf(i, sp.step, staff);
    const result = resultOf(n.id);
    const color = colorFor(n, result);
    const dotted = [0.75, 1.5, 3, 6].includes(n.beats);
    const base = dotted ? n.beats / 1.5 : n.beats;
    const hollow = base >= 2;
    const up = n.voice ? UP_VOICES.includes(n.voice) : staff === 'treble' ? sp.step < 34 : sp.step < 22;
    const stemX = up ? cx + half * 1.22 : cx - half * 1.22;
    const stemEnd = up ? cy - gap * 3.2 : cy + gap * 3.2;
    // Linhas suplementares
    const ledgers: number[] = [];
    if (staff === 'treble') {
      for (let s = 28; s >= sp.step; s -= 2) ledgers.push(s);
      for (let s = 40; s <= sp.step; s += 2) ledgers.push(s);
    } else {
      for (let s = 16; s >= sp.step; s -= 2) ledgers.push(s);
      for (let s = 28; s <= sp.step; s += 2) ledgers.push(s);
    }
    return (
      <G key={n.id}>
        {ledgers.map((s) => (
          <Line key={s} x1={cx - half * 2.1} x2={cx + half * 2.1} y1={yOf(i, s, staff)} y2={yOf(i, s, staff)} stroke={STAFF} strokeWidth={1} />
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
        {dotted ? <Ellipse cx={cx + gap * 1.25} cy={sp.step % 2 === 0 ? cy - half * 0.6 : cy} rx={1.8} ry={1.8} fill={color} /> : null}
        {base < 4 ? <Line x1={stemX} x2={stemX} y1={cy} y2={stemEnd} stroke={color} strokeWidth={1.2} /> : null}
        {base <= 0.5 ? (
          <Polyline
            points={`${stemX},${stemEnd} ${stemX + gap * 0.9},${stemEnd + (up ? gap * 1.1 : -gap * 1.1)} ${stemX + gap * 0.7},${stemEnd + (up ? gap * 2 : -gap * 2)}`}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
          />
        ) : null}
        {showFingers && n.finger ? (
          <SvgText
            x={cx - 3}
            y={up ? cy + gap * 1.9 : cy - gap * 1.1}
            fontSize={gap * 1.15}
            fontWeight="bold"
            fill={INK_SOFT}>
            {n.finger}
          </SvgText>
        ) : null}
      </G>
    );
  });

  // Pausas
  const restLayer = timeline.rests.map((r, k) => {
    const rel = r.time / timeline.secondsPerBeat;
    const i = systemOf(rel);
    const staff = r.hand === 'right' ? 'treble' : 'bass';
    const mid = staff === 'treble' ? 34 : 22;
    const up = r.voice ? UP_VOICES.includes(r.voice) : true;
    const step = mid + (r.voice ? (up ? 2 : -2) : 0);
    const cx = beatX(rel);
    const y = yOf(i, step, staff);
    if (r.beats >= 4) return <Rect key={`r${k}`} x={cx - gap * 0.6} y={y - gap} width={gap * 1.2} height={half} fill={INK} />;
    if (r.beats >= 2) return <Rect key={`r${k}`} x={cx - gap * 0.6} y={y - half} width={gap * 1.2} height={half} fill={INK} />;
    return (
      <Polyline
        key={`r${k}`}
        points={`${cx - gap * 0.3},${y - gap * 1.5} ${cx + gap * 0.3},${y - gap * 0.6} ${cx - gap * 0.3},${y} ${cx + gap * 0.3},${y + gap * 0.9} ${cx - gap * 0.4},${y + gap * 1.1} ${cx + gap * 0.1},${y + gap * 1.7}`}
        fill="none"
        stroke={INK}
        strokeWidth={1.8}
      />
    );
  });

  return (
    <View style={[styles.paper, { width, height }]}>
      <Animated.ScrollView ref={scrollRef} contentContainerStyle={{ height: contentHeight }} showsVerticalScrollIndicator>
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {song.hymnNumber ? `${song.hymnNumber} — ` : ''}
            {song.title}
          </Text>
          <Text style={styles.headerTempo}>♩ = {Math.round(60 / timeline.secondsPerBeat)}</Text>
        </View>
        <Animated.View pointerEvents="none" style={[styles.cursor, { width: gap * 2.8, height: systemHeight - gap * 3 }, cursorStyle]} />
        <Svg width={width} height={contentHeight} style={StyleSheet.absoluteFill}>
          {staticLayer}
          {restLayer}
          {noteLayer}
        </Svg>
      </Animated.ScrollView>
    </View>
  );
});

function colorFor(n: TimedNote, result: NoteResult): string {
  if (result === 'hit') return HIT;
  if (result === 'missed') return MISS;
  if (!n.active) return INK;
  return n.hand === 'right' ? ACTIVE_RIGHT : ACTIVE_LEFT;
}

const styles = StyleSheet.create({
  paper: { backgroundColor: PAPER, overflow: 'hidden' },
  header: {
    position: 'absolute',
    top: 6,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  headerTitle: { color: INK, fontSize: 15, fontWeight: '800', flexShrink: 1 },
  headerTempo: { color: INK, fontSize: 13, fontWeight: '600' },
  cursor: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: CURSOR,
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(33,150,243,0.7)',
  },
});
