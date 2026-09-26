import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Ícones de traço fino (SVG), na cor do texto. Emojis (✋, ⏱…) aparecem
 * coloridos em cada sistema e quebrariam o visual preto e branco.
 */
export type IconName =
  | 'back'
  | 'play'
  | 'pause'
  | 'restart'
  | 'music'
  | 'eye'
  | 'keys'
  | 'mic'
  | 'contrast'
  | 'metronome'
  | 'repeat'
  | 'search'
  | 'arrowUp'
  | 'close'
  | 'check'
  | 'chevronDown'
  | 'chevronUp'
  | 'star'
  | 'plus'
  | 'minus'
  | 'starOutline'
  | 'chevronRight'
  | 'touch'
  | 'cable';

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color: string }) {
  const stroke = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'back' ? <Path d="M15 5l-7 7 7 7" {...stroke} strokeWidth={2.2} /> : null}
      {name === 'play' ? <Path d="M7 4.5v15l12.5-7.5z" fill={color} /> : null}
      {name === 'pause' ? (
        <>
          <Rect x={6} y={4.5} width={4} height={15} rx={1.2} fill={color} />
          <Rect x={14} y={4.5} width={4} height={15} rx={1.2} fill={color} />
        </>
      ) : null}
      {name === 'restart' ? (
        <>
          <Path d="M4 12a8 8 0 1 0 2.4-5.7" {...stroke} />
          <Path d="M4 4v4.5h4.5" {...stroke} />
        </>
      ) : null}
      {name === 'music' ? (
        <>
          <Path d="M9 18V5l11-2v13" {...stroke} />
          <Circle cx={6} cy={18} r={3} {...stroke} />
          <Circle cx={17} cy={16} r={3} {...stroke} />
        </>
      ) : null}
      {name === 'eye' ? (
        <>
          <Path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z" {...stroke} />
          <Circle cx={12} cy={12} r={3} {...stroke} />
        </>
      ) : null}
      {name === 'keys' ? (
        <>
          <Rect x={2.5} y={5} width={19} height={14} rx={2} {...stroke} />
          <Path d="M8.8 12.5V19M15.2 12.5V19" {...stroke} />
          <Rect x={7} y={5} width={3.6} height={7.5} rx={0.8} fill={color} />
          <Rect x={13.4} y={5} width={3.6} height={7.5} rx={0.8} fill={color} />
        </>
      ) : null}
      {name === 'mic' ? (
        <>
          <Rect x={9} y={2.5} width={6} height={12} rx={3} {...stroke} />
          <Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21.5M8.5 21.5h7" {...stroke} />
        </>
      ) : null}
      {name === 'contrast' ? (
        <>
          <Circle cx={12} cy={12} r={9} {...stroke} />
          <Path d="M12 3a9 9 0 0 0 0 18z" fill={color} />
        </>
      ) : null}
      {name === 'metronome' ? (
        <>
          <Path d="M9 3h6l4 18H5z" {...stroke} />
          <Path d="M12 16l5.5-9" {...stroke} />
        </>
      ) : null}
      {name === 'repeat' ? (
        <>
          <Path d="M17 2.5l3.5 3.5L17 9.5" {...stroke} />
          <Path d="M3.5 11.5V10a4 4 0 0 1 4-4h13" {...stroke} />
          <Path d="M7 21.5L3.5 18 7 14.5" {...stroke} />
          <Path d="M20.5 12.5V14a4 4 0 0 1-4 4h-13" {...stroke} />
        </>
      ) : null}
      {name === 'search' ? (
        <>
          <Circle cx={11} cy={11} r={7} {...stroke} />
          <Path d="M21 21l-4.8-4.8" {...stroke} />
        </>
      ) : null}
      {name === 'arrowUp' ? <Path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" {...stroke} strokeWidth={2.2} /> : null}
      {name === 'close' ? <Path d="M6 6l12 12M18 6L6 18" {...stroke} strokeWidth={2} /> : null}
      {name === 'chevronDown' ? <Path d="M6 9l6 6 6-6" {...stroke} strokeWidth={2} /> : null}
      {name === 'chevronUp' ? <Path d="M6 15l6-6 6 6" {...stroke} strokeWidth={2} /> : null}
      {name === 'star' ? <Path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill={color} /> : null}
      {name === 'starOutline' ? <Path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" {...stroke} strokeWidth={1.5} /> : null}
      {name === 'chevronRight' ? <Path d="M9 6l6 6-6 6" {...stroke} strokeWidth={2} /> : null}
      {name === 'plus' ? <Path d="M12 5v14M5 12h14" {...stroke} strokeWidth={2.2} /> : null}
      {name === 'minus' ? <Path d="M5 12h14" {...stroke} strokeWidth={2.2} /> : null}
      {name === 'check' ? <Path d="M5 12.5l4.5 4.5L19 7.5" {...stroke} strokeWidth={2.2} /> : null}
      {name === 'touch' ? (
        <>
          <Rect x={6} y={2.5} width={12} height={19} rx={2.5} {...stroke} />
          <Path d="M10.5 18.5h3" {...stroke} />
        </>
      ) : null}
      {name === 'cable' ? (
        <>
          <Rect x={7} y={2.5} width={10} height={8} rx={1.5} {...stroke} />
          <Path d="M10 2.5v3M14 2.5v3M12 10.5v5a4 4 0 0 1-4 4H5" {...stroke} />
        </>
      ) : null}
    </Svg>
  );
}
