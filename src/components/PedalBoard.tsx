import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isBlackKey, noteName, type Notation } from '@/music/theory';

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

function pedalColor(black: boolean, state: KeyState | undefined): string {
  switch (state) {
    case 'expected-pedal':
    case 'expected-left':
    case 'expected-right':
      return black ? '#00796B' : '#4DD0B8';
    case 'correct':
      return '#4CD964';
    case 'wrong':
      return '#FF5A5F';
    case 'pressed':
      return black ? '#4A3A2A' : '#C9A77C';
    default:
      return black ? '#2B211A' : '#D9B98E';
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
    <View style={[styles.board, { width, height }]}>
      <Text style={styles.title}>PEDALEIRA</Text>
      {pedals.map((midi) => {
        const black = isBlackKey(midi);
        const hint = hints?.get(midi);
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
                backgroundColor: pedalColor(black, hint?.state),
                zIndex: black ? 2 : 1,
              },
            ]}>
            {!black ? (
              <Text numberOfLines={1} style={[styles.label, midi % 12 === 0 && styles.labelC]}>
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
    backgroundColor: '#1A140F',
    borderTopWidth: 2,
    borderTopColor: '#3A2C20',
    alignSelf: 'center',
  },
  title: {
    position: 'absolute',
    left: 6,
    top: 2,
    color: '#8A7560',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pedal: {
    position: 'absolute',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.35)',
  },
  label: { color: '#4A3826', fontSize: 9, fontWeight: '700' },
  labelC: { color: '#2A1D12', fontWeight: '900' },
});
