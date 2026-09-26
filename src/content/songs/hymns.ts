import { hymnId, hymnIndex } from '../hymnal';
import { fourVoices } from '../notation';
import type { Song } from '../types';

/**
 * Hinos com partitura cadastrada.
 *
 * Cada hino é escrito a 4 vozes (soprano, contralto, tenor e baixo), como no
 * hinário: assim o aluno pode praticar cada voz, cada mão ou o hino inteiro,
 * no piano ou no órgão. Veja `docs/CONTEUDO.md` para o passo a passo.
 *
 * O item abaixo é um EXEMPLO com melodia de domínio público (“Old Hundredth”,
 * Genebra, 1551) e harmonização simples, para testar o fluxo completo até os
 * hinos do hinário serem cadastrados.
 */
export const hymns: Song[] = [
  {
    id: 'hino-exemplo',
    kind: 'hymn',
    hymnNumber: 0,
    title: 'Hino de exemplo',
    subtitle: 'Melodia “Old Hundredth” (domínio público) — a 4 vozes',
    tempo: 76,
    timeSignature: [4, 4],
    keySignature: 1,
    difficulty: 3,
    instruments: ['piano', 'organ'],
    credits: 'Melodia de domínio público; harmonização de exemplo.',
    sections: [
      { id: 'l1', label: '1ª linha', startBeat: 0, endBeat: 12 },
      { id: 'l2', label: '2ª linha', startBeat: 12, endBeat: 24 },
      { id: 'l3', label: '3ª linha', startBeat: 24, endBeat: 36 },
      { id: 'l4', label: '4ª linha', startBeat: 36, endBeat: 48 },
    ],
    ...fourVoices({
      soprano:
        'G4/h G4/q F#4 | E4 D4 G4 A4 | B4/w |' +
        ' B4/h B4/q B4 | A4 G4 C5 B4 | A4/w |' +
        ' G4/h A4/q B4 | A4 G4 E4 F#4 | G4/w |' +
        ' D5/h B4/q G4 | A4 C5 B4 A4 | G4/w',
      alto:
        'D4/h E4/q D4 | C4 B3 B3 D4 | D4/w |' +
        ' D4/h E4/q D4 | D4 E4 E4 D4 | D4/w |' +
        ' D4/h D4/q D4 | D4 E4 C4 D4 | D4/w |' +
        ' G4/h G4/q E4 | F#4 E4 D4 C4 | B3/w',
      tenor:
        'B3/h B3/q A3 | G3 G3 G3 F#3 | G3/w |' +
        ' G3/h G3/q G3 | F#3 B3 A3 G3 | F#3/w |' +
        ' B3/h F#3/q G3 | A3 B3 G3 A3 | B3/w |' +
        ' B3/h D4/q B3 | D4 A3 G3 F#3 | G3/w',
      bass:
        'G2/h E3/q D3 | C3 B2 E3 D3 | G2/w |' +
        ' G3/h E3/q D3 | D3 E3 A2 D3 | D3/w |' +
        ' G2/h D3/q G2 | F#3 E3 C3 D3 | G2/w |' +
        ' G3/h G2/q E3 | D3 C3 D3 D3 | G2/w',
    }),
  },
];

/** Uma entrada do hinário. */
export interface HymnEntry {
  kind: 'hino' | 'coro';
  number: number;
  title: string;
  songId: string;
}

/** Catálogo completo: hinos 1–480 e coros 1–6, todos com partitura. */
export function hymnCatalog(): HymnEntry[] {
  return hymnIndex.map((h) => ({ kind: h.kind, number: h.n, title: h.title, songId: hymnId(h.kind, h.n) }));
}
