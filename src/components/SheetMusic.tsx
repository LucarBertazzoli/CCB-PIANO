import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Ellipse, G, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import type { NoteResult } from '@/engine/practice-session';
import type { Timeline } from '@/engine/timeline';
import { diatonicStep, pitchClass } from '@/music/theory';
import { colors } from '@/theme';

interface Props {
  width: number;
  height: number;
  timeline: Timeline;
  keySignature: number;
  timeSignature?: [number, number] | null;
  /** Mostra só a clave de Sol ou só a de Fá (ex.: exercícios de ritmo). */
  staves?: 'grand' | 'treble' | 'bass';
  time: SharedValue<number>;
  resultOf: (id: string) => NoteResult;
  version: number;
}

// Passos diatônicos das linhas das pautas (Mi4..Fá5 e Sol2..Lá3).
const TREBLE_LINES = [30, 32, 34, 36, 38];
const BASS_LINES = [18, 20, 22, 24, 26];
const MIDDLE_C = 28;
const STAFF_COLOR = '#56627F';

// Ordem dos sustenidos (Fá Dó Sol Ré Lá Mi Si) e bemóis (Si Mi Lá Ré Sol Dó Fá).
const SHARP_PCS = [6, 1, 8, 3, 10, 5, 0];
const FLAT_PCS = [10, 3, 8, 1, 6, 11, 4];
// Posição (passo diatônico) de cada acidente da armadura em cada clave.
const SHARP_STEPS_TREBLE = [38, 35, 39, 36, 33, 37, 34];
const FLAT_STEPS_TREBLE = [34, 37, 33, 36, 32, 35, 31];

/** Classes de altura já alteradas pela armadura (não precisam de acidente na nota). */
export function keySignaturePitchClasses(fifths: number): Set<number> {
  return new Set(fifths >= 0 ? SHARP_PCS.slice(0, fifths) : FLAT_PCS.slice(0, -fifths));
}

/**
 * Partitura que rola para a esquerda com o cursor fixo, estilo Simply Piano.
 * Desenha pauta dupla (ou simples), claves, armadura, fórmula de compasso,
 * cabeças de nota, hastes, colchetes, pontos de aumento, pausas e linhas
 * suplementares.
 */
export const SheetMusic = memo(function SheetMusic({
  width,
  height,
  timeline,
  keySignature,
  timeSignature,
  staves = 'grand',
  time,
  resultOf,
}: Props) {
  const showTreble = staves !== 'bass';
  const showBass = staves !== 'treble';
  const gap = Math.min(13, height / (staves === 'grand' ? 19 : 9));
  const half = gap / 2;
  // Centraliza verticalmente o que for mostrado.
  const centerStep = staves === 'treble' ? 34 : staves === 'bass' ? 22 : MIDDLE_C;
  // Na pauta dupla, afasta as duas pautas; o Dó central fica junto da pauta da mão que o toca.
  const split = staves === 'grand' ? gap * 1.3 : 0;
  const y = (step: number, hand?: 'right' | 'left') => {
    const base = height / 2 - (step - centerStep) * half;
    if (!split) return base;
    if (step > MIDDLE_C || (step === MIDDLE_C && hand !== 'left')) return base - split;
    return base + split;
  };

  const keyCount = Math.abs(keySignature);
  const clefArea = 56 + keyCount * gap * 0.9 + (timeSignature ? gap * 2.4 : 0);
  const cursorX = clefArea + 40;
  const pxPerSec = Math.max(90, 80 / timeline.secondsPerBeat);
  const contentWidth = cursorX + (timeline.duration + 2) * pxPerSec + width;
  const preferFlats = keySignature < 0;
  const inKey = keySignaturePitchClasses(keySignature);

  const scrollStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -time.value * pxPerSec }],
  }));

  const lines = [...(showTreble ? TREBLE_LINES : []), ...(showBass ? BASS_LINES : [])];
  const top = showTreble ? 38 : 26;
  const bottom = showBass ? 18 : 30;

  const staffLines = (x1: number, x2: number) =>
    lines.map((s) => <Line key={s} x1={x1} x2={x2} y1={y(s)} y2={y(s)} stroke={STAFF_COLOR} strokeWidth={1} />);

  // Armadura: desenhada nas duas claves (na de Fá, uma oitava diatônica abaixo).
  const keySigGlyphs = (clefOffset: number) => {
    const steps = keySignature >= 0 ? SHARP_STEPS_TREBLE : FLAT_STEPS_TREBLE;
    return steps.slice(0, keyCount).map((s, i) => (
      <SvgText
        key={`k${clefOffset}${i}`}
        x={52 + i * gap * 0.9}
        y={y(s - clefOffset) + half * 0.9}
        fontSize={gap * 1.7}
        fill="#C9D3EA">
        {keySignature >= 0 ? '♯' : '♭'}
      </SvgText>
    ));
  };

  const timeSigGlyphs = (midStep: number) =>
    timeSignature ? (
      <G key={`t${midStep}`}>
        <SvgText
          x={52 + keyCount * gap * 0.9 + 4}
          y={y(midStep + 2) + gap * 0.05}
          fontSize={gap * 2.1}
          fontWeight="bold"
          fill="#E6ECFA">
          {timeSignature[0]}
        </SvgText>
        <SvgText
          x={52 + keyCount * gap * 0.9 + 4}
          y={y(midStep - 2) + gap * 0.05}
          fontSize={gap * 2.1}
          fontWeight="bold"
          fill="#E6ECFA">
          {timeSignature[1]}
        </SvgText>
      </G>
    ) : null;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {staffLines(0, width)}
      </Svg>

      <Animated.View style={[styles.scroll, { width: contentWidth, height }, scrollStyle]}>
        <Svg width={contentWidth} height={height}>
          {timeline.barLines.map((t) => {
            const x = cursorX + t * pxPerSec - 10;
            return <Line key={`b${t}`} x1={x} x2={x} y1={y(top)} y2={y(bottom)} stroke={STAFF_COLOR} strokeWidth={1.2} />;
          })}

          {timeline.rests.map((r, i) => {
            const cx = cursorX + r.time * pxPerSec;
            const mid = r.hand === 'right' && showTreble ? 34 : 22;
            const color = '#AEB9D6';
            if (r.beats >= 4) {
              return <Rect key={`r${i}`} x={cx - gap * 0.6} y={y(mid + 2)} width={gap * 1.2} height={half} fill={color} />;
            }
            if (r.beats >= 2) {
              return <Rect key={`r${i}`} x={cx - gap * 0.6} y={y(mid) - half} width={gap * 1.2} height={half} fill={color} />;
            }
            if (r.beats >= 1) {
              const x0 = cx - gap * 0.3;
              const y0 = y(mid + 3);
              return (
                <Polyline
                  key={`r${i}`}
                  points={`${x0},${y0} ${x0 + gap * 0.6},${y0 + gap * 0.9} ${x0},${y0 + gap * 1.6} ${x0 + gap * 0.6},${y0 + gap * 2.5} ${x0 - gap * 0.1},${y0 + gap * 2.7} ${x0 + gap * 0.4},${y0 + gap * 3.3}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={2.2}
                />
              );
            }
            return (
              <G key={`r${i}`}>
                <Ellipse cx={cx - gap * 0.2} cy={y(mid + 1)} rx={half * 0.5} ry={half * 0.5} fill={color} />
                <Line x1={cx - gap * 0.2} x2={cx + gap * 0.4} y1={y(mid + 1)} y2={y(mid + 1) - half * 0.3} stroke={color} strokeWidth={1.8} />
                <Line x1={cx + gap * 0.4} x2={cx - gap * 0.1} y1={y(mid + 1) - half * 0.3} y2={y(mid - 2)} stroke={color} strokeWidth={1.8} />
              </G>
            );
          })}

          {timeline.notes.map((n) => {
            const { step, accidental } = diatonicStep(n.midi, preferFlats);
            const cx = cursorX + n.time * pxPerSec;
            const cy = y(step, n.hand);
            const result = resultOf(n.id);
            const color =
              result === 'hit'
                ? colors.success
                : result === 'missed'
                  ? colors.danger
                  : n.active
                    ? n.hand === 'right'
                      ? colors.rightHandLight
                      : colors.leftHandLight
                    : '#7E8AA8';
            const dotted = [1.5, 3, 0.75].includes(n.beats);
            const base = dotted ? n.beats / 1.5 : n.beats;
            const hollow = base >= 2;
            const stemUp = n.hand === 'left' ? step < 22 : step < 34;
            const stemX = stemUp ? cx + half * 1.25 : cx - half * 1.25;
            const stemEnd = stemUp ? cy - gap * 3.3 : cy + gap * 3.3;
            const ledgers: number[] = [];
            if (showTreble && step >= 40) for (let s = 40; s <= step; s += 2) ledgers.push(s);
            if (showBass && step <= 16) for (let s = 16; s >= step; s -= 2) ledgers.push(s);
            if (!showBass && step <= 28) for (let s = 28; s >= step; s -= 2) ledgers.push(s);
            if (!showTreble && step >= 28) for (let s = 28; s <= step; s += 2) ledgers.push(s);
            if (staves === 'grand' && step === MIDDLE_C) ledgers.push(MIDDLE_C);
            const showAccidental = accidental !== 0 && !inKey.has(pitchClass(n.midi));
            return (
              <G key={n.id}>
                {ledgers.map((s) => (
                  <Line key={s} x1={cx - half * 2.2} x2={cx + half * 2.2} y1={y(s, n.hand)} y2={y(s, n.hand)} stroke="#8995B3" strokeWidth={1.2} />
                ))}
                {showAccidental ? (
                  <SvgText x={cx - gap * 2} y={cy + half} fontSize={gap * 1.5} fill={color}>
                    {accidental > 0 ? '♯' : '♭'}
                  </SvgText>
                ) : null}
                <Ellipse
                  cx={cx}
                  cy={cy}
                  rx={half * 1.35}
                  ry={half * 0.95}
                  fill={hollow ? 'none' : color}
                  stroke={color}
                  strokeWidth={hollow ? 2 : 1}
                  transform={`rotate(-20 ${cx} ${cy})`}
                />
                {dotted ? <Ellipse cx={cx + gap * 1.2} cy={step % 2 === 0 ? cy - half * 0.6 : cy} rx={2.2} ry={2.2} fill={color} /> : null}
                {base < 4 ? <Line x1={stemX} x2={stemX} y1={cy} y2={stemEnd} stroke={color} strokeWidth={1.5} /> : null}
                {base <= 0.5 ? (
                  <Line
                    x1={stemX}
                    x2={stemX + gap * 0.9}
                    y1={stemEnd}
                    y2={stemUp ? stemEnd + gap * 1.2 : stemEnd - gap * 1.2}
                    stroke={color}
                    strokeWidth={1.8}
                  />
                ) : null}
                {n.finger && n.active ? (
                  <SvgText
                    x={cx - 3}
                    y={stemUp ? cy + gap * 1.9 : cy - gap * 1.2}
                    fontSize={gap * 0.95}
                    fontWeight="bold"
                    fill="#9FB0D6">
                    {n.finger}
                  </SvgText>
                ) : null}
              </G>
            );
          })}
        </Svg>
      </Animated.View>

      {/* Claves, armadura e fórmula de compasso fixas à esquerda; cursor de leitura. */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Rect x={0} y={0} width={clefArea} height={height} fill={colors.highway} />
        {staffLines(0, clefArea)}
        {staves === 'grand' ? (
          <Line x1={2} x2={2} y1={y(38)} y2={y(18)} stroke={STAFF_COLOR} strokeWidth={2} />
        ) : null}
        {showTreble ? (
          <SvgText x={8} y={y(32) + gap * 1.2} fontSize={gap * 5.2} fill="#C9D3EA">
            𝄞
          </SvgText>
        ) : null}
        {showBass ? (
          <SvgText x={10} y={y(24) + gap * 1.9} fontSize={gap * 3.6} fill="#C9D3EA">
            𝄢
          </SvgText>
        ) : null}
        {showTreble ? keySigGlyphs(0) : null}
        {showBass ? keySigGlyphs(14) : null}
        {showTreble ? timeSigGlyphs(34) : null}
        {showBass ? timeSigGlyphs(22) : null}
        <Rect x={cursorX - 14} y={y(top) - gap} width={28} height={y(bottom) - y(top) + gap * 2} fill={colors.primary} opacity={0.12} rx={6} />
        <Line x1={cursorX} x2={cursorX} y1={y(top) - gap} y2={y(bottom) + gap} stroke={colors.primary} strokeWidth={2} />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.highway,
    overflow: 'hidden',
  },
  scroll: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
