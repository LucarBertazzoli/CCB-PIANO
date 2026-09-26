import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isBlackKey, noteName, type Notation } from '@/music/theory';

import { font, usePalette, type Palette } from '@/theme';

import type { KeyHint, KeyState } from './PianoKeyboard';

interface Props {
  width: number;
  height: number;
  /** Extensão da pedaleira (padrão: 13 pedais, Dó a Dó). */
  low?: number;
  high?: number;
  hints?: ReadonlyMap<number, KeyHint>;
  notation: Notation;
  preferFlats?: boolean;
  onNoteOn?: (midi: number) => void;
  onNoteOff?: (midi: number) => void;
}

function pedalColor(p: Palette, black: boolean, state: KeyState | undefined): { bg: string; fg: string } {
  switch (state) {
    case 'expected-pedal':
    case 'expected-left':
    case 'expected-right':
      return { bg: black ? p.keyPedal[1] : p.keyPedal[0], fg: p.keyPedal[2] };
    case 'correct':
      return { bg: p.keyCorrect, fg: p.mode === 'mono' ? '#000000' : '#FFFFFF' };
    case 'wrong':
      return { bg: p.keyWrong, fg: '#FFFFFF' };
    case 'pressed':
      return { bg: black ? '#444444' : '#B0B0B0', fg: p.pedalLabel };
    default:
      return { bg: black ? p.pedalSharp : p.pedalNatural, fg: p.pedalLabel };
  }
}

/**
 * Pedaleira do órgão (vista de cima): pedais naturais longos e sustenidos
 * mais curtos. Acende o pedal esperado em verde, como a pauta da pedaleira.
 */
export const PedalBoard = memo(function PedalBoard({
  width,
  height,
  low = 36,
  high = 48,
  hints,
  notation,
  preferFlats,
  onNoteOn,
  onNoteOff,
}: Props) {
  const palette = usePalette();
  const naturals: number[] = [];
  for (let m = low; m <= high; m++) if (!isBlackKey(m)) naturals.push(m);
  const slot = width / naturals.length;
  const pedalW = Math.min(slot * 0.62, 40);
  const sharpW = pedalW * 0.8;

  const xOf = (midi: number) => {
    if (!isBlackKey(midi)) return naturals.indexOf(midi) * slot + (slot - pedalW) / 2;
    // Sustenido: entre o natural de baixo e o de cima.
    const i = naturals.indexOf(midi - 1);
    return (i + 1) * slot - sharpW / 2;
  };

  const pedals: number[] = [];
  for (let m = low; m <= high; m++) pedals.push(m);

  return (
    <View style={[styles.board, { width, height, backgroundColor: palette.pedalBoard }]}>
      <Text style={styles.title}>PEDALEIRA</Text>
      {pedals.map((midi) => {
        const black = isBlackKey(midi);
        const hint = hints?.get(midi);
        const c = pedalColor(palette, black, hint?.state);
        return (
          <Pressable
            key={midi}
            onPressIn={() => onNoteOn?.(midi)}
            onPressOut={() => onNoteOff?.(midi)}
            accessibilityLabel={`Pedal ${noteName(midi, notation, { withOctave: true, preferFlats })}`}
            style={[
              styles.pedal,
              {
                left: xOf(midi),
                width: black ? sharpW : pedalW,
                top: black ? 2 : height * 0.22,
                height: black ? height * 0.55 : height * 0.74,
                backgroundColor: c.bg,
                zIndex: black ? 2 : 1,
              },
            ]}>
            {!black ? (
              <Text numberOfLines={1} style={[styles.label, { color: c.fg }, midi % 12 === 0 && styles.labelC]}>
                {noteName(midi, notation, { withOctave: midi % 12 === 0, preferFlats })}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  board: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#222222',
    alignSelf: 'center',
  },
  title: {
    position: 'absolute',
    left: 6,
    top: 3,
    fontFamily: font,
    color: '#6E6E6E',
    fontSize: 8,
    letterSpacing: 1,
  },
  pedal: {
    position: 'absolute',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  label: { fontFamily: font, fontSize: 9 },
  labelC: { fontWeight: '700' },
});
