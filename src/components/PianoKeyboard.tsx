import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { noteName, type Notation } from '@/music/theory';
import { font, usePalette, type Palette } from '@/theme';

import type { KeyboardLayout, KeyRect } from './keyboard-layout';

export type KeyState =
  | 'idle'
  | 'pressed'
  | 'expected-right'
  | 'expected-left'
  | 'expected-pedal'
  | 'correct'
  | 'wrong';

export interface KeyHint {
  state: KeyState;
  finger?: number;
}

interface Props {
  layout: KeyboardLayout;
  height: number;
  hints?: ReadonlyMap<number, KeyHint>;
  notation: Notation;
  showLabels?: boolean;
  onNoteOn?: (midi: number) => void;
  onNoteOff?: (midi: number) => void;
  /** Etiqueta no canto (ex.: “Superior”, “Inferior”). */
  tag?: string;
  /** Bemóis em vez de sustenidos nos nomes (tonalidades com ♭). */
  preferFlats?: boolean;
}

/** Cor de fundo e cor do texto de uma tecla conforme o estado. */
function keyStyle(p: Palette, black: boolean, state: KeyState): { bg: string; fg: string } {
  const filled = (c: [string, string, string]) => ({ bg: black ? c[1] : c[0], fg: c[2] });
  switch (state) {
    case 'expected-right':
      return filled(p.keyRight);
    case 'expected-left':
      return filled(p.keyLeft);
    case 'expected-pedal':
      return filled(p.keyPedal);
    case 'correct':
      return { bg: p.keyCorrect, fg: p.mode === 'mono' ? '#000000' : '#FFFFFF' };
    case 'wrong':
      return { bg: p.keyWrong, fg: '#FFFFFF' };
    case 'pressed':
      return { bg: black ? p.keyBlackPressed : p.keyWhitePressed, fg: black ? '#DDD' : p.keyLabel };
    default:
      return { bg: black ? p.keyBlack : p.keyWhite, fg: black ? '#DDD' : p.keyLabel };
  }
}

const Key = memo(function Key({
  rect,
  height,
  hint,
  label,
  strong,
  palette,
  onNoteOn,
  onNoteOff,
}: {
  rect: KeyRect;
  height: number;
  hint?: KeyHint;
  label?: string;
  /** Dó com número da oitava (referência de posição). */
  strong?: boolean;
  palette: Palette;
  onNoteOn?: (midi: number) => void;
  onNoteOff?: (midi: number) => void;
}) {
  const state = hint?.state ?? 'idle';
  const { bg, fg } = keyStyle(palette, rect.black, state);
  const keyHeight = rect.black ? height * 0.62 : height;
  const fontSize = Math.max(8, Math.min(12, rect.width * 0.36));
  const mark = state === 'correct' ? '✓' : state === 'wrong' ? '✕' : null;
  return (
    <Pressable
      onPressIn={() => onNoteOn?.(rect.midi)}
      onPressOut={() => onNoteOff?.(rect.midi)}
      style={[
        styles.key,
        rect.black ? styles.black : styles.white,
        {
          left: rect.x,
          width: rect.black ? rect.width : rect.width - 1,
          height: keyHeight,
          backgroundColor: bg,
          zIndex: rect.black ? 2 : 1,
        },
      ]}>
      {mark ? <Text style={[styles.mark, { color: fg }]}>{mark}</Text> : null}
      {hint?.finger && rect.width >= 18 && (state === 'expected-right' || state === 'expected-left') ? (
        <Text style={[styles.finger, { color: fg }]}>{hint.finger}</Text>
      ) : null}
      {label ? (
        <Text numberOfLines={1} style={[styles.label, { fontSize, color: fg }, strong && styles.labelStrong]}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
});

/**
 * Teclado desenhado com Views. A mesma `layout` é usada pelas notas que caem,
 * garantindo que cada nota caia exatamente sobre a sua tecla.
 */
export const PianoKeyboard = memo(function PianoKeyboard({
  layout,
  height,
  hints,
  notation,
  showLabels = true,
  onNoteOn,
  onNoteOff,
  tag,
  preferFlats,
}: Props) {
  const palette = usePalette();
  // Teclas estreitas: só os Dós ganham nome (com a oitava) para não poluir.
  const narrow = layout.whiteWidth < 24;
  return (
    <View style={[styles.container, { width: layout.width, height }]}>
      {layout.keys.map((rect) => {
        const hint = hints?.get(rect.midi);
        const isC = rect.midi % 12 === 0;
        const showLabel = !rect.black && (isC || (showLabels && !narrow));
        const label = showLabel ? noteName(rect.midi, notation, { withOctave: isC, preferFlats }) : undefined;
        return (
          <Key
            key={rect.midi}
            rect={rect}
            height={height}
            hint={hint}
            label={label}
            strong={isC}
            palette={palette}
            onNoteOn={onNoteOn}
            onNoteOff={onNoteOff}
          />
        );
      })}
      {tag ? (
        <View pointerEvents="none" style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#050505',
  },
  key: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  white: {
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    paddingBottom: 5,
  },
  black: {
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    paddingBottom: 4,
  },
  label: { fontFamily: font, fontSize: 11 },
  labelStrong: { fontWeight: '700' },
  mark: { fontFamily: font, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  finger: { fontFamily: font, fontSize: 12, fontWeight: '700', marginBottom: 2 },
  tag: {
    position: 'absolute',
    top: 2,
    left: 2,
    zIndex: 5,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(17,17,17,0.85)',
  },
  tagText: { fontFamily: font, color: '#FFFFFF', fontSize: 9, letterSpacing: 0.6 },
});
