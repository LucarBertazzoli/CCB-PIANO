import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Ellipse, G, Line, Rect, Text as SvgText } from 'react-native-svg';

import type { NoteResult } from '@/engine/practice-session';
import type { Timeline } from '@/engine/timeline';
import { diatonicStep } from '@/music/theory';
import { colors } from '@/theme';

interface Props {
  width: number;
  height: number;
  timeline: Timeline;
  keySignature: number;
  time: SharedValue<number>;
  resultOf: (id: string) => NoteResult;
  version: number;
}

// Passos diatônicos das linhas das pautas (Mi4..Fá5 e Sol2..Lá3).
const TREBLE_LINES = [30, 32, 34, 36, 38];
const BASS_LINES = [18, 20, 22, 24, 26];
const MIDDLE_C = 28;
const CURSOR_X = 110;
const CLEF_AREA = 70;

/**
 * Partitura em pauta dupla (clave de Sol e de Fá) que rola para a esquerda,
 * com o cursor fixo. Versão inicial: cabeças de nota, hastes, acidentes e
 * linhas suplementares. Próximos passos: colchetes, ligaduras e armadura.
 */
export const SheetMusic = memo(function SheetMusic({
  width,
  height,
  timeline,
  keySignature,
  time,
  resultOf,
}: Props) {
  const gap = Math.min(14, height / 16); // distância entre linhas
  const half = gap / 2;
  const trebleBottomY = height / 2 - gap;
  const y = (step: number) => trebleBottomY - (step - 30) * half;
  const pxPerSec = Math.max(90, 70 / timeline.secondsPerBeat);
  const contentWidth = CURSOR_X + (timeline.duration + 2) * pxPerSec + width;
  const preferFlats = keySignature < 0;

  const scrollStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -time.value * pxPerSec }],
  }));

  const staffLines = [...TREBLE_LINES, ...BASS_LINES].map((s) => (
    <Line key={s} x1={0} x2={width} y1={y(s)} y2={y(s)} stroke="#44506B" strokeWidth={1} />
  ));

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {staffLines}
      </Svg>

      <Animated.View style={[styles.scroll, { width: contentWidth, height }, scrollStyle]}>
        <Svg width={contentWidth} height={height}>
          {timeline.barLines.map((t) => {
            const x = CURSOR_X + t * pxPerSec - 8;
            return <Line key={`b${t}`} x1={x} x2={x} y1={y(38)} y2={y(18)} stroke="#44506B" strokeWidth={1} />;
          })}
          {timeline.notes.map((n) => {
            const { step, accidental } = diatonicStep(n.midi, preferFlats);
            const cx = CURSOR_X + n.time * pxPerSec;
            const cy = y(step);
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
            const hollow = n.beats >= 2;
            const stemUp = n.hand === 'left' ? step < 22 : step < 34;
            const ledgers: number[] = [];
            if (step >= 40) for (let s = 40; s <= step; s += 2) ledgers.push(s);
            if (step <= 16) for (let s = 16; s >= step; s -= 2) ledgers.push(s);
            if (step === MIDDLE_C) ledgers.push(MIDDLE_C);
            return (
              <G key={n.id}>
                {ledgers.map((s) => (
                  <Line key={s} x1={cx - half * 2.2} x2={cx + half * 2.2} y1={y(s)} y2={y(s)} stroke="#8995B3" strokeWidth={1} />
                ))}
                {accidental !== 0 ? (
                  <SvgText x={cx - gap * 2} y={cy + half} fontSize={gap * 1.4} fill={color}>
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
                {n.beats < 4 ? (
                  <Line
                    x1={stemUp ? cx + half * 1.25 : cx - half * 1.25}
                    x2={stemUp ? cx + half * 1.25 : cx - half * 1.25}
                    y1={cy}
                    y2={stemUp ? cy - gap * 3.3 : cy + gap * 3.3}
                    stroke={color}
                    strokeWidth={1.4}
                  />
                ) : null}
                {n.beats <= 0.5 ? (
                  <Line
                    x1={stemUp ? cx + half * 1.25 : cx - half * 1.25}
                    x2={stemUp ? cx + half * 2.6 : cx + half * 0.1}
                    y1={stemUp ? cy - gap * 3.3 : cy + gap * 3.3}
                    y2={stemUp ? cy - gap * 2.2 : cy + gap * 2.2}
                    stroke={color}
                    strokeWidth={1.6}
                  />
                ) : null}
              </G>
            );
          })}
        </Svg>
      </Animated.View>

      {/* Claves fixas à esquerda e cursor de leitura. */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Rect x={0} y={0} width={CLEF_AREA} height={height} fill={colors.highway} />
        {[...TREBLE_LINES, ...BASS_LINES].map((st) => (
          <Line key={st} x1={0} x2={CLEF_AREA} y1={y(st)} y2={y(st)} stroke="#44506B" strokeWidth={1} />
        ))}
        <SvgText x={8} y={y(32) + gap * 1.2} fontSize={gap * 5.2} fill="#C9D3EA">
          𝄞
        </SvgText>
        <SvgText x={10} y={y(24) + gap * 0.9} fontSize={gap * 3.2} fill="#C9D3EA">
          𝄢
        </SvgText>
        <Line x1={CURSOR_X} x2={CURSOR_X} y1={y(40)} y2={y(16)} stroke={colors.primary} strokeWidth={2} />
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
