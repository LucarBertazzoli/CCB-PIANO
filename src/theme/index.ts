/** Paleta do app: fundo escuro no player (como no Simply Piano) e cores vivas por mão. */
export const colors = {
  bg: '#0E1726',
  bgElevated: '#16223A',
  card: '#1C2A47',
  border: '#2A3B5F',
  text: '#F4F7FF',
  textDim: '#9AA8C7',
  primary: '#3FA9F5',
  primaryDark: '#1F7FC4',
  success: '#4CD964',
  warning: '#FFC53D',
  danger: '#FF5A5F',
  star: '#FFC53D',

  /** Notas da mão direita (azul) e esquerda (verde/roxo), estilo Simply Piano. */
  rightHand: '#3FA9F5',
  rightHandLight: '#8ED0FF',
  leftHand: '#B26BFF',
  leftHandLight: '#D8B2FF',
  autoNote: '#5B6B8C',

  highway: '#0A1220',
  laneLine: 'rgba(255,255,255,0.06)',
  laneLineC: 'rgba(255,255,255,0.16)',
  barLine: 'rgba(255,255,255,0.10)',
  hitLine: '#FFFFFF',

  keyWhite: '#FAFAFA',
  keyWhitePressed: '#D9DEE8',
  keyBlack: '#1B1B1F',
  keyBlackPressed: '#3A3A44',
  keyCorrect: '#4CD964',
  keyWrong: '#FF5A5F',
} as const;

export const radius = { sm: 6, md: 12, lg: 20, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
