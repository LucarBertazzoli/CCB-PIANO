import type { AnyLessonStep, Course, ExternalSource, Unit } from '../types';

/**
 * MOR — Método de Estudos para Órgão Eletrônico (CCB).
 * Fonte oficial: https://congregacaocristanobrasil.org.br/musica/mor
 *
 * A estrutura (volumes e unidades) espelha o método oficial. Os materiais
 * (planos de aula, videoaulas, áudios) são abertos a partir dos links oficiais;
 * o app acrescenta a camada interativa: quizzes, teclado interativo e prática
 * com notas caindo. As partituras dos Estudos/Hinos serão transcritas para o
 * formato do app somente com autorização (veja docs/PLANO_MOR.md).
 */

export const MOR_URL = 'https://congregacaocristanobrasil.org.br/musica/mor';

const yt = (list: string) => `https://www.youtube.com/playlist?list=${list}`;
const drive = (id: string) => `https://drive.google.com/drive/folders/${id}`;

interface VolumeLinks {
  treinamento: string; // id do vídeo no YouTube
  videosExplicativos: string;
  audioEstudos: string;
  planosDeAula: string;
  videoaulas: string;
  atividadesInterativas: string;
  atividadesAvaliativas: string;
}

const VOL1: VolumeLinks = {
  treinamento: 'nj3aq0zGvqY',
  videosExplicativos: yt('PLiWowsZD_EnGof3218ZmS2v4MKTKhZ4tp'),
  audioEstudos: yt('PLiWowsZD_EnFzcbub1DKyeatgQkcGAwpc'),
  planosDeAula: drive('1U2COMrGF5WKK4I9THkv8S7CqvedurZiG'),
  videoaulas: yt('PL-FsRzg4fBXm0MQXh0YOlhqLBFXTUSWqs'),
  atividadesInterativas: drive('1Gu4p_DLZFWeODOHAhLAaPdIp3UqbzaPA'),
  atividadesAvaliativas: drive('15B1qgHd-PO40JElyogr3S9u0qWUWJGUc'),
};

const VOL2: VolumeLinks = {
  treinamento: 'tv_lJQcRa28',
  videosExplicativos: yt('PLiWowsZD_EnEpNFp48t8sZUl1CWcAI3Yf'),
  audioEstudos: yt('PLiWowsZD_EnGVygjUIDbB2MwiiTAIbgui'),
  planosDeAula: drive('1mMJtkmHrK2S0aIwmtSPEL0-f_BUIRu2T'),
  videoaulas: yt('PL-FsRzg4fBXnjMPxGhwp600byIrt37Pxh'),
  atividadesInterativas: drive('1U7KckaVbRU1dZVj5vLh7QzARH2nabpvY'),
  atividadesAvaliativas: drive('101Lv6Sho25bGSNkr6b_SUG6B47ImqnK_'),
};

const VOL3: VolumeLinks = {
  treinamento: '-DQV5nuST8I',
  videosExplicativos: yt('PLiWowsZD_EnFiKiuZ2ZLbglIeke0mGPkQ'),
  audioEstudos: yt('PLiWowsZD_EnFIq_8Z4b6FV1ZMrqJyRXYR'),
  planosDeAula: drive('1vQEDdJ-8UXWzQgFArJcnc5Ybnzi3nthY'),
  videoaulas: yt('PL-FsRzg4fBXmaFDv7zLLz4R8EZnT86_-j'),
  atividadesInterativas: drive('1cVN0wMX6-9UKxl7WboluBax1NwbGb6hZ'),
  atividadesAvaliativas: drive('18HZQvlJchQzbGtFhdG2xdsMc5-Af5WtR'),
};

const VOL4: VolumeLinks = {
  treinamento: 'qwXtDKC_XcM',
  videosExplicativos: yt('PLiWowsZD_EnHqmbxMNi_QUmD579gE0PTD'),
  audioEstudos: yt('PLiWowsZD_EnGnKZNM3m01Xo8aYvrzE2qI'),
  planosDeAula: drive('1bcfbbm5CIY8XkODETUJaBvxH3gFFCjOG'),
  videoaulas: yt('PL-FsRzg4fBXmESllXLbvjdCh9ab9NBapI'),
  atividadesInterativas: drive('1YWt72C93VPHnUL8OYWZHkZlsClquEnxu'),
  atividadesAvaliativas: drive('1_gP1_YtWs2n_ITlKEv8Yy7QZUN2OcTlu'),
};

function volumeResources(v: VolumeLinks): ExternalSource[] {
  return [
    { label: 'Treinamento', url: `https://www.youtube.com/watch?v=${v.treinamento}` },
    { label: 'Vídeos explicativos', url: v.videosExplicativos },
    { label: 'Áudio dos estudos', url: v.audioEstudos },
    { label: 'Planos de aula', url: v.planosDeAula },
    { label: 'Videoaulas', url: v.videoaulas },
    { label: 'Atividades interativas', url: v.atividadesInterativas },
    { label: 'Atividades avaliativas', url: v.atividadesAvaliativas },
  ];
}

/**
 * Monta uma unidade do MOR: sempre começa pelo material oficial (plano de aula
 * e videoaula) e depois os passos interativos do app, quando existirem.
 */
function morUnit(
  vol: number,
  links: VolumeLinks,
  n: number,
  title: string,
  interactive: AnyLessonStep[] = [],
): Unit {
  const steps: AnyLessonStep[] = [
    {
      type: 'material',
      title: 'Plano de aula',
      url: links.planosDeAula,
      description: `Abra o PDF “Unidade ${n}” na pasta oficial do Volume ${vol}.`,
    },
    {
      type: 'video',
      title: 'Videoaula',
      url: links.videoaulas,
      description: `Assista à videoaula da Unidade ${n} na playlist oficial.`,
    },
    ...interactive,
  ];
  return {
    id: `mor-v${vol}-u${n}`,
    title: `Unidade ${n}`,
    description: title,
    lessons: [
      {
        id: `mor-v${vol}-u${n}`,
        title,
        steps,
        status: interactive.length ? 'ready' : 'draft',
        sources: [{ label: `MOR Volume ${vol} — Unidade ${n}`, url: MOR_URL }],
      },
    ],
  };
}

// ---------------------------------------------------------------- interativos
// Perguntas e exercícios originais do app, sobre teoria musical geral, para
// fixar o conteúdo de cada unidade.

const U1_ORGAO: AnyLessonStep[] = [
  {
    type: 'quiz',
    title: 'Conhecendo o órgão',
    questions: [
      {
        prompt: 'Como se chamam os teclados das mãos no órgão?',
        options: ['Manuais', 'Pedaleiras', 'Registros'],
        answer: 0,
        explanation: 'Os teclados tocados com as mãos são os manuais; a pedaleira é tocada com os pés.',
      },
      {
        prompt: 'O que acontece com o som do órgão enquanto a tecla fica abaixada?',
        options: ['Diminui até sumir, como no piano', 'Continua com o mesmo volume', 'Fica mais forte'],
        answer: 1,
        explanation: 'No órgão o som se mantém enquanto a tecla estiver abaixada.',
      },
    ],
  },
];

const U2_SOM: AnyLessonStep[] = [
  {
    type: 'quiz',
    title: 'Propriedades do som',
    questions: [
      {
        prompt: 'Qual propriedade diferencia um som grave de um agudo?',
        options: ['Altura', 'Intensidade', 'Timbre', 'Duração'],
        answer: 0,
      },
      {
        prompt: 'Qual propriedade diferencia um som forte de um fraco?',
        options: ['Altura', 'Intensidade', 'Timbre', 'Duração'],
        answer: 1,
      },
      {
        prompt: 'O que nos permite reconhecer que um som vem do órgão e não do violino?',
        options: ['Altura', 'Intensidade', 'Timbre', 'Duração'],
        answer: 2,
      },
    ],
  },
];

const U3_POSTURA: AnyLessonStep[] = [
  {
    type: 'intro',
    title: 'Postura correta',
    body: 'Sente-se no centro do banco, com a coluna ereta e os ombros relaxados. Os antebraços ficam na altura do teclado e os dedos levemente arredondados.',
  },
  {
    type: 'quiz',
    title: 'Revisão',
    questions: [
      {
        prompt: 'Como devem ficar os dedos sobre as teclas?',
        options: ['Esticados', 'Levemente arredondados', 'Dobrados para dentro'],
        answer: 1,
      },
    ],
  },
];

const U4_NOTAS: AnyLessonStep[] = [
  {
    type: 'intro',
    title: 'As sete notas',
    body: 'As notas musicais são Dó, Ré, Mi, Fá, Sol, Lá e Si. Depois do Si, a sequência recomeça no próximo Dó.',
    highlight: [60, 62, 64, 65, 67, 69, 71],
  },
  { type: 'find-key', title: 'Encontre as notas', notes: [60, 64, 67, 62, 65, 69, 71], show: 'name' },
];

const U5_DEDILHADO: AnyLessonStep[] = [
  {
    type: 'intro',
    title: 'Numeração dos dedos',
    body: 'Os dedos são numerados de 1 (polegar) a 5 (mínimo) nas duas mãos. O número aparece dentro das notas que caem.',
  },
  { type: 'practice', title: 'Articulação — mão direita', songId: 'ex-cinco-dedos-md', hands: 'right' },
  { type: 'practice', title: 'Articulação — mão esquerda', songId: 'ex-cinco-dedos-me', hands: 'left' },
];

const U6_PAUTA: AnyLessonStep[] = [
  {
    type: 'quiz',
    title: 'Pauta',
    questions: [
      { prompt: 'Quantas linhas tem a pauta (pentagrama)?', options: ['4', '5', '6'], answer: 1 },
      { prompt: 'Quantos espaços há entre as linhas da pauta?', options: ['4', '5', '6'], answer: 0 },
      {
        prompt: 'Como se chamam as linhas acrescentadas acima ou abaixo da pauta?',
        options: ['Linhas suplementares', 'Barras de compasso', 'Ligaduras'],
        answer: 0,
      },
    ],
  },
];

const U7_CLAVES: AnyLessonStep[] = [
  {
    type: 'intro',
    title: 'Clave de Sol e clave de Fá',
    body: 'A clave de Sol (usada pela mão direita) fixa o Sol na 2ª linha. A clave de Fá (mão esquerda) fixa o Fá na 4ª linha.',
  },
  { type: 'find-key', title: 'Leia na clave de Sol', notes: [67, 64, 71, 62, 65, 69, 72], show: 'staff' },
  { type: 'find-key', title: 'Leia na clave de Fá', notes: [53, 48, 57, 55, 50, 52], show: 'staff' },
];

const U8_FIGURAS: AnyLessonStep[] = [
  {
    type: 'quiz',
    title: 'Figuras musicais',
    questions: [
      { prompt: 'Quantas semínimas cabem numa mínima?', options: ['1', '2', '4'], answer: 1 },
      { prompt: 'Quantas semínimas cabem numa semibreve?', options: ['2', '3', '4'], answer: 2 },
      { prompt: 'Qual figura vale metade da semínima?', options: ['Colcheia', 'Mínima', 'Semibreve'], answer: 0 },
    ],
  },
];

const U9_RITMO: AnyLessonStep[] = [
  {
    type: 'intro',
    title: 'Pulsação e metrônomo',
    body: 'A pulsação é a batida regular da música. O metrônomo marca essa batida; ative-o em Ajustes para praticar no tempo.',
  },
  { type: 'play', title: 'Tocar no tempo', songId: 'ex-do-central', hands: 'right', minStars: 1 },
];

const U10_REGISTRACAO: AnyLessonStep[] = [
  {
    type: 'quiz',
    title: 'Registração',
    questions: [
      {
        prompt: 'O que são os registros do órgão?',
        options: ['Os botões que escolhem o timbre', 'As teclas pretas', 'Os pedais de volume'],
        answer: 0,
      },
    ],
  },
];

const U11_ESTUDOS: AnyLessonStep[] = [
  { type: 'watch', title: 'Aquecimento: veja e ouça', songId: 'ex-do-re-mi', hands: 'right' },
  { type: 'practice', title: 'Aquecimento: sua vez', songId: 'ex-do-re-mi', hands: 'right' },
];

const U22_ESCALAS: AnyLessonStep[] = [
  { type: 'practice', title: 'Escala de Dó maior', songId: 'ex-escala-do', hands: 'right' },
  { type: 'practice', title: 'Acordes', songId: 'ex-acordes-maiores', hands: 'left' },
];

// --------------------------------------------------------------------- volumes

export const morVolume1: Course = {
  id: 'mor-v1',
  title: 'MOR — Volume 1',
  description: 'Método de Estudos para Órgão Eletrônico — fundamentos, primeiros estudos e hinos.',
  instrument: 'organ',
  resources: volumeResources(VOL1),
  units: [
    morUnit(1, VOL1, 1, 'Apresentação do órgão eletrônico', U1_ORGAO),
    morUnit(1, VOL1, 2, 'O som e suas propriedades', U2_SOM),
    morUnit(1, VOL1, 3, 'Postura e posição correta ao tocar', U3_POSTURA),
    morUnit(1, VOL1, 4, 'Notas musicais', U4_NOTAS),
    morUnit(1, VOL1, 5, 'Articulação dos dedos e dedilhado', U5_DEDILHADO),
    morUnit(1, VOL1, 6, 'Pauta ou pentagrama e linhas suplementares', U6_PAUTA),
    morUnit(1, VOL1, 7, 'Claves', U7_CLAVES),
    morUnit(1, VOL1, 8, 'Figuras musicais', U8_FIGURAS),
    morUnit(1, VOL1, 9, 'Ritmo, tempo, pulsação e metrônomo', U9_RITMO),
    morUnit(1, VOL1, 10, 'Registração', U10_REGISTRACAO),
    morUnit(1, VOL1, 11, 'Estudos 1 ao 10', U11_ESTUDOS),
    morUnit(1, VOL1, 12, 'Compassos, fórmula de compasso simples e pausas'),
    morUnit(1, VOL1, 13, 'Estudos 11 ao 15'),
    morUnit(1, VOL1, 14, 'Ligadura de valor e Estudos 16 e 17'),
    morUnit(1, VOL1, 15, 'Ponto de aumento e Estudos 18 ao 22'),
    morUnit(1, VOL1, 16, 'A figura da colcheia e Exercícios 2 ao 5'),
    morUnit(1, VOL1, 17, 'Recursos de dedilhado e Exercícios 6 ao 10'),
    morUnit(1, VOL1, 18, 'Sinais de respiração, Estudos 23 e 24 e articulação'),
    morUnit(1, VOL1, 19, 'Sinais de repetição, mudança de posição, Estudos 25 ao 27'),
    morUnit(1, VOL1, 20, 'Deslocamento, Exercício 15 e Estudo 28'),
    morUnit(1, VOL1, 21, 'Tom e semitom, sinais de alteração e Estudo 29'),
    morUnit(1, VOL1, 22, 'Escalas, Exercícios 16 ao 18, acordes e Estudo 30', U22_ESCALAS),
    morUnit(1, VOL1, 23, 'Escala de Sol maior, Exercícios 19 e 20, Estudos 31 ao 33, staccato'),
    morUnit(1, VOL1, 24, 'Escala de Fá maior, Exercícios 21 e 22, fermata, Estudos 34 ao 36'),
    morUnit(1, VOL1, 25, 'Pedaleira, sistema, Estudos 37 ao 40'),
    morUnit(1, VOL1, 26, 'Hinos 158, 131 e 468'),
  ],
};

const V2_TITLES = [
  'Figuras musicais, quadro comparativo e fórmula de compasso simples',
  'Tonalidade de Dó maior, escala, arpejo e Exercícios 1 a 3',
  'Grupos rítmicos, Exercícios 4 a 6 e pedaleira 1 a 9',
  'Acento métrico e ritmos iniciais',
  'Estudos 1 a 3',
  'Andamentos e modificações de andamento',
  'Ligaduras, Estudo 4 e exercícios de pedaleira',
  'Contratempo e Estudo 5',
  'Compasso composto e Estudo 6',
  'Exercício 7 e Estudo 7',
  'Estudo dos hinos',
  'Tonalidade de Fá maior, Exercício 8 e Estudos 8 e 9',
  'Estudo 10, Hino 357 e Estudo 11',
  'Respiração sobre passagens melódicas e estudo dos hinos',
  'Síncopa, Exercício 9, pedaleira e hinos em Fá maior',
  'Tonalidade de Sol maior, Exercício 10, pedaleira e Estudo 12',
  'Dinâmica, Estudos 13 a 15',
  'Estudo dos hinos em Sol maior',
  'Tonalidade de Si♭ maior, escala e arpejo, Exercícios 11 e 12, pedaleira',
  'Estudos 16 e 17',
  'Inversão de vozes e hinos em Si♭ maior',
  'Tonalidade de Ré maior, escala e arpejo, Exercício 13, pedaleira, Estudos 18 e 19',
  'Estudo dos hinos em Ré maior',
  'Tonalidade de Mi♭ maior, escala e arpejo, Exercício 14, pedaleira, Estudos 20 a 22',
  'Estudo dos hinos em Mi♭ maior',
  'Tonalidade de Lá♭ maior, escala e arpejo, Exercício 15, pedaleira, Estudo 23',
  'Estudo dos hinos em Lá♭ maior',
  'Tonalidade de Ré♭ maior, Exercício 16, pedaleira, Estudo 24 e hinos',
  'Novas pulsações, Exercício 17, pedaleira e Estudo 25',
  'Estudo dos hinos',
  'Quiálteras, Exercício 18 e estudo dos hinos',
  'Linha de oitava, Exercícios 19 e 20, Estudos 26 e 27 e hinos',
  'Estudo 28, pedaleira, Estudos 29 e 30',
  'Estudo dos hinos',
  'Escala cromática, tonalidades maiores, arpejos, acordes, introduções e meia-hora',
];

export const morVolume2: Course = {
  id: 'mor-v2',
  title: 'MOR — Volume 2',
  description: 'Tonalidades, ritmos, pedaleira e estudo dos hinos.',
  instrument: 'organ',
  resources: volumeResources(VOL2),
  units: V2_TITLES.map((t, i) => morUnit(2, VOL2, i + 1, t)),
};

export const morVolume3: Course = {
  id: 'mor-v3',
  title: 'MOR — Volume 3',
  description: 'Em desenvolvimento pela CCB.',
  instrument: 'organ',
  resources: volumeResources(VOL3),
  comingSoon: true,
  units: [],
};

export const morVolume4: Course = {
  id: 'mor-v4',
  title: 'MOR — Volume 4',
  description: 'Em desenvolvimento pela CCB.',
  instrument: 'organ',
  resources: volumeResources(VOL4),
  comingSoon: true,
  units: [],
};

export const morCourses: Course[] = [morVolume1, morVolume2, morVolume3, morVolume4];
