import { isBlackKey } from '@/music/theory';

export interface KeyRect {
  midi: number;
  black: boolean;
  x: number;
  width: number;
}

export interface KeyboardLayout {
  low: number;
  high: number;
  width: number;
  whiteWidth: number;
  keys: KeyRect[];
  byMidi: Map<number, KeyRect>;
}

const BLACK_RATIO = 0.62;

/** Ajusta a extensão para começar e terminar num Dó, com um mínimo de teclas brancas. */
export function fitRange(lowest: number, highest: number, minWhiteKeys = 15): [number, number] {
  let low = lowest - (((lowest % 12) + 12) % 12);
  let high = highest + ((12 - (highest % 12)) % 12);
  if (high <= low) high = low + 12;
  let growHigh = true;
  while (countWhite(low, high) < minWhiteKeys) {
    if (growHigh && high < 108) {
      do high++;
      while (isBlackKey(high));
    } else if (low > 21) {
      do low--;
      while (isBlackKey(low));
    } else {
      break;
    }
    growHigh = !growHigh;
  }
  return [low, high];
}

function countWhite(low: number, high: number): number {
  let n = 0;
  for (let m = low; m <= high; m++) if (!isBlackKey(m)) n++;
  return n;
}

export function keyboardLayout(low: number, high: number, width: number): KeyboardLayout {
  const whiteCount = countWhite(low, high);
  const whiteWidth = width / Math.max(1, whiteCount);
  const blackWidth = whiteWidth * BLACK_RATIO;
  const keys: KeyRect[] = [];
  let whiteIndex = 0;
  for (let midi = low; midi <= high; midi++) {
    if (isBlackKey(midi)) {
      keys.push({ midi, black: true, x: whiteIndex * whiteWidth - blackWidth / 2, width: blackWidth });
    } else {
      keys.push({ midi, black: false, x: whiteIndex * whiteWidth, width: whiteWidth });
      whiteIndex++;
    }
  }
  return { low, high, width, whiteWidth, keys, byMidi: new Map(keys.map((k) => [k.midi, k])) };
}
