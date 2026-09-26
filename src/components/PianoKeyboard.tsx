import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { noteName, type Notation } from '@/music/theory';
import { colors } from '@/theme';

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
  /** Etiqueta no canto (ex.: “Superior”, “Inferior”) e sua cor. */
  tag?: string;
  tagColor?: string;
  /** Bemóis em vez de sustenidos nos nomes (tonalidades com ♭). */
  preferFlats?: boolean;
}

function keyColor(black: boolean, state: KeyState): string {
  switch (state) {
    case 'expected-right':
      return black ? '#1F7FC4' : colors.rightHandLight;
    case 'expected-left':
      return black ? '#7D3FCC' : colors.leftHandLight;
    case 'expected-pedal':
      return black ? '#00796B' : '#7FD8C8';
    case 'correct':
      return colors.keyCorrect;
    case 'wrong':
      return colors.keyWrong;
    case 'pressed':
      return black ? colors.keyBlackPressed : colors.keyWhitePressed;
    default:
      return black ? colors.keyBlack : colors.keyWhite;
  }
}

const Key = memo(function Key({
  rect,
  height,
  hint,
  label,
  strong,
  onNoteOn,
  onNoteOff,
}: {
  rect: KeyRect;
  height: number;
  hint?: KeyHint;
  label?: string;
  /** Dó com número da oitava (referência de posição). */
  strong?: boolean;
  onNoteOn?: (midi: number) => void;
  onNoteOff?: (midi: number) => void;
}) {
  const state = hint?.state ?? 'idle';
  const keyHeight = rect.black ? height * 0.62 : height;
  const fontSize = Math.max(8, Math.min(12, rect.width * 0.36));
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
          backgroundColor: keyColor(rect.black, state),
          zIndex: rect.black ? 2 : 1,
        },
      ]}>
      {hint?.finger && rect.width >= 18 && (state === 'expected-right' || state === 'expected-left') ? (
        <View style={[styles.fingerBadge, { backgroundColor: state === 'expected-right' ? colors.rightHand : colors.leftHand }]}>
          <Text style={styles.fingerText}>{hint.finger}</Text>
        </View>
      ) : null}
      {label ? (
        <Text
          numberOfLines={1}
          style={[styles.label, { fontSize }, strong && styles.labelStrong, rect.black && styles.labelBlack]}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
});

/**
 * Teclado de piano desenhado com Views. A mesma `layout` é usada pelas notas
 * que caem, garantindo que cada nota caia exatamente sobre a sua tecla.
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
  tagColor,
  preferFlats,
}: Props) {
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
            onNoteOn={onNoteOn}
            onNoteOff={onNoteOff}
          />
        );
      })}
      {tag ? (
        <View pointerEvents="none" style={[styles.tag, { backgroundColor: tagColor ?? colors.primary }]}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#000',
  },
  key: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  white: {
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    paddingBottom: 6,
  },
  black: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    paddingBottom: 4,
    borderWidth: 1,
    borderColor: '#000',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5B6475',
  },
  labelStrong: { color: '#1D2433', fontWeight: '800' },
  tag: {
    position: 'absolute',
    top: 3,
    left: 3,
    zIndex: 5,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    opacity: 0.92,
  },
  tagText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  labelBlack: {
    color: '#DDD',
  },
  fingerBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  fingerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
});
