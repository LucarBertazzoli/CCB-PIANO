import type { AnyLessonStep, Course, ListenRound, ListenSound, Unit } from '../types';

/**
 * Trilha de aprendizagem do app, na ordem do MOR — Método de Estudos para
 * Órgão Eletrônico (Volume 1), adaptada para o teclado/piano e para um
 * formato interativo e gamificado, como no Simply Piano.
 *
 * Cada unidade do método segue o caminho "ouvir → entender → localizar no
 * teclado → ler na pauta → tocar". Aqui isso vira lições curtas com:
 *   intro (explicação) • listen (ouvir e responder) • quiz • find-key (achar a
 *   nota no teclado/pauta) • rhythm (ler e tocar o ritmo) • watch/practice/play
 *   (tocar com notas caindo ou partitura).
 *
 * Os textos e atividades são próprios do app, escritos a partir dos objetivos
 * de cada unidade. Padrão de oitavas da CCB: Dó central = Dó3.
 */

// ------------------------------------------------------------------ helpers

const C3 = 60; // Dó3 (Dó central)
const t = (midi: number | number[], beats = 1, extra: Partial<ListenSound> = {}): ListenSound => ({
  midi,
  beats,
  ...extra,
});

function round(
  question: string,
  sounds: ListenSound[],
  options: string[],
  answer: number,
  explanation?: string,
  extra: Partial<ListenRound> = {},
): ListenRound {
  return { question, sounds, options, answer, explanation, ...extra };
}

const GRAVE_AGUDO = ['Grave', 'Agudo'];
const SUBIU_DESCEU = ['Subiu ↗', 'Desceu ↘', 'Ficou igual →'];
const CURTO_LONGO = ['Curto', 'Longo'];
const FORTE_FRACO = ['Forte', 'Fraco'];

// ------------------------------------------------------------------ unidades

const u1: Unit = {
  id: 'u1',
  title: 'Conhecendo o teclado',
  description: 'Unidade 1 do MOR • o instrumento',
  lessons: [
    {
      id: 't1-teclado',
      title: 'O teclado',
      icon: '🎹',
      steps: [
        {
          type: 'intro',
          title: 'Teclas brancas e pretas',
          body: 'O teclado tem teclas brancas e pretas. As pretas aparecem em grupos de 2 e de 3, e esses grupos se repetem por todo o teclado. Eles são o nosso mapa!',
          illustration: { keys: [49, 51, 54, 56, 58, 61, 63, 66, 68, 70] },
        },
        {
          type: 'intro',
          title: 'Esquerda grave, direita aguda',
          body: 'Quanto mais para a esquerda, mais grave (grosso) é o som. Quanto mais para a direita, mais agudo (fino). No órgão há dois teclados (manuais) e a pedaleira; no piano, um só teclado.',
          illustration: { keys: [36, 84] },
        },
        {
          type: 'listen',
          title: 'Ouça o teclado',
          rounds: [
            round('Este som veio da parte grave ou aguda do teclado?', [t(36, 2)], GRAVE_AGUDO, 0),
            round('E este?', [t(84, 2)], GRAVE_AGUDO, 1),
            round('E este?', [t(40, 2)], GRAVE_AGUDO, 0),
          ],
        },
        {
          type: 'quiz',
          title: 'Revisão',
          questions: [
            {
              prompt: 'Em que grupos aparecem as teclas pretas?',
              options: ['De 2 e de 3', 'De 4 e de 5', 'Sempre sozinhas'],
              answer: 0,
            },
            {
              prompt: 'No órgão, como se chamam os teclados tocados com as mãos?',
              options: ['Manuais', 'Pedaleira', 'Registros'],
              answer: 0,
              explanation: 'O teclado de cima é o superior (Upper Manual) e o de baixo, o inferior (Lower Manual). A pedaleira é tocada com os pés.',
            },
          ],
        },
      ],
    },
  ],
};

const u2: Unit = {
  id: 'u2',
  title: 'O som e suas propriedades',
  description: 'Unidade 2 do MOR • altura, duração, intensidade e timbre',
  lessons: [
    {
      id: 't2-altura',
      title: 'Grave e agudo',
      icon: '👂',
      steps: [
        {
          type: 'intro',
          title: 'Primeiro, ouvir',
          body: 'Antes de ler música, vamos treinar o ouvido. A ALTURA é o que diferencia um som grave de um som agudo.',
        },
        {
          type: 'listen',
          title: 'Grave ou agudo?',
          rounds: [
            round('Os dois sons foram iguais? O SEGUNDO foi mais grave ou mais agudo?', [t(C3), t(C3 + 12)], GRAVE_AGUDO, 1),
            round('E agora, o segundo som foi…', [t(C3 + 7), t(C3 - 5)], GRAVE_AGUDO, 0),
            round('O segundo som foi…', [t(48), t(55)], GRAVE_AGUDO, 1),
            round('O segundo som foi…', [t(76), t(64)], GRAVE_AGUDO, 0),
            round('Esta é mais difícil! O segundo som foi…', [t(C3), t(C3 + 2)], GRAVE_AGUDO, 1),
          ],
        },
      ],
    },
    {
      id: 't2-duracao',
      title: 'Curto e longo',
      icon: '⏱',
      steps: [
        {
          type: 'intro',
          title: 'Duração',
          body: 'A DURAÇÃO diz quanto tempo o som dura: ele pode ser curto ou longo.',
        },
        {
          type: 'listen',
          title: 'Curto ou longo?',
          rounds: [
            round('Este som foi curto ou longo?', [t(C3, 0.5)], CURTO_LONGO, 0, undefined, { tempo: 80 }),
            round('E este?', [t(C3, 4)], CURTO_LONGO, 1, undefined, { tempo: 80 }),
            round('Quantos sons longos você ouviu?', [t(C3, 3), t(C3, 0.5), t(C3, 0.5), t(C3, 3)], ['1', '2', '3'], 1, undefined, { tempo: 90 }),
            round('Como foi a sequência?', [t(C3 + 4, 0.5), t(C3 + 4, 0.5), t(C3 + 4, 3)], ['Curto, curto, longo', 'Longo, curto, curto', 'Curto, longo, curto'], 0, undefined, { tempo: 90 }),
          ],
        },
      ],
    },
    {
      id: 't2-intensidade-timbre',
      title: 'Forte, fraco e timbre',
      icon: '🔊',
      steps: [
        {
          type: 'intro',
          title: 'Intensidade e timbre',
          body: 'A INTENSIDADE é o volume: forte ou fraco (no órgão, controlado pelo pedal de expressão). O TIMBRE é a “cor” do som, que nos faz reconhecer qual instrumento está tocando.',
        },
        {
          type: 'listen',
          title: 'Forte ou fraco?',
          rounds: [
            round('Este som foi forte ou fraco?', [t([60, 64, 67], 2, { velocity: 1 })], FORTE_FRACO, 0),
            round('E este?', [t([60, 64, 67], 2, { velocity: 0.12 })], FORTE_FRACO, 1),
            round('O segundo som foi…', [t(67, 1.5, { velocity: 0.15 }), t(67, 1.5, { velocity: 1 })], ['Mais forte', 'Mais fraco'], 0),
          ],
        },
        {
          type: 'listen',
          title: 'Qual instrumento?',
          rounds: [
            round('Qual timbre você ouviu?', [t([60, 64, 67], 3, { instrument: 'organ' })], ['Piano', 'Órgão'], 1, 'O som do órgão se mantém igual enquanto a tecla está abaixada.'),
            round('E agora?', [t([60, 64, 67], 3, { instrument: 'piano' })], ['Piano', 'Órgão'], 0, 'O som do piano começa forte e vai diminuindo.'),
          ],
        },
        {
          type: 'quiz',
          title: 'As quatro propriedades',
          questions: [
            { prompt: 'Grave, médio ou agudo é uma questão de…', options: ['Altura', 'Duração', 'Intensidade', 'Timbre'], answer: 0 },
            { prompt: 'Curto ou longo é uma questão de…', options: ['Altura', 'Duração', 'Intensidade', 'Timbre'], answer: 1 },
            { prompt: 'Forte ou fraco é uma questão de…', options: ['Altura', 'Duração', 'Intensidade', 'Timbre'], answer: 2 },
            { prompt: 'Reconhecer o instrumento é uma questão de…', options: ['Altura', 'Duração', 'Intensidade', 'Timbre'], answer: 3 },
          ],
        },
      ],
    },
  ],
};

const u3: Unit = {
  id: 'u3',
  title: 'Postura e posição das mãos',
  description: 'Unidade 3 do MOR',
  lessons: [
    {
      id: 't3-postura',
      title: 'Sentar e posicionar as mãos',
      icon: '🧘',
      steps: [
        {
          type: 'intro',
          title: 'Postura',
          body: 'Sente-se no centro do banco, a uma distância média do instrumento. Costas eretas, ombros relaxados e cotovelos junto ao corpo. No órgão, o pé direito fica no pedal de expressão e o esquerdo apoiado.',
        },
        {
          type: 'intro',
          title: 'Mãos arredondadas',
          body: 'Deixe os braços caírem soltos ao lado do corpo: essa é a posição natural da mão. Leve-a ao teclado assim, com os dedos arredondados, tocando com a ponta dos dedos e o punho alinhado com o antebraço.',
        },
        {
          type: 'quiz',
          title: 'Certo ou errado?',
          questions: [
            { prompt: '“Tocar com os dedos esticados.”', options: ['Certo', 'Errado'], answer: 1, explanation: 'Os dedos ficam arredondados, tocando com a ponta.' },
            { prompt: '“Manter os ombros relaxados.”', options: ['Certo', 'Errado'], answer: 0 },
            { prompt: '“Deixar o punho bem baixo, abaixo do teclado.”', options: ['Certo', 'Errado'], answer: 1, explanation: 'O punho fica alinhado com o antebraço, nem alto nem baixo.' },
            { prompt: '“Sentar no centro do banco.”', options: ['Certo', 'Errado'], answer: 0 },
            { prompt: '“Abrir bem os cotovelos para longe do corpo.”', options: ['Certo', 'Errado'], answer: 1 },
          ],
        },
      ],
    },
  ],
};

const u4: Unit = {
  id: 'u4',
  title: 'Notas musicais',
  description: 'Unidade 4 do MOR • nomes, sequência e o Dó',
  lessons: [
    {
      id: 't4-sequencia',
      title: 'Subindo e descendo',
      icon: '↗',
      steps: [
        {
          type: 'intro',
          title: 'As sete notas',
          body: 'As notas são DÓ, RÉ, MI, FÁ, SOL, LÁ e SI. Subindo (ascendente) os sons vão do grave para o agudo; descendo (descendente), do agudo para o grave.',
        },
        {
          type: 'listen',
          title: 'Para onde foi a melodia?',
          rounds: [
            round('A melodia…', [t(60), t(62), t(64), t(65), t(67)], SUBIU_DESCEU, 0),
            round('A melodia…', [t(67), t(65), t(64), t(62), t(60)], SUBIU_DESCEU, 1),
            round('A melodia…', [t(64, 3)], SUBIU_DESCEU, 2, 'Um som só, contínuo: não sobe nem desce.'),
            round('A melodia…', [t(72), t(71), t(69), t(67)], SUBIU_DESCEU, 1),
            round('A melodia…', [t(53), t(55), t(57), t(59), t(60)], SUBIU_DESCEU, 0),
          ],
        },
        {
          type: 'quiz',
          title: 'A sequência das notas',
          questions: [
            { prompt: 'Qual nota vem DEPOIS do Mi?', options: ['Ré', 'Fá', 'Sol'], answer: 1 },
            { prompt: 'Qual nota vem DEPOIS do Si?', options: ['Dó', 'Lá', 'Ré'], answer: 0, explanation: 'Depois do Si, a sequência recomeça no Dó.' },
            { prompt: 'Descendo: qual nota vem depois do Sol?', options: ['Lá', 'Fá', 'Mi'], answer: 1 },
            { prompt: 'Descendo: qual nota vem depois do Dó?', options: ['Ré', 'Si', 'Lá'], answer: 1 },
          ],
        },
      ],
    },
    {
      id: 't4-do',
      title: 'Encontrando o Dó',
      icon: '🔍',
      steps: [
        {
          type: 'intro',
          title: 'O Dó mora antes das duas pretas',
          body: 'A tecla branca logo à esquerda do grupo de DUAS teclas pretas é sempre um Dó. O Dó do meio do teclado é o Dó central, que no hinário chamamos de Dó3.',
          illustration: { keys: [48, 60, 72] },
        },
        { type: 'find-key', title: 'Toque um Dó', notes: [60, 60, 60], show: 'name', anyOctave: true },
        {
          type: 'intro',
          title: 'As notas brancas',
          body: 'A partir do Dó, as teclas brancas seguem a ordem: Dó, Ré, Mi, Fá, Sol, Lá, Si… e o próximo Dó.',
          illustration: { keys: [60, 62, 64, 65, 67, 69, 71] },
        },
        { type: 'find-key', title: 'Encontre as notas', notes: [62, 64, 67, 65, 69, 71, 60], show: 'name' },
      ],
    },
    {
      id: 't4-tocar',
      title: 'Minha primeira melodia',
      icon: '🎵',
      steps: [
        { type: 'watch', title: 'Veja e ouça', songId: 'ex-do-re-mi', hands: 'right' },
        { type: 'practice', title: 'Sua vez', songId: 'ex-do-re-mi', hands: 'right' },
        { type: 'play', title: 'No ritmo', songId: 'ex-do-re-mi', hands: 'right', minStars: 1 },
      ],
    },
  ],
};

const u5: Unit = {
  id: 'u5',
  title: 'Dedilhado e articulação',
  description: 'Unidade 5 do MOR',
  lessons: [
    {
      id: 't5-dedos',
      title: 'Os números dos dedos',
      icon: '✋',
      steps: [
        {
          type: 'intro',
          title: 'Dedilhado',
          body: 'Nas duas mãos, contamos de dentro para fora: polegar = 1, indicador = 2, médio = 3, anelar = 4 e mínimo = 5. O número aparece dentro das notas que caem e acima/abaixo das notas na partitura.',
        },
        {
          type: 'quiz',
          title: 'Qual é o dedo?',
          questions: [
            { prompt: 'Qual número é o polegar?', options: ['1', '3', '5'], answer: 0 },
            { prompt: 'Qual número é o dedo médio?', options: ['2', '3', '4'], answer: 1 },
            { prompt: 'Qual número é o mínimo?', options: ['1', '4', '5'], answer: 2 },
            { prompt: 'Na mão ESQUERDA, o polegar também é…', options: ['1', '5'], answer: 0, explanation: 'Sempre de dentro para fora: o polegar é 1 nas duas mãos.' },
          ],
        },
      ],
    },
    {
      id: 't5-articulacao',
      title: 'Toque ligado',
      icon: '🔗',
      steps: [
        {
          type: 'intro',
          title: 'Articulação ligada',
          body: 'É como caminhar: um pé só sai do chão quando o outro já pisou. Solte uma tecla só no instante em que a próxima for abaixada. Só o dedo que toca se movimenta; os outros ficam apoiados nas teclas.',
        },
        { type: 'practice', title: 'Cinco dedos — mão direita', songId: 'ex-cinco-dedos-md', hands: 'right' },
        { type: 'practice', title: 'Cinco dedos — mão esquerda', songId: 'ex-cinco-dedos-me', hands: 'left' },
        { type: 'play', title: 'Mão direita no ritmo', songId: 'ex-cinco-dedos-md', hands: 'right', minStars: 1 },
      ],
    },
  ],
};

const u6: Unit = {
  id: 'u6',
  title: 'A pauta',
  description: 'Unidade 6 do MOR • pentagrama e linhas suplementares',
  lessons: [
    {
      id: 't6-pauta',
      title: 'Linhas e espaços',
      icon: '𝄚',
      steps: [
        {
          type: 'intro',
          title: 'O pentagrama',
          body: 'A música é escrita na pauta (pentagrama): 5 linhas e 4 espaços, contados sempre de baixo para cima. As notas têm forma de elipse e podem ficar nas linhas ou nos espaços.',
          illustration: { staff: [64, 65, 67, 69, 71, 72, 74, 76, 77], clef: 'treble' },
        },
        {
          type: 'quiz',
          title: 'Onde está a nota?',
          questions: [
            { prompt: 'Esta nota está numa linha ou num espaço?', options: ['Linha', 'Espaço'], answer: 0, illustration: { staff: [71], clef: 'treble' } },
            { prompt: 'E esta?', options: ['Linha', 'Espaço'], answer: 1, illustration: { staff: [72], clef: 'treble' } },
            { prompt: 'Em qual linha está esta nota?', options: ['1ª linha', '2ª linha', '3ª linha'], answer: 1, illustration: { staff: [67], clef: 'treble' } },
            { prompt: 'Em qual espaço está esta nota?', options: ['1º espaço', '2º espaço', '4º espaço'], answer: 0, illustration: { staff: [65], clef: 'treble' } },
            { prompt: 'Quantas linhas tem a pauta?', options: ['4', '5', '6'], answer: 1 },
          ],
        },
        {
          type: 'intro',
          title: 'Linhas suplementares',
          body: 'Para notas mais agudas ou mais graves do que cabem na pauta, usamos pequenas linhas acima ou abaixo: as linhas suplementares. O Dó central fica numa delas!',
          illustration: { staff: [60, 81], clef: 'treble' },
        },
        {
          type: 'listen',
          title: 'O som sobe ou desce na pauta?',
          rounds: [
            round('Ouça: a figura que combina é…', [t(60), t(64), t(67)], ['Notas subindo na pauta', 'Notas descendo na pauta'], 0, 'Na pauta, notas mais agudas ficam mais acima.', { illustration: { staff: [60, 64, 67], clef: 'treble' } }),
            round('E agora?', [t(72), t(67), t(64)], ['Notas subindo na pauta', 'Notas descendo na pauta'], 1),
          ],
        },
      ],
    },
  ],
};

const u7: Unit = {
  id: 'u7',
  title: 'As claves',
  description: 'Unidade 7 do MOR • clave de Sol, clave de Fá e o Dó central',
  lessons: [
    {
      id: 't7-sol',
      title: 'Clave de Sol',
      icon: '𝄞',
      steps: [
        {
          type: 'intro',
          title: 'A clave dá nome às notas',
          body: 'A clave de Sol começa na 2ª linha: a nota nessa linha é o SOL. A partir dela, contamos as vizinhas: acima Lá, Si, Dó…; abaixo Fá, Mi, Ré… Na clave de Sol lemos a mão direita.',
          illustration: { staff: [67], clef: 'treble' },
        },
        { type: 'find-key', title: 'Leia e toque (clave de Sol)', notes: [67, 69, 65, 71, 64, 72, 62, 60], show: 'staff', clef: 'treble' },
      ],
    },
    {
      id: 't7-fa',
      title: 'Clave de Fá',
      icon: '𝄢',
      steps: [
        {
          type: 'intro',
          title: 'Clave de Fá',
          body: 'A clave de Fá fica na 4ª linha: a nota nessa linha é o FÁ (Fá2, abaixo do Dó central). Na clave de Fá lemos a mão esquerda.',
          illustration: { staff: [53], clef: 'bass' },
        },
        { type: 'find-key', title: 'Leia e toque (clave de Fá)', notes: [53, 55, 52, 57, 50, 59, 48, 60], show: 'staff', clef: 'bass' },
      ],
    },
    {
      id: 't7-sistema',
      title: 'O Dó central nas duas claves',
      icon: '🎼',
      steps: [
        {
          type: 'intro',
          title: 'Duas pautas unidas',
          body: 'As duas pautas juntas formam um sistema unido pelo Dó central (Dó3), escrito numa linha suplementar: abaixo da clave de Sol ou acima da clave de Fá. É a mesma tecla!',
          illustration: { staff: [60], clef: 'treble', keys: [60] },
        },
        {
          type: 'quiz',
          title: 'Que nota é esta?',
          questions: [
            { prompt: 'Que nota é esta?', options: ['Dó', 'Ré', 'Si'], answer: 0, illustration: { staff: [60], clef: 'bass' } },
            { prompt: 'Que nota é esta?', options: ['Sol', 'Fá', 'Lá'], answer: 0, illustration: { staff: [67], clef: 'treble' } },
            { prompt: 'Que nota é esta?', options: ['Mi', 'Fá', 'Sol'], answer: 1, illustration: { staff: [53], clef: 'bass' } },
            { prompt: 'Que nota é esta?', options: ['Ré', 'Mi', 'Dó'], answer: 1, illustration: { staff: [64], clef: 'treble' } },
            { prompt: 'Que nota é esta?', options: ['Lá', 'Si', 'Sol'], answer: 0, illustration: { staff: [57], clef: 'bass' } },
          ],
        },
        { type: 'find-key', title: 'Leitura misturada', notes: [60, 64, 53, 67, 57, 62, 59, 65], show: 'staff' },
      ],
    },
  ],
};

const u8: Unit = {
  id: 'u8',
  title: 'Figuras musicais',
  description: 'Unidade 8 do MOR • semibreve, mínima e semínima',
  lessons: [
    {
      id: 't8-figuras',
      title: 'A duração escrita',
      icon: '𝅗𝅥',
      steps: [
        {
          type: 'intro',
          title: 'Três figuras',
          body: 'A duração dos sons é escrita com FIGURAS. A semibreve é a mais longa. A mínima dura a metade da semibreve, e a semínima, a metade da mínima.',
          illustration: { figures: ['semibreve', 'minima', 'seminima'] },
        },
        {
          type: 'intro',
          title: 'Como uma melancia',
          body: 'Imagine uma melancia inteira: é a semibreve. Cortada ao meio, cada metade é uma mínima. Em quatro pedaços, cada pedaço é uma semínima. Números: semibreve = 1, mínima = 2, semínima = 4.',
          illustration: { figures: ['semibreve', 'minima', 'minima', 'seminima', 'seminima', 'seminima', 'seminima'] },
        },
        {
          type: 'quiz',
          title: 'Qual figura?',
          questions: [
            { prompt: 'Qual é esta figura?', options: ['Semibreve', 'Mínima', 'Semínima'], answer: 1, illustration: { figures: ['minima'] } },
            { prompt: 'Qual é esta figura?', options: ['Semibreve', 'Mínima', 'Semínima'], answer: 2, illustration: { figures: ['seminima'] } },
            { prompt: 'Qual é esta figura?', options: ['Semibreve', 'Mínima', 'Semínima'], answer: 0, illustration: { figures: ['semibreve'] } },
            { prompt: 'Quantas semínimas cabem numa mínima?', options: ['1', '2', '4'], answer: 1 },
            { prompt: 'Quantas mínimas cabem numa semibreve?', options: ['2', '3', '4'], answer: 0 },
            { prompt: 'Qual o número da semínima?', options: ['1', '2', '4'], answer: 2 },
          ],
        },
        {
          type: 'listen',
          title: 'Qual figura soou?',
          rounds: [
            round('Conte as batidas do metrônomo na sua cabeça: este som durou…', [t(C3 + 7, 4)], ['Semibreve (4)', 'Mínima (2)', 'Semínima (1)'], 0, undefined, { tempo: 72 }),
            round('E este?', [t(C3 + 7, 2)], ['Semibreve (4)', 'Mínima (2)', 'Semínima (1)'], 1, undefined, { tempo: 72 }),
            round('E este?', [t(C3 + 7, 1)], ['Semibreve (4)', 'Mínima (2)', 'Semínima (1)'], 2, undefined, { tempo: 72 }),
          ],
        },
      ],
    },
  ],
};

const u9: Unit = {
  id: 'u9',
  title: 'Ritmo, pulsação e metrônomo',
  description: 'Unidade 9 do MOR',
  lessons: [
    {
      id: 't9-pulso',
      title: 'Siga o metrônomo',
      icon: '🥁',
      steps: [
        {
          type: 'intro',
          title: 'Pulsação',
          body: 'A PULSAÇÃO é a batida regular da música, como o coração. O metrônomo marca essa batida em bpm (batidas por minuto). Vamos tocar uma semínima em cada batida.',
          illustration: { figures: ['seminima', 'seminima', 'seminima', 'seminima'] },
        },
        { type: 'rhythm', title: 'Uma nota por batida', songId: 'rit-pulso', hint: 'Toque qualquer tecla a cada clique do metrônomo.' },
      ],
    },
    {
      id: 't9-ritmo',
      title: 'Lendo o ritmo',
      icon: '🎶',
      steps: [
        {
          type: 'intro',
          title: 'Ritmo',
          body: 'O RITMO é a combinação de sons curtos e longos. A semibreve dura 4 batidas, a mínima 2 e a semínima 1. Toque no início de cada figura e segure até a próxima.',
          illustration: { figures: ['semibreve', 'minima', 'seminima'] },
        },
        { type: 'rhythm', title: 'Três figuras', songId: 'rit-figuras' },
        { type: 'rhythm', title: 'Ritmo misto', songId: 'rit-misto' },
      ],
    },
  ],
};

const u10: Unit = {
  id: 'u10',
  title: 'Timbres',
  description: 'Unidade 10 do MOR • registração',
  lessons: [
    {
      id: 't10-timbres',
      title: 'Registros e timbres',
      icon: '🎛',
      steps: [
        {
          type: 'intro',
          title: 'Registração',
          body: 'No órgão, os registros escolhem o timbre. Os deslizantes (16′, 8′, 4′, 2′) mudam a altura do mesmo som: 16′ é o mais grave, 2′ o mais agudo. Efeitos como vibrato e sustain modificam o som, mas não produzem som sozinhos.',
        },
        {
          type: 'listen',
          title: 'Ouça os timbres',
          rounds: [
            round('Qual timbre?', [t(67, 2, { instrument: 'organ' }), t(72, 2, { instrument: 'organ' })], ['Piano', 'Órgão'], 1),
            round('Qual timbre?', [t(67, 2, { instrument: 'piano' }), t(72, 2, { instrument: 'piano' })], ['Piano', 'Órgão'], 0),
          ],
        },
        {
          type: 'quiz',
          title: 'Revisão',
          questions: [
            { prompt: 'Qual registro deslizante produz o som mais grave?', options: ["16′", "8′", "2′"], answer: 0 },
            { prompt: 'Os efeitos (vibrato, sustain) produzem som sozinhos?', options: ['Sim', 'Não'], answer: 1 },
            { prompt: 'Deve-se estudar usando sustain?', options: ['Sim, sempre', 'Não, para ouvir e tocar com clareza'], answer: 1 },
          ],
        },
      ],
    },
  ],
};

const u11: Unit = {
  id: 'u11',
  title: 'Primeiros estudos',
  description: 'Unidade 11 do MOR • 5 notas a partir do Dó3',
  lessons: [
    {
      id: 't11-md',
      title: 'Mão direita na clave de Sol',
      icon: '🎼',
      steps: [
        {
          type: 'intro',
          title: 'Como estudar',
          body: '1) Ouça o estudo. 2) Leia o ritmo e o nome das notas. 3) Toque devagar, mãos separadas. 4) Depois mãos juntas. 5) Toque inteiro, com firmeza e ligado. Aqui você começa lendo na partitura!',
        },
        { type: 'watch', title: 'Ouça o estudo', songId: 'est-01', hands: 'right', view: 'sheet' },
        { type: 'practice', title: 'Leia e toque', songId: 'est-01', hands: 'right', view: 'sheet' },
        { type: 'practice', title: 'Cinco notas', songId: 'est-03', hands: 'right', view: 'sheet' },
        { type: 'play', title: 'No ritmo', songId: 'est-03', hands: 'right', view: 'sheet', minStars: 1 },
      ],
    },
    {
      id: 't11-me',
      title: 'Mão esquerda na clave de Fá',
      icon: '🎼',
      steps: [
        {
          type: 'intro',
          title: 'Descendo do Dó3',
          body: 'A mão esquerda começa com o polegar no Dó central e desce: Dó, Si, Lá, Sol, Fá (dedos 1, 2, 3, 4, 5).',
          illustration: { staff: [60, 59, 57, 55, 53], clef: 'bass', keys: [60, 59, 57, 55, 53] },
        },
        { type: 'practice', title: 'Leia e toque', songId: 'est-02', hands: 'left', view: 'sheet' },
        { type: 'practice', title: 'Cinco notas', songId: 'est-04', hands: 'left', view: 'sheet' },
        { type: 'play', title: 'No ritmo', songId: 'est-04', hands: 'left', view: 'sheet', minStars: 1 },
      ],
    },
    {
      id: 't11-intercalado',
      title: 'Mãos intercaladas',
      icon: '🤝',
      steps: [
        {
          type: 'intro',
          title: 'Uma mão de cada vez',
          body: 'A melodia passa de uma clave para a outra. Ligue o som entre as mãos, sem levantá-las demais, e deixe a mão que não toca descansando sobre o teclado.',
        },
        { type: 'watch', title: 'Ouça', songId: 'est-05', hands: 'both', view: 'sheet' },
        { type: 'practice', title: 'Leia e toque', songId: 'est-05', hands: 'both', view: 'sheet' },
        { type: 'practice', title: 'Agora com semínimas', songId: 'est-06', hands: 'both', view: 'sheet' },
        { type: 'play', title: 'No ritmo', songId: 'est-06', hands: 'both', view: 'sheet', minStars: 1 },
      ],
    },
  ],
};

const u12: Unit = {
  id: 'u12',
  title: 'Compassos e pausas',
  description: 'Unidade 12 do MOR',
  lessons: [
    {
      id: 't12-compasso',
      title: 'Compassos',
      icon: '📏',
      steps: [
        {
          type: 'intro',
          title: 'Agrupando as batidas',
          body: 'Quando agrupamos as batidas de 2 em 2, de 3 em 3 ou de 4 em 4, formamos COMPASSOS: binário, ternário e quaternário. O primeiro tempo é o mais forte. As barras verticais separam os compassos.',
        },
        {
          type: 'listen',
          title: 'Quantos tempos?',
          rounds: [
            round('Ouça o tempo forte. O compasso é…', [t(76, 1, { velocity: 1 }), t(72, 1, { velocity: 0.3 }), t(76, 1, { velocity: 1 }), t(72, 1, { velocity: 0.3 }), t(76, 1, { velocity: 1 }), t(72, 1, { velocity: 0.3 })], ['Binário (2)', 'Ternário (3)', 'Quaternário (4)'], 0, undefined, { tempo: 100 }),
            round('E este?', [t(76, 1, { velocity: 1 }), t(72, 1, { velocity: 0.3 }), t(72, 1, { velocity: 0.3 }), t(76, 1, { velocity: 1 }), t(72, 1, { velocity: 0.3 }), t(72, 1, { velocity: 0.3 })], ['Binário (2)', 'Ternário (3)', 'Quaternário (4)'], 1, undefined, { tempo: 100 }),
            round('E este?', [t(76, 1, { velocity: 1 }), t(72, 1, { velocity: 0.3 }), t(72, 1, { velocity: 0.3 }), t(72, 1, { velocity: 0.3 }), t(76, 1, { velocity: 1 }), t(72, 1, { velocity: 0.3 }), t(72, 1, { velocity: 0.3 }), t(72, 1, { velocity: 0.3 })], ['Binário (2)', 'Ternário (3)', 'Quaternário (4)'], 2, undefined, { tempo: 100 }),
          ],
        },
        {
          type: 'quiz',
          title: 'Fórmula de compasso',
          questions: [
            { prompt: 'Na fórmula 3/4, o número de cima (3) indica…', options: ['Quantos tempos tem o compasso', 'A figura que vale um tempo'], answer: 0 },
            { prompt: 'Na fórmula 3/4, o número de baixo (4) indica…', options: ['Quantos tempos tem o compasso', 'A figura que vale um tempo (semínima)'], answer: 1 },
            { prompt: 'Um compasso 2/4 é…', options: ['Binário', 'Ternário', 'Quaternário'], answer: 0 },
          ],
        },
        { type: 'rhythm', title: 'Três tempos', songId: 'rit-ternario' },
      ],
    },
    {
      id: 't12-pausas',
      title: 'Pausas',
      icon: '🤫',
      steps: [
        {
          type: 'intro',
          title: 'O silêncio também se escreve',
          body: 'Cada figura de som tem uma PAUSA de mesmo valor. Cuidado: a pausa de semibreve fica pendurada na 4ª linha; a de mínima fica sentada na 3ª linha.',
          illustration: { figures: ['pausa-semibreve', 'pausa-minima', 'pausa-seminima'] },
        },
        {
          type: 'quiz',
          title: 'Qual pausa?',
          questions: [
            { prompt: 'Qual é esta pausa?', options: ['De semibreve', 'De mínima', 'De semínima'], answer: 0, illustration: { figures: ['pausa-semibreve'] } },
            { prompt: 'Qual é esta pausa?', options: ['De semibreve', 'De mínima', 'De semínima'], answer: 1, illustration: { figures: ['pausa-minima'] } },
            { prompt: 'Qual é esta pausa?', options: ['De semibreve', 'De mínima', 'De semínima'], answer: 2, illustration: { figures: ['pausa-seminima'] } },
          ],
        },
        { type: 'rhythm', title: 'Som e silêncio', songId: 'rit-pausas', hint: 'Toque nas figuras e fique em silêncio nas pausas.' },
      ],
    },
  ],
};

const u13: Unit = {
  id: 'u13',
  title: 'Mãos juntas',
  description: 'Unidade 13 do MOR • mão esquerda no Dó2',
  lessons: [
    {
      id: 't13-posicao',
      title: 'Nova posição da mão esquerda',
      icon: '👐',
      steps: [
        {
          type: 'intro',
          title: 'Mão esquerda no Dó2',
          body: 'Agora a mão esquerda desce uma oitava: o dedo 5 no Dó2 e o polegar no Sol2. As notas novas na clave de Fá são Mi2, Ré2 e Dó2.',
          illustration: { staff: [48, 50, 52, 53, 55], clef: 'bass', keys: [48, 50, 52, 53, 55] },
        },
        { type: 'find-key', title: 'Notas novas', notes: [52, 50, 48, 55, 53, 48], show: 'staff', clef: 'bass' },
      ],
    },
    {
      id: 't13-paralelo',
      title: 'Movimento paralelo',
      icon: '⇈',
      steps: [
        {
          type: 'intro',
          title: 'As duas mãos na mesma direção',
          body: 'Leia as duas pautas de baixo para cima. No movimento paralelo, as mãos sobem e descem juntas.',
        },
        { type: 'practice', title: 'Mão direita', songId: 'est-07', hands: 'right', view: 'sheet' },
        { type: 'practice', title: 'Mão esquerda', songId: 'est-07', hands: 'left', view: 'sheet' },
        { type: 'practice', title: 'Mãos juntas', songId: 'est-07', hands: 'both', view: 'sheet' },
        { type: 'play', title: 'No ritmo', songId: 'est-07', hands: 'both', view: 'sheet', minStars: 1 },
      ],
    },
    {
      id: 't13-contrario',
      title: 'Movimento contrário',
      icon: '⇅',
      steps: [
        {
          type: 'intro',
          title: 'Uma sobe, a outra desce',
          body: 'No movimento contrário, enquanto a mão direita sobe, a esquerda desce, e vice-versa.',
        },
        { type: 'practice', title: 'Mãos juntas', songId: 'est-08', hands: 'both', view: 'sheet' },
        { type: 'practice', title: 'Melodia e acompanhamento', songId: 'est-09', hands: 'both', view: 'sheet' },
        { type: 'play', title: 'No ritmo', songId: 'est-09', hands: 'both', view: 'sheet', minStars: 1 },
      ],
    },
  ],
};

const u14: Unit = {
  id: 'u14',
  title: 'Ligadura de valor',
  description: 'Unidade 14 do MOR',
  lessons: [
    {
      id: 't14-ligadura',
      title: 'Somando durações',
      icon: '⌒',
      steps: [
        {
          type: 'intro',
          title: 'Ligadura de valor',
          body: 'A ligadura de valor é uma linha curva que une duas notas IGUAIS. Toque só a primeira e segure, somando as durações. Ex.: semibreve ligada a uma mínima = 6 tempos, um único som.',
        },
        {
          type: 'listen',
          title: 'Com ou sem ligadura?',
          rounds: [
            round('Você ouviu um som só (ligado) ou dois sons repetidos?', [t(67, 3)], ['Um som só (com ligadura)', 'Dois sons (sem ligadura)'], 0, undefined, { tempo: 80 }),
            round('E agora?', [t(67, 1.5), t(67, 1.5)], ['Um som só (com ligadura)', 'Dois sons (sem ligadura)'], 1, undefined, { tempo: 80 }),
          ],
        },
        {
          type: 'quiz',
          title: 'Quanto vale?',
          questions: [
            { prompt: 'Mínima ligada a outra mínima vale…', options: ['2 tempos', '4 tempos', '3 tempos'], answer: 1 },
            { prompt: 'Semibreve ligada a uma semínima vale…', options: ['5 tempos', '4 tempos', '6 tempos'], answer: 0 },
          ],
        },
        { type: 'practice', title: 'Estudo com ligaduras', songId: 'est-10', hands: 'both', view: 'sheet' },
        { type: 'play', title: 'No ritmo', songId: 'est-10', hands: 'both', view: 'sheet', minStars: 1 },
      ],
    },
  ],
};

const u15: Unit = {
  id: 'u15',
  title: 'Ponto de aumento',
  description: 'Unidade 15 do MOR',
  lessons: [
    {
      id: 't15-ponto',
      title: 'A mínima pontuada',
      icon: '•',
      steps: [
        {
          type: 'intro',
          title: 'O ponto aumenta metade',
          body: 'O ponto ao lado da figura aumenta a metade do seu valor. A mínima vale 2 tempos; a mínima pontuada vale 2 + 1 = 3 tempos.',
          illustration: { figures: ['minima', 'minima-pontuada'] },
        },
        {
          type: 'quiz',
          title: 'Quanto vale?',
          questions: [
            { prompt: 'Quanto vale a mínima pontuada?', options: ['2 tempos', '3 tempos', '4 tempos'], answer: 1, illustration: { figures: ['minima-pontuada'] } },
            { prompt: 'Uma semínima pontuada vale…', options: ['1 tempo e meio', '2 tempos', '3 tempos'], answer: 0 },
          ],
        },
        { type: 'rhythm', title: 'Ritmo pontuado', songId: 'rit-pontuada' },
        { type: 'practice', title: 'Estudo em três tempos', songId: 'est-11', hands: 'both', view: 'sheet' },
        { type: 'play', title: 'No ritmo', songId: 'est-11', hands: 'both', view: 'sheet', minStars: 1 },
      ],
    },
  ],
};

const u16: Unit = {
  id: 'u16',
  title: 'A colcheia',
  description: 'Unidade 16 do MOR',
  lessons: [
    {
      id: 't16-colcheia',
      title: 'Dividindo o tempo',
      icon: '♪',
      steps: [
        {
          type: 'intro',
          title: 'Colcheia',
          body: 'A colcheia vale metade da semínima: duas colcheias cabem em uma batida. Pense em caminhar e bater duas palmas a cada passo. Seu número é o 8.',
          illustration: { figures: ['seminima', 'colcheia', 'colcheia', 'pausa-colcheia'] },
        },
        {
          type: 'quiz',
          title: 'Proporções',
          questions: [
            { prompt: 'Quantas colcheias cabem numa semínima?', options: ['1', '2', '4'], answer: 1 },
            { prompt: 'Quantas colcheias cabem numa semibreve?', options: ['4', '6', '8'], answer: 2 },
            { prompt: 'Qual é esta figura?', options: ['Semínima', 'Colcheia', 'Mínima'], answer: 1, illustration: { figures: ['colcheia'] } },
          ],
        },
        { type: 'rhythm', title: 'Colcheias', songId: 'rit-colcheias' },
        { type: 'practice', title: 'Exercício de articulação', songId: 'est-12', hands: 'right', view: 'sheet' },
        { type: 'practice', title: 'Mãos juntas', songId: 'est-12', hands: 'both', view: 'sheet', tempoFactor: 0.8 },
        { type: 'play', title: 'No ritmo', songId: 'est-12', hands: 'both', view: 'sheet', minStars: 1 },
      ],
    },
  ],
};

const u17: Unit = {
  id: 'u17',
  title: 'Recursos de dedilhado',
  description: 'Unidade 17 do MOR',
  lessons: [
    {
      id: 't17-recursos',
      title: 'Quando a mão não alcança',
      icon: '🖐',
      steps: [
        {
          type: 'intro',
          title: 'Recursos de dedilhado',
          body: 'Quando a mão não consegue ficar parada na posição, usamos recursos: Abertura (A) — abrir a mão; Contração (C) — fechar; Mudança (M) — trocar o dedo numa nota repetida; Substituição (S) — trocar o dedo sem repetir a nota; Passagem (P) — passar o polegar por baixo; Deslocamento (Dt) — levar a mão a outra posição.',
        },
        {
          type: 'quiz',
          title: 'Qual recurso?',
          questions: [
            { prompt: 'Passar o polegar por baixo da mão para continuar a escala é…', options: ['Passagem', 'Contração', 'Mudança'], answer: 0 },
            { prompt: 'Trocar de dedo numa nota que é REPETIDA é…', options: ['Substituição', 'Mudança', 'Abertura'], answer: 1 },
            { prompt: 'Trocar de dedo numa nota SUSTENTADA (sem repetir) é…', options: ['Substituição', 'Mudança', 'Deslocamento'], answer: 0 },
            { prompt: 'Abrir a mão para alcançar uma nota mais distante é…', options: ['Contração', 'Abertura', 'Passagem'], answer: 1 },
          ],
        },
        {
          type: 'intro',
          title: 'Passagem do polegar',
          body: 'Na escala de Dó, depois do Mi (dedo 3), o polegar passa por baixo e toca o Fá. Na volta, o dedo 3 passa por cima do polegar.',
          illustration: { keys: [60, 62, 64, 65, 67, 69, 71, 72] },
        },
        { type: 'practice', title: 'Escala de Dó', songId: 'ex-escala-do', hands: 'right', view: 'sheet' },
        { type: 'play', title: 'No ritmo', songId: 'ex-escala-do', hands: 'right', minStars: 1 },
      ],
    },
  ],
};

const u18: Unit = {
  id: 'u18',
  title: 'Respiração e repetição',
  description: 'Unidades 18 e 19 do MOR',
  lessons: [
    {
      id: 't18-sinais',
      title: 'Sinais da partitura',
      icon: '🔁',
      steps: [
        {
          type: 'intro',
          title: 'Respiração e ritornelo',
          body: 'Os sinais de respiração marcam onde interromper brevemente o som, como quem respira ao cantar. O ritornelo (dois pontos junto à barra dupla) manda repetir o trecho.',
        },
        {
          type: 'quiz',
          title: 'Revisão',
          questions: [
            { prompt: 'O sinal de respiração indica…', options: ['Uma breve interrupção do som', 'Tocar mais forte', 'Repetir o trecho'], answer: 0 },
            { prompt: 'O ritornelo indica…', options: ['Parar a música', 'Repetir o trecho', 'Tocar mais devagar'], answer: 1 },
          ],
        },
      ],
    },
  ],
};

const u21: Unit = {
  id: 'u21',
  title: 'Tom, semitom e alterações',
  description: 'Unidade 21 do MOR',
  lessons: [
    {
      id: 't21-semitom',
      title: 'Sustenido e bemol',
      icon: '♯',
      steps: [
        {
          type: 'intro',
          title: 'A menor distância',
          body: 'SEMITOM é a menor distância entre duas teclas vizinhas (branca-preta, ou Mi-Fá e Si-Dó). TOM são dois semitons. O SUSTENIDO (♯) sobe um semitom; o BEMOL (♭) desce um semitom; o BEQUADRO (♮) anula a alteração.',
          illustration: { keys: [64, 65, 66] },
        },
        {
          type: 'listen',
          title: 'Tom ou semitom?',
          rounds: [
            round('A distância entre os dois sons foi…', [t(64), t(65)], ['Semitom', 'Tom'], 0, 'Mi e Fá são vizinhos sem tecla preta entre eles.'),
            round('E agora?', [t(60), t(62)], ['Semitom', 'Tom'], 1),
            round('E agora?', [t(67), t(68)], ['Semitom', 'Tom'], 0),
          ],
        },
        { type: 'find-key', title: 'Encontre as alterações', notes: [66, 70, 61, 63, 68], show: 'name' },
        { type: 'find-key', title: 'Leia as alterações', notes: [66, 70, 61], show: 'staff', clef: 'treble' },
      ],
    },
  ],
};

const u22: Unit = {
  id: 'u22',
  title: 'Escalas e acordes',
  description: 'Unidade 22 do MOR',
  lessons: [
    {
      id: 't22-escalas',
      title: 'Escala e acordes de Dó',
      icon: '🪜',
      steps: [
        {
          type: 'intro',
          title: 'Escala maior',
          body: 'Uma escala maior tem 8 notas seguindo o desenho: tom, tom, semitom, tom, tom, tom, semitom. A escala de Dó maior usa só teclas brancas.',
          illustration: { keys: [60, 62, 64, 65, 67, 69, 71, 72] },
        },
        {
          type: 'intro',
          title: 'Acordes',
          body: 'Um acorde é tocar três ou mais notas ao mesmo tempo. Os acordes de Dó, Fá e Sol acompanham muitos hinos em Dó maior.',
          illustration: { keys: [48, 52, 55] },
        },
        { type: 'practice', title: 'Acordes de Dó, Fá e Sol', songId: 'ex-acordes-maiores', hands: 'left' },
        { type: 'watch', title: 'Ouça: Hino à Alegria', songId: 'pc-alegria', hands: 'both' },
        { type: 'practice', title: 'Melodia', songId: 'pc-alegria', hands: 'right' },
        { type: 'practice', title: 'Com acompanhamento', songId: 'pc-alegria', hands: 'both', tempoFactor: 0.75 },
      ],
    },
  ],
};

const u23: Unit = {
  id: 'u23',
  title: 'Sol maior',
  description: 'Unidade 23 do MOR',
  lessons: [
    {
      id: 't23-sol',
      title: 'Escala de Sol maior',
      icon: '🎼',
      steps: [
        {
          type: 'intro',
          title: 'Um sustenido na armadura',
          body: 'A escala de Sol maior tem um sustenido: Fá♯. Ele aparece uma vez no começo da pauta (armadura de clave) e vale para todos os Fás da música.',
          illustration: { staff: [67, 69, 71, 72, 74, 76, 78, 79], clef: 'treble' },
        },
        { type: 'practice', title: 'Posição de Sol', songId: 'est-sol', hands: 'both', view: 'sheet' },
        { type: 'practice', title: 'Escala de Sol maior', songId: 'esc-sol', hands: 'right', view: 'sheet' },
        { type: 'play', title: 'No ritmo', songId: 'esc-sol', hands: 'right', view: 'sheet', minStars: 1 },
      ],
    },
  ],
};

const u24: Unit = {
  id: 'u24',
  title: 'Fá maior',
  description: 'Unidade 24 do MOR',
  lessons: [
    {
      id: 't24-fa',
      title: 'Escala de Fá maior',
      icon: '🎼',
      steps: [
        {
          type: 'intro',
          title: 'Um bemol na armadura',
          body: 'A escala de Fá maior tem um bemol: Si♭. Na mão direita, o dedilhado é 1-2-3-4, 1-2-3-4.',
          illustration: { staff: [65, 67, 69, 70, 72, 74, 76, 77], clef: 'treble', flats: true },
        },
        { type: 'practice', title: 'Posição de Fá', songId: 'est-fa', hands: 'both', view: 'sheet' },
        { type: 'practice', title: 'Escala de Fá maior', songId: 'esc-fa', hands: 'right', view: 'sheet' },
        { type: 'play', title: 'No ritmo', songId: 'esc-fa', hands: 'right', view: 'sheet', minStars: 1 },
      ],
    },
  ],
};

const u26: Unit = {
  id: 'u26',
  title: 'Primeiros hinos',
  description: 'Unidade 26 do MOR',
  lessons: [
    {
      id: 't26-hino',
      title: 'Primeiro hino',
      icon: '⛪',
      steps: [
        {
          type: 'intro',
          title: 'Estudando um hino',
          body: 'Estude o hino por partes: primeiro cada linha com cada mão, depois mãos juntas devagar e, por fim, o hino inteiro no andamento.',
        },
        { type: 'watch', title: 'Ouça o hino', songId: 'hino-exemplo', hands: 'both', view: 'sheet' },
        { type: 'practice', title: '1ª linha — mão direita', songId: 'hino-exemplo', hands: 'right', sectionId: 'l1', view: 'sheet' },
        { type: 'practice', title: '1ª linha — mão esquerda', songId: 'hino-exemplo', hands: 'left', sectionId: 'l1', view: 'sheet' },
        { type: 'practice', title: '1ª linha — mãos juntas', songId: 'hino-exemplo', hands: 'both', sectionId: 'l1', view: 'sheet', tempoFactor: 0.75 },
        { type: 'practice', title: 'Hino completo', songId: 'hino-exemplo', hands: 'both', view: 'sheet', tempoFactor: 0.75 },
        { type: 'play', title: 'No andamento', songId: 'hino-exemplo', hands: 'both', view: 'sheet', minStars: 1 },
      ],
    },
  ],
};

export const trilha: Course = {
  id: 'trilha',
  title: 'Trilha de aprendizagem',
  description: 'Do primeiro contato com o teclado aos primeiros hinos, na sequência do MOR.',
  instrument: 'both',
  units: [u1, u2, u3, u4, u5, u6, u7, u8, u9, u10, u11, u12, u13, u14, u15, u16, u17, u18, u21, u22, u23, u24, u26],
};

/** Todos os passos, útil para validação. */
export function allSteps(): AnyLessonStep[] {
  return trilha.units.flatMap((u) => u.lessons.flatMap((l) => l.steps));
}
