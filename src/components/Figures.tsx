import { Text, View } from 'react-native';
import Svg, { Ellipse, G, Line, Polyline, Rect } from 'react-native-svg';

import type { FigureName } from '@/content/types';
import { colors } from '@/theme';

export const FIGURE_LABEL: Record<FigureName, string> = {
  semibreve: 'Semibreve',
  minima: 'Mínima',
  seminima: 'Semínima',
  colcheia: 'Colcheia',
  'minima-pontuada': 'Mínima pontuada',
  'pausa-semibreve': 'Pausa de semibreve',
  'pausa-minima': 'Pausa de mínima',
  'pausa-seminima': 'Pausa de semínima',
  'pausa-colcheia': 'Pausa de colcheia',
};

/** Desenha uma figura musical (nota ou pausa) isolada. */
export function FigureGlyph({ name, size = 64, color = colors.text }: { name: FigureName; size?: number; color?: string }) {
  const w = size;
  const h = size * 1.3;
  const cx = w * 0.42;
  const cy = h * 0.75;
  const rx = size * 0.16;
  const ry = size * 0.11;
  const stemX = cx + rx * 0.92;
  const lineY = [0.25, 0.4, 0.55, 0.7, 0.85].map((f) => h * f);

  const head = (hollow: boolean) => (
    <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={hollow ? 'none' : color} stroke={color} strokeWidth={hollow ? 2.5 : 1} transform={`rotate(-20 ${cx} ${cy})`} />
  );
  const stem = <Line x1={stemX} x2={stemX} y1={cy} y2={cy - h * 0.55} stroke={color} strokeWidth={2} />;

  let body: React.ReactNode;
  switch (name) {
    case 'semibreve':
      body = head(true);
      break;
    case 'minima':
      body = (
        <G>
          {head(true)}
          {stem}
        </G>
      );
      break;
    case 'minima-pontuada':
      body = (
        <G>
          {head(true)}
          {stem}
          <Ellipse cx={cx + rx * 2} cy={cy - ry * 0.4} rx={3} ry={3} fill={color} />
        </G>
      );
      break;
    case 'seminima':
      body = (
        <G>
          {head(false)}
          {stem}
        </G>
      );
      break;
    case 'colcheia':
      body = (
        <G>
          {head(false)}
          {stem}
          <Polyline
            points={`${stemX},${cy - h * 0.55} ${stemX + w * 0.22},${cy - h * 0.35} ${stemX + w * 0.16},${cy - h * 0.18}`}
            fill="none"
            stroke={color}
            strokeWidth={2.4}
          />
        </G>
      );
      break;
    case 'pausa-semibreve':
      body = (
        <G>
          {lineY.map((ly) => (
            <Line key={ly} x1={4} x2={w - 4} y1={ly} y2={ly} stroke="#56627F" strokeWidth={1} />
          ))}
          <Rect x={w * 0.3} y={lineY[1]} width={w * 0.4} height={h * 0.07} fill={color} />
        </G>
      );
      break;
    case 'pausa-minima':
      body = (
        <G>
          {lineY.map((ly) => (
            <Line key={ly} x1={4} x2={w - 4} y1={ly} y2={ly} stroke="#56627F" strokeWidth={1} />
          ))}
          <Rect x={w * 0.3} y={lineY[2] - h * 0.07} width={w * 0.4} height={h * 0.07} fill={color} />
        </G>
      );
      break;
    case 'pausa-seminima': {
      const x0 = w * 0.4;
      const y0 = h * 0.22;
      const u = h * 0.1;
      body = (
        <Polyline
          points={`${x0},${y0} ${x0 + u},${y0 + u * 1.4} ${x0},${y0 + u * 2.6} ${x0 + u},${y0 + u * 4} ${x0 - u * 0.2},${y0 + u * 4.3} ${x0 + u * 0.6},${y0 + u * 5.3}`}
          fill="none"
          stroke={color}
          strokeWidth={3}
        />
      );
      break;
    }
    case 'pausa-colcheia':
      body = (
        <G>
          <Ellipse cx={w * 0.38} cy={h * 0.38} rx={4} ry={4} fill={color} />
          <Line x1={w * 0.38} x2={w * 0.62} y1={h * 0.38} y2={h * 0.32} stroke={color} strokeWidth={2.4} />
          <Line x1={w * 0.62} x2={w * 0.45} y1={h * 0.32} y2={h * 0.72} stroke={color} strokeWidth={2.4} />
        </G>
      );
      break;
  }
  return (
    <Svg width={w} height={h}>
      {body}
    </Svg>
  );
}

export function FigureRow({ names, size = 56 }: { names: FigureName[]; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
      {names.map((n, i) => (
        <View key={`${n}${i}`} style={{ alignItems: 'center' }}>
          <FigureGlyph name={n} size={size} />
          {names.length > 1 ? <Text style={{ color: colors.textDim, fontSize: 11 }}>{FIGURE_LABEL[n]}</Text> : null}
        </View>
      ))}
    </View>
  );
}
