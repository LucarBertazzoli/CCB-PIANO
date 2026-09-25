import Svg, { Ellipse, Line, Text as SvgText } from 'react-native-svg';

import { diatonicStep } from '@/music/theory';
import { colors } from '@/theme';

/** Uma nota isolada numa pauta (clave de Sol para Dó central e acima, clave de Fá abaixo). */
export function StaffNote({ midi, width = 220, height = 140 }: { midi: number; width?: number; height?: number }) {
  const treble = midi >= 60;
  const { step, accidental } = diatonicStep(midi);
  const gap = height / 10;
  const half = gap / 2;
  const bottomLine = treble ? 30 : 18; // Mi4 ou Sol2
  const bottomY = height / 2 + gap * 2;
  const y = (s: number) => bottomY - (s - bottomLine) * half;
  const cx = width * 0.62;
  const cy = y(step);
  const lines = [0, 2, 4, 6, 8].map((d) => bottomLine + d);
  const ledgers: number[] = [];
  for (let s = bottomLine - 2; s >= step; s -= 2) ledgers.push(s);
  for (let s = bottomLine + 10; s <= step; s += 2) ledgers.push(s);

  return (
    <Svg width={width} height={height}>
      {lines.map((s) => (
        <Line key={s} x1={8} x2={width - 8} y1={y(s)} y2={y(s)} stroke="#8995B3" strokeWidth={1.2} />
      ))}
      <SvgText x={12} y={treble ? y(32) + gap * 1.3 : y(24) + gap * 0.9} fontSize={treble ? gap * 5.4 : gap * 3.3} fill={colors.text}>
        {treble ? '𝄞' : '𝄢'}
      </SvgText>
      {ledgers.map((s) => (
        <Line key={`l${s}`} x1={cx - gap * 1.3} x2={cx + gap * 1.3} y1={y(s)} y2={y(s)} stroke="#8995B3" strokeWidth={1.2} />
      ))}
      {accidental !== 0 && (
        <SvgText x={cx - gap * 2.3} y={cy + half} fontSize={gap * 1.6} fill={colors.text}>
          {accidental > 0 ? '♯' : '♭'}
        </SvgText>
      )}
      <Ellipse cx={cx} cy={cy} rx={half * 1.35} ry={half * 0.95} fill={colors.primary} transform={`rotate(-20 ${cx} ${cy})`} />
      <Line
        x1={step < bottomLine + 4 ? cx + half * 1.25 : cx - half * 1.25}
        x2={step < bottomLine + 4 ? cx + half * 1.25 : cx - half * 1.25}
        y1={cy}
        y2={step < bottomLine + 4 ? cy - gap * 3.3 : cy + gap * 3.3}
        stroke={colors.primary}
        strokeWidth={1.6}
      />
    </Svg>
  );
}
