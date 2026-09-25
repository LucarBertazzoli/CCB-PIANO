import { score } from '../notation';
import type { Song } from '../types';

/**
 * Estudos de leitura e exercícios de ritmo da trilha.
 *
 * São composições próprias do app que seguem a MESMA PROGRESSÃO do MOR
 * (Volume 1): 5 notas a partir do Dó3 (Dó central) nas claves de Sol e de Fá,
 * mãos intercaladas, mãos juntas em movimento paralelo e contrário, ligadura,
 * ponto de aumento, colcheia, escalas de Dó, Sol e Fá maior.
 * Os Estudos originais do método podem ser cadastrados no mesmo formato.
 *
 * Lembrete: no padrão CCB o Dó central (C4) é chamado de Dó3.
 */

const base = {
  kind: 'exercise' as const,
  keySignature: 0,
  instruments: ['piano' as const, 'organ' as const],
};

/** Exercícios de leitura rítmica: todas as notas no Si (linha do meio), qualquer tecla vale. */
function rhythm(
  id: string,
  title: string,
  pattern: string,
  opts: { tempo?: number; time?: [number, number]; showTimeSignature?: boolean } = {},
): Song {
  return {
    ...base,
    id,
    title,
    tempo: opts.tempo ?? 66,
    timeSignature: opts.time ?? [4, 4],
    showTimeSignature: opts.showTimeSignature ?? true,
    difficulty: 1,
    tags: ['ritmo'],
    ...score(pattern),
  };
}

export const rhythmSongs: Song[] = [
  rhythm('rit-pulso', 'Pulsação', 'B4/q B4 B4 B4 | B4 B4 B4 B4 | B4 B4 B4 B4 | B4/w', {
    tempo: 60,
    showTimeSignature: false,
  }),
  rhythm('rit-figuras', 'Semibreve, mínima e semínima', 'B4/w | B4/h B4/h | B4/q B4 B4 B4 | B4/h B4/q B4 | B4/w', {
    tempo: 66,
    showTimeSignature: false,
  }),
  rhythm('rit-misto', 'Ritmo misto', 'B4/h B4/q B4 | B4/q B4 B4/h | B4/w | B4/q B4/q B4/h | B4/w', {
    tempo: 70,
    showTimeSignature: false,
  }),
  rhythm('rit-pausas', 'Som e silêncio', 'B4/q r/q B4/q r/q | B4/h r/h | B4/q B4 r/q B4 | B4/w', { tempo: 66 }),
  rhythm('rit-ternario', 'Compasso ternário', 'B4/h B4/q | B4/q B4 B4 | B4/h B4/q | B4/h.', {
    tempo: 72,
    time: [3, 4],
  }),
  rhythm('rit-pontuada', 'Mínima pontuada', 'B4/h. B4/q | B4/h. B4/q | B4/h B4/h | B4/w', { tempo: 70 }),
  rhythm('rit-colcheias', 'Colcheias', 'B4/q B4 B4/e B4 B4/q | B4/e B4 B4 B4 B4/h | B4/q B4/e B4 B4/q B4/e B4 | B4/w', {
    tempo: 60,
  }),
];

export const estudos: Song[] = [
  // --- 5 notas a partir do Dó3, sem fórmula de compasso (como nos primeiros Estudos do MOR)
  {
    ...base,
    id: 'est-01',
    title: 'Estudo de leitura 1',
    subtitle: 'Mão direita • Clave de Sol',
    tempo: 72,
    timeSignature: [4, 4],
    showTimeSignature: false,
    difficulty: 1,
    ...score('C4/w:1 | D4/w:2 | E4/h:3 D4/h:2 | C4/w:1'),
  },
  {
    ...base,
    id: 'est-02',
    title: 'Estudo de leitura 2',
    subtitle: 'Mão esquerda • Clave de Fá',
    tempo: 72,
    timeSignature: [4, 4],
    showTimeSignature: false,
    difficulty: 1,
    ...score('', 'C4/w:1 | B3/w:2 | A3/h:3 B3/h:2 | C4/w:1'),
  },
  {
    ...base,
    id: 'est-03',
    title: 'Estudo de leitura 3',
    subtitle: 'Cinco notas — mão direita',
    tempo: 76,
    timeSignature: [4, 4],
    showTimeSignature: false,
    difficulty: 1,
    ...score('C4/h:1 D4/h:2 | E4/h:3 F4/h:4 | G4/w:5 | G4/h:5 F4/h:4 | E4/h:3 D4/h:2 | C4/w:1'),
  },
  {
    ...base,
    id: 'est-04',
    title: 'Estudo de leitura 4',
    subtitle: 'Cinco notas — mão esquerda',
    tempo: 76,
    timeSignature: [4, 4],
    showTimeSignature: false,
    difficulty: 1,
    ...score('', 'C4/h:1 B3/h:2 | A3/h:3 G3/h:4 | F3/w:5 | F3/h:5 G3/h:4 | A3/h:3 B3/h:2 | C4/w:1'),
  },
  {
    ...base,
    id: 'est-05',
    title: 'Estudo de leitura 5',
    subtitle: 'Mãos intercaladas',
    tempo: 76,
    timeSignature: [4, 4],
    showTimeSignature: false,
    difficulty: 1,
    ...score(
      'C4/h:1 D4/h:2 | E4/w:3 | r/w | r/w | E4/h:3 D4/h:2 | C4/w:1',
      'r/w | r/w | C4/h:1 B3/h:2 | A3/w:3 | r/w | r/w',
    ),
  },
  {
    ...base,
    id: 'est-06',
    title: 'Estudo de leitura 6',
    subtitle: 'Mãos intercaladas com semínimas',
    tempo: 80,
    timeSignature: [4, 4],
    showTimeSignature: false,
    difficulty: 2,
    ...score(
      'C4/q:1 D4:2 E4:3 F4:4 | G4/w:5 | r/w | r/w | G4/q:5 F4:4 E4:3 D4:2 | C4/w:1',
      'r/w | r/w | C4/q:1 B3:2 A3:3 G3:4 | F3/w:5 | r/w | r/w',
    ),
  },
  // --- Mão esquerda na posição do Dó2, mãos juntas, com fórmula de compasso
  {
    ...base,
    id: 'est-07',
    title: 'Estudo de leitura 7',
    subtitle: 'Mãos juntas — movimento paralelo',
    tempo: 72,
    timeSignature: [4, 4],
    difficulty: 2,
    ...score(
      'C4/q:1 D4:2 E4:3 F4:4 | G4/h:5 G4/h:5 | G4/q:5 F4:4 E4:3 D4:2 | C4/w:1',
      'C3/q:5 D3:4 E3:3 F3:2 | G3/h:1 G3/h:1 | G3/q:1 F3:2 E3:3 D3:4 | C3/w:5',
    ),
  },
  {
    ...base,
    id: 'est-08',
    title: 'Estudo de leitura 8',
    subtitle: 'Mãos juntas — movimento contrário',
    tempo: 72,
    timeSignature: [4, 4],
    difficulty: 2,
    ...score(
      'C4/q:1 D4:2 E4:3 F4:4 | G4/w:5 | G4/q:5 F4:4 E4:3 D4:2 | C4/w:1',
      'G3/q:1 F3:2 E3:3 D3:4 | C3/w:5 | C3/q:5 D3:4 E3:3 F3:2 | G3/w:1',
    ),
  },
  {
    ...base,
    id: 'est-09',
    title: 'Estudo de leitura 9',
    subtitle: 'Melodia e acompanhamento',
    tempo: 72,
    timeSignature: [4, 4],
    difficulty: 2,
    ...score(
      'E4/h:3 D4/q:2 C4:1 | D4/h:2 E4/h:3 | F4/q:4 E4:3 D4/h:2 | C4/w:1',
      'C3/w:5 | G3/w:1 | G3/h:1 F3/h:2 | E3/h:3 C3/h:5',
    ),
  },
  {
    ...base,
    id: 'est-10',
    title: 'Estudo com ligaduras',
    subtitle: 'Notas sustentadas além da barra',
    tempo: 76,
    timeSignature: [4, 4],
    difficulty: 2,
    ...score('C4/h:1 E4/h:3 | G4/6:5 E4/h:3 | D4/h:2 F4/h:4 | E4/6:3 r/h', 'C3/w:5 | C3/w:5 | G3/w:1 | G3/w:1 | C3/w:5 | C3/w:5'),
  },
  {
    ...base,
    id: 'est-11',
    title: 'Estudo em três tempos',
    subtitle: 'Mínima pontuada',
    tempo: 84,
    timeSignature: [3, 4],
    difficulty: 2,
    ...score('C4/h.:1 | D4/h:2 E4/q:3 | F4/h.:4 | E4/h:3 D4/q:2 | C4/h.:1', 'C3/h.:5 | G3/h.:1 | F3/h.:2 | G3/h.:1 | C3/h.:5'),
  },
  {
    ...base,
    id: 'est-12',
    title: 'Estudo com colcheias',
    subtitle: 'Articulação dos cinco dedos',
    tempo: 66,
    timeSignature: [4, 4],
    difficulty: 3,
    ...score(
      'C4/e:1 D4:2 E4:3 F4:4 G4/h:5 | G4/e:5 F4:4 E4:3 D4:2 C4/h:1 | C4/e:1 E4:3 D4:2 F4:4 E4/q:3 G4:5 | C4/w:1',
      'C3/w:5 | C3/w:5 | G3/w:1 | C3/w:5',
    ),
  },
  // --- Tonalidades
  {
    ...base,
    id: 'est-sol',
    title: 'Estudo em Sol maior',
    subtitle: 'Posição de Sol',
    tempo: 76,
    timeSignature: [4, 4],
    keySignature: 1,
    difficulty: 2,
    ...score('G4/q:1 A4:2 B4:3 C5:4 | D5/w:5 | D5/q:5 C5:4 B4:3 A4:2 | G4/w:1', 'G2/w:5 | D3/w:1 | D3/h:1 D3/h:1 | G2/w:5'),
  },
  {
    ...base,
    id: 'esc-sol',
    title: 'Escala de Sol maior',
    tempo: 72,
    timeSignature: [4, 4],
    keySignature: 1,
    difficulty: 3,
    ...score('G4/q:1 A4:2 B4:3 C5:1 | D5:2 E5:3 F#5:4 G5:5 | G5:5 F#5:4 E5:3 D5:2 | C5:1 B4:3 A4:2 G4:1'),
  },
  {
    ...base,
    id: 'est-fa',
    title: 'Estudo em Fá maior',
    subtitle: 'Posição de Fá',
    tempo: 76,
    timeSignature: [4, 4],
    keySignature: -1,
    difficulty: 2,
    ...score('F4/q:1 G4:2 A4:3 Bb4:4 | C5/w:5 | C5/q:5 Bb4:4 A4:3 G4:2 | F4/w:1', 'F2/w:5 | C3/w:1 | C3/h:1 C3/h:1 | F2/w:5'),
  },
  {
    ...base,
    id: 'esc-fa',
    title: 'Escala de Fá maior',
    tempo: 72,
    timeSignature: [4, 4],
    keySignature: -1,
    difficulty: 3,
    ...score('F4/q:1 G4:2 A4:3 Bb4:4 | C5:1 D5:2 E5:3 F5:4 | F5:4 E5:3 D5:2 C5:1 | Bb4:4 A4:3 G4:2 F4:1'),
  },
];
