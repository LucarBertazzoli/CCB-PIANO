import { twoHands } from '../notation';
import type { Song } from '../types';

/**
 * Hinos.
 *
 * Os hinos do hinário da CCB serão adicionados aqui (ou carregados de uma API)
 * seguindo o mesmo formato. Veja `docs/CONTEUDO.md` para o passo a passo.
 *
 * O item abaixo é apenas um EXEMPLO com uma melodia de domínio público
 * (“Old Hundredth”, Genebra, 1551) para testar o fluxo completo.
 */
export const hymns: Song[] = [
  {
    id: 'hino-exemplo',
    kind: 'hymn',
    hymnNumber: 0,
    title: 'Hino de exemplo',
    subtitle: 'Melodia “Old Hundredth” (domínio público) — substituir pelos hinos da CCB',
    tempo: 76,
    timeSignature: [4, 4],
    keySignature: 1,
    difficulty: 3,
    instruments: ['piano', 'organ'],
    credits: 'Melodia de domínio público; harmonização simplificada de exemplo.',
    sections: [
      { id: 'l1', label: '1ª linha', startBeat: 0, endBeat: 12 },
      { id: 'l2', label: '2ª linha', startBeat: 12, endBeat: 24 },
      { id: 'l3', label: '3ª linha', startBeat: 24, endBeat: 36 },
      { id: 'l4', label: '4ª linha', startBeat: 36, endBeat: 48 },
    ],
    notes: twoHands(
      // Mão direita (soprano)
      'G4/h G4/q F#4 E4 D4 | G4 A4 B4/w |' +
        ' B4/h B4/q B4 A4 G4 | C5 B4 A4/w |' +
        ' G4/h A4/q B4 A4 G4 | E4 F#4 G4/w |' +
        ' D5/h B4/q G4 A4 C5 | B4 A4 G4/w',
      // Mão esquerda (baixo)
      'G3/h E3/q D3 C3 B2 | E3 D3 G2/w |' +
        ' G3/h E3/q G3 D3 E3 | A2 D3 D3/w |' +
        ' E3/h F#3/q G3 F#3 E3 | C3 D3 G2/w |' +
        ' B2/h E3/q C3 D3 A2 | G2 D3 G2/w',
    ),
  },
];
