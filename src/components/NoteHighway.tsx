import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import type { NoteResult } from '@/engine/practice-session';
import type { TimedNote } from '@/engine/timeline';
import { noteName, type Notation } from '@/music/theory';
import type { NoteLabelMode } from '@/store/settings';
import { usePalette, useType, type Palette, type TypeFace } from '@/theme';
import { readableOn } from '@/theme/color';

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

function noteColors(p: Palette, note: TimedNote, result: NoteResult) {
  if (!note.active) return { bg: p.noteAuto, border: 'transparent', fg: p.textDim };
  const base = note.hand === 'right' ? p.noteRight : p.noteLeft;
  switch (result) {
    case 'hit':
      return { bg: p.noteHit, border: p.noteHit, fg: readableOn(p.noteHit) };
    case 'missed':
      return { bg: p.noteMissed, border: base, fg: base };
    default:
      return { bg: base, border: base, fg: readableOn(base) };
  }
}

const NoteBar = memo(function NoteBar({
  note,
  x,
  width,
  pps,
  result,
  label,
  palette,
  type,
}: {
  palette: Palette;
  type: TypeFace;
  note: TimedNote;
  x: number;
  width: number;
  pps: number;
  result: NoteResult;
  label?: string;
}) {
  const h = Math.max(14, note.duration * pps - 3);
  const c = noteColors(palette, note, result);
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
        },
      ]}>
      {label ? (
        <Text numberOfLines={1} style={[type.bold, { color: c.fg, fontSize: Math.min(13, width * 0.4) }]}>
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
  const palette = usePalette();
  const type = useType();
  const scrollStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: height + time.value * pps }],
  }));

  const laneLines = layout.keys.filter((k) => !k.black && (k.midi % 12 === 0 || k.midi % 12 === 5));

  return (
    <View style={[styles.container, { width: layout.width, height, backgroundColor: palette.highway }]}>
      {laneLines.map((k) => (
        <View
          key={k.midi}
          style={[
            styles.lane,
            { left: k.x, backgroundColor: k.midi % 12 === 0 ? palette.laneC : palette.lane },
          ]}
        />
      ))}

      <Animated.View style={[StyleSheet.absoluteFill, scrollStyle]}>
        {barLines.map((t) => (
          <View key={`bar-${t}`} style={[styles.bar, { top: -t * pps, width: layout.width, backgroundColor: palette.barLine }]} />
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
              palette={palette}
              type={type}
            />
          );
        })}
      </Animated.View>

      <View style={[styles.hitLine, { backgroundColor: palette.hitLine }]} pointerEvents="none" />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
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
  },
  note: {
    position: 'absolute',
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 3,
    overflow: 'hidden',
  },
  hitLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
  },
});
