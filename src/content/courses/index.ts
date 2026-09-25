import type { Course } from '../types';

import { morCourses } from './mor';

/**
 * Trilhas de aprendizagem. Cada lição segue o ritmo:
 * explicação → ver/ouvir → praticar no modo espera → tocar no andamento.
 */
const baseCourses: Course[] = [
  {
    id: 'teclado-basico',
    title: 'Primeiros passos no teclado',
    description: 'Do Dó central aos primeiros hinos com as duas mãos.',
    instrument: 'both',
    units: [
      {
        id: 'u1',
        title: 'Conhecendo o teclado',
        lessons: [
          {
            id: 'l-do-central',
            title: 'O Dó central',
            description: 'Encontre o Dó e toque com o polegar direito.',
            steps: [
              {
                type: 'intro',
                title: 'Grupos de teclas pretas',
                body: 'As teclas pretas vêm em grupos de 2 e de 3. O Dó é a tecla branca logo à esquerda do grupo de 2 teclas pretas.',
                highlight: [60],
              },
              {
                type: 'intro',
                title: 'Os dedos',
                body: 'Numeramos os dedos de 1 (polegar) a 5 (mindinho), nas duas mãos. O número aparece dentro de cada nota que cai.',
              },
              { type: 'watch', title: 'Veja e ouça', songId: 'ex-do-central', hands: 'right' },
              { type: 'practice', title: 'Sua vez', songId: 'ex-do-central', hands: 'right' },
              { type: 'play', title: 'No ritmo', songId: 'ex-do-central', hands: 'right', minStars: 1 },
            ],
          },
          {
            id: 'l-do-re-mi',
            title: 'Dó, Ré, Mi',
            steps: [
              {
                type: 'intro',
                title: 'Três notas vizinhas',
                body: 'Polegar no Dó, indicador no Ré e dedo médio no Mi. Mantenha a mão arredondada, como se segurasse uma laranja.',
                highlight: [60, 62, 64],
              },
              { type: 'watch', title: 'Veja e ouça', songId: 'ex-do-re-mi', hands: 'right' },
              { type: 'practice', title: 'Sua vez', songId: 'ex-do-re-mi', hands: 'right' },
              { type: 'play', title: 'No ritmo', songId: 'ex-do-re-mi', hands: 'right', minStars: 1 },
            ],
          },
        ],
      },
      {
        id: 'u2',
        title: 'Posição de Dó',
        lessons: [
          {
            id: 'l-cinco-md',
            title: 'Cinco dedos — mão direita',
            steps: [
              {
                type: 'intro',
                title: 'Posição de Dó',
                body: 'Cada dedo da mão direita fica sobre uma tecla: Dó, Ré, Mi, Fá e Sol.',
                highlight: [60, 62, 64, 65, 67],
              },
              { type: 'practice', title: 'Sua vez', songId: 'ex-cinco-dedos-md', hands: 'right' },
              { type: 'play', title: 'No ritmo', songId: 'ex-cinco-dedos-md', hands: 'right', minStars: 1 },
            ],
          },
          {
            id: 'l-cinco-me',
            title: 'Cinco dedos — mão esquerda',
            steps: [
              {
                type: 'intro',
                title: 'A mão esquerda',
                body: 'Na mão esquerda o mindinho (5) fica no Dó e o polegar (1) no Sol.',
                highlight: [48, 50, 52, 53, 55],
              },
              { type: 'practice', title: 'Sua vez', songId: 'ex-cinco-dedos-me', hands: 'left' },
              { type: 'play', title: 'No ritmo', songId: 'ex-cinco-dedos-me', hands: 'left', minStars: 1 },
            ],
          },
          {
            id: 'l-maos-juntas',
            title: 'As duas mãos',
            steps: [
              { type: 'practice', title: 'Só a mão direita', songId: 'ex-maos-juntas', hands: 'right' },
              { type: 'practice', title: 'Só a mão esquerda', songId: 'ex-maos-juntas', hands: 'left' },
              { type: 'practice', title: 'Juntas, devagar', songId: 'ex-maos-juntas', hands: 'both', tempoFactor: 0.75 },
              { type: 'play', title: 'No ritmo', songId: 'ex-maos-juntas', hands: 'both', minStars: 1 },
            ],
          },
        ],
      },
      {
        id: 'u3',
        title: 'Acordes e escalas',
        lessons: [
          {
            id: 'l-acordes',
            title: 'Acordes de Dó, Fá e Sol',
            steps: [
              {
                type: 'intro',
                title: 'Acordes',
                body: 'Um acorde é tocar várias notas juntas. Estes três acordes acompanham muitos hinos em Dó maior.',
                highlight: [48, 52, 55],
              },
              { type: 'practice', title: 'Sua vez', songId: 'ex-acordes-maiores', hands: 'left' },
            ],
          },
          {
            id: 'l-escala',
            title: 'Escala de Dó maior',
            steps: [
              {
                type: 'intro',
                title: 'Passagem do polegar',
                body: 'Depois do Mi, passe o polegar por baixo da mão para tocar o Fá e continue até o Dó de cima.',
              },
              { type: 'practice', title: 'Sua vez', songId: 'ex-escala-do', hands: 'right' },
              { type: 'play', title: 'No ritmo', songId: 'ex-escala-do', hands: 'right', minStars: 2 },
            ],
          },
        ],
      },
      {
        id: 'u4',
        title: 'Primeiras músicas',
        lessons: [
          {
            id: 'l-alegria',
            title: 'Hino à Alegria',
            steps: [
              { type: 'watch', title: 'Ouça a música', songId: 'pc-alegria', hands: 'both' },
              { type: 'practice', title: 'Frase 1', songId: 'pc-alegria', hands: 'right', sectionId: 'a1' },
              { type: 'practice', title: 'Frase 2', songId: 'pc-alegria', hands: 'right', sectionId: 'a2' },
              { type: 'play', title: 'Mão direita no ritmo', songId: 'pc-alegria', hands: 'right', minStars: 1 },
              { type: 'practice', title: 'Duas mãos', songId: 'pc-alegria', hands: 'both', tempoFactor: 0.75 },
            ],
          },
          {
            id: 'l-hino-exemplo',
            title: 'Primeiro hino',
            steps: [
              { type: 'watch', title: 'Ouça o hino', songId: 'hino-exemplo', hands: 'both' },
              { type: 'practice', title: '1ª linha — mão direita', songId: 'hino-exemplo', hands: 'right', sectionId: 'l1' },
              { type: 'practice', title: '1ª linha — mão esquerda', songId: 'hino-exemplo', hands: 'left', sectionId: 'l1' },
              { type: 'practice', title: 'Hino completo', songId: 'hino-exemplo', hands: 'both', tempoFactor: 0.75 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'orgao-basico',
    title: 'Órgão para o culto',
    description: 'Técnica de legato e postura para tocar hinos no órgão.',
    instrument: 'organ',
    units: [
      {
        id: 'o1',
        title: 'Técnica de órgão',
        lessons: [
          {
            id: 'l-legato',
            title: 'Toque ligado (legato)',
            steps: [
              {
                type: 'intro',
                title: 'O som do órgão não diminui',
                body: 'No órgão o som dura enquanto a tecla estiver abaixada. Solte uma tecla só no instante em que a próxima for tocada, para o som ficar ligado.',
              },
              { type: 'watch', title: 'Veja e ouça', songId: 'ex-legato-orgao', hands: 'both' },
              { type: 'practice', title: 'Sua vez', songId: 'ex-legato-orgao', hands: 'both' },
            ],
          },
        ],
      },
    ],
  },
];

/** O MOR (método oficial de órgão) vem primeiro; depois os cursos introdutórios do app. */
export const courses: Course[] = [...morCourses, ...baseCourses];
