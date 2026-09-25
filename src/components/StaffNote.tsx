import Svg, { Ellipse, G, Line, Text as SvgText } from 'react-native-svg';

import { diatonicStep } from '@/music/theory';
import { colors } from '@/theme';

interface Props {
  /** Uma ou mais notas (desenhadas lado a lado). */
  notes: number[];
  clef?: 'treble' | 'bass';
  width?: number;
  height?: number;
  /** Índice da nota destacada (as outras ficam apagadas). */
  highlight?: number;
  /** Desenha só cabeças (sem hastes), como nas atividades de pauta. */
  headsOnly?: boolean;
  preferFlats?: boolean;
}

/** Pauta simples com clave e notas (usada em explicações, quizzes e leitura). */
export function StaffNotes({ notes, clef, width = 260, height = 140, highlight, headsOnly, preferFlats }: Props) {
  const treble = clef ? clef === 'treble' : Math.min(...notes) >= 59;
  const gap = height / 10;
  const half = gap / 2;
  const bottomLine = treble ? 30 : 18; // Mi4 ou Sol2
  const bottomY = height / 2 + gap * 2;
  const y = (s: number) => bottomY - (s - bottomLine) * half;
  const lines = [0, 2, 4, 6, 8].map((d) => bottomLine + d);
  const startX = gap * 6;
  const stepX = notes.length > 1 ? (width - startX - gap * 2) / notes.length : 0;

  return (
    <Svg width={width} height={height}>
      {lines.map((s) => (
        <Line key={s} x1={4} x2={width - 4} y1={y(s)} y2={y(s)} stroke="#8995B3" strokeWidth={1.2} />
      ))}
      <SvgText x={8} y={treble ? y(32) + gap * 1.3 : y(24) + gap * 1.9} fontSize={treble ? gap * 5.4 : gap * 3.7} fill={colors.text}>
        {treble ? '𝄞' : '𝄢'}
      </SvgText>
      {notes.map((midi, i) => {
        const { step, accidental } = diatonicStep(midi, preferFlats);
        const cx = notes.length > 1 ? startX + stepX * (i + 0.5) : width * 0.62;
        const cy = y(step);
        const color = highlight === undefined || highlight === i ? colors.primary : '#5B6B8C';
        const ledgers: number[] = [];
        for (let s = bottomLine - 2; s >= step; s -= 2) ledgers.push(s);
        for (let s = bottomLine + 10; s <= step; s += 2) ledgers.push(s);
        const up = step < bottomLine + 4;
        return (
          <G key={i}>
            {ledgers.map((s) => (
              <Line key={`l${s}`} x1={cx - gap * 1.3} x2={cx + gap * 1.3} y1={y(s)} y2={y(s)} stroke="#8995B3" strokeWidth={1.2} />
            ))}
            {accidental !== 0 && (
              <SvgText x={cx - gap * 2.3} y={cy + half} fontSize={gap * 1.6} fill={color}>
                {accidental > 0 ? '♯' : '♭'}
              </SvgText>
            )}
            <Ellipse cx={cx} cy={cy} rx={half * 1.35} ry={half * 0.95} fill={color} transform={`rotate(-20 ${cx} ${cy})`} />
            {!headsOnly && (
              <Line
                x1={up ? cx + half * 1.25 : cx - half * 1.25}
                x2={up ? cx + half * 1.25 : cx - half * 1.25}
                y1={cy}
                y2={up ? cy - gap * 3.3 : cy + gap * 3.3}
                stroke={color}
                strokeWidth={1.6}
              />
            )}
          </G>
        );
      })}
    </Svg>
  );
}

/** Compatibilidade: uma única nota. */
export function StaffNote({ midi, width = 220, height = 140, clef }: { midi: number; width?: number; height?: number; clef?: 'treble' | 'bass' }) {
  return <StaffNotes notes={[midi]} width={width} height={height} clef={clef} />;
}
