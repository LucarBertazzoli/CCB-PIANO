import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import type { NoteResult } from '@/engine/practice-session';
import type { TimedNote } from '@/engine/timeline';
import { noteName, type Notation } from '@/music/theory';
import type { NoteLabelMode } from '@/store/settings';
import { colors } from '@/theme';

import type { KeyboardLayout } from './keyboard-layout';

interface Props {
  layout: KeyboardLayout;
  height: number;
  notes: TimedNote[];
  barLines: number[];
  /** Pixels por segundo (velocidade de queda). */
  pps: number;
  /** Tempo atual da música (s), atualizado a cada quadro. */
  time: SharedValue<number>;
  resultOf: (id: string) => NoteResult;
  /** Muda quando algum resultado muda, para re-renderizar as cores. */
  version: number;
  notation: Notation;
  labelMode: NoteLabelMode;
  /** Tonalidades com bemóis escrevem as teclas pretas como bemóis (Mi♭, não Ré♯). */
  preferFlats?: boolean;
}

function noteColors(note: TimedNote, result: NoteResult) {
  if (!note.active) return { bg: colors.autoNote, border: 'transparent', opacity: 0.55 };
  const base = note.hand === 'right' ? colors.rightHand : colors.leftHand;
  const light = note.hand === 'right' ? colors.rightHandLight : colors.leftHandLight;
  switch (result) {
    case 'hit':
      return { bg: light, border: '#FFFFFF', opacity: 1 };
    case 'missed':
      return { bg: '#4A5570', border: colors.danger, opacity: 0.8 };
    default:
      return { bg: base, border: light, opacity: 1 };
  }
}

const NoteBar = memo(function NoteBar({
  note,
  x,
  width,
  pps,
  result,
  label,
  black,
}: {
  note: TimedNote;
  x: number;
  width: number;
  pps: number;
  result: NoteResult;
  label?: string;
  black: boolean;
}) {
  const h = Math.max(14, note.duration * pps - 3);
  const c = noteColors(note, result);
  return (
    <View
      style={[
        styles.note,
        {
          left: x + 1,
          width: width - 2,
          top: -(note.time * pps) - h,
          height: h,
          backgroundColor: c.bg,
          borderColor: c.border,
          opacity: black ? c.opacity * 0.92 : c.opacity,
        },
      ]}>
      {label ? (
        <Text numberOfLines={1} style={[styles.noteLabel, { fontSize: Math.min(14, width * 0.42) }]}>
          {label}
        </Text>
      ) : null}
    </View>
  );
});

/**
 * “Estrada” de notas caindo sobre o teclado, no estilo Simply Piano.
 * O conteúdo inteiro se move com uma única transformação animada, então o
 * custo por quadro não depende da quantidade de notas.
 */
export const NoteHighway = memo(function NoteHighway({
  layout,
  height,
  notes,
  barLines,
  pps,
  time,
  resultOf,
  notation,
  labelMode,
  preferFlats,
}: Props) {
  const scrollStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: height + time.value * pps }],
  }));

  const laneLines = layout.keys.filter((k) => !k.black && (k.midi % 12 === 0 || k.midi % 12 === 5));

  return (
    <View style={[styles.container, { width: layout.width, height }]}>
      {laneLines.map((k) => (
        <View
          key={k.midi}
          style={[
            styles.lane,
            { left: k.x, backgroundColor: k.midi % 12 === 0 ? colors.laneLineC : colors.laneLine },
          ]}
        />
      ))}

      <Animated.View style={[StyleSheet.absoluteFill, scrollStyle]}>
        {barLines.map((t) => (
          <View key={`bar-${t}`} style={[styles.bar, { top: -t * pps, width: layout.width }]} />
        ))}
        {notes.map((n) => {
          const key = layout.byMidi.get(n.midi);
          if (!key) return null;
          const label =
            labelMode === 'name'
              ? noteName(n.midi, notation, { preferFlats })
              : labelMode === 'finger' && n.finger
                ? String(n.finger)
                : undefined;
          return (
            <NoteBar
              key={n.id}
              note={n}
              x={key.x}
              width={key.width}
              pps={pps}
              result={resultOf(n.id)}
              label={n.active ? label : undefined}
              black={key.black}
            />
          );
        })}
      </Animated.View>

      <View style={styles.hitLine} pointerEvents="none" />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.highway,
    overflow: 'hidden',
  },
  lane: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  bar: {
    position: 'absolute',
    left: 0,
    height: 1,
    backgroundColor: colors.barLine,
  },
  note: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 3,
    overflow: 'hidden',
  },
  noteLabel: {
    color: '#fff',
    fontWeight: '800',
  },
  hitLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: colors.hitLine,
    opacity: 0.85,
  },
});
