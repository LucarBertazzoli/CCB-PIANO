import { twoHands } from '../notation';
import type { Song } from '../types';

/** Peças de domínio público usadas como repertório de apoio nas lições. */
export const pieces: Song[] = [
  {
    id: 'pc-alegria',
    kind: 'piece',
    title: 'Hino à Alegria',
    subtitle: 'L. van Beethoven (domínio público)',
    tempo: 84,
    timeSignature: [4, 4],
    keySignature: 0,
    difficulty: 2,
    instruments: ['piano', 'organ'],
    credits: 'Melodia em domínio público. Arranjo simplificado.',
    sections: [
      { id: 'a1', label: 'Frase 1', startBeat: 0, endBeat: 16 },
      { id: 'a2', label: 'Frase 2', startBeat: 16, endBeat: 32 },
    ],
    notes: twoHands(
      'E4/q:3 E4:3 F4:4 G4:5 | G4:5 F4:4 E4:3 D4:2 | C4:1 C4:1 D4:2 E4:3 | E4/q.:3 D4/e:2 D4/h:2 |' +
        ' E4/q:3 E4:3 F4:4 G4:5 | G4:5 F4:4 E4:3 D4:2 | C4:1 C4:1 D4:2 E4:3 | D4/q.:2 C4/e:1 C4/h:1',
      'C3/w:5 | G2/w:5 | C3/w:5 | G2/w:5 | C3/w:5 | G2/w:5 | C3/h:5 F2/h:5 | G2/h:5 C3/h:5',
    ),
  },
];
