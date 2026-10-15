import { arpeggioSong, chromaticSong, KEYS, scaleSong, type ScaleKey } from './escalas';
import { hymnCatalog } from './hymnal';
import { getSong } from './index';
import type { Song } from './types';

/**
 * Trilha de aprendizagem do órgão, na ordem do MOR (Método de Estudos para
 * Órgão Eletrônico da CCB): Volume → Unidade → lições.
 *
 * Começa de quando a aluna se senta ao órgão para tocar: as unidades só de
 * teoria (o som, notas, pauta, claves, figuras…) ficam de fora. Cada lição
 * abre na mesma tela de tocar dos hinos.
 *
 * Conteúdo de cada lição:
 * - Hinos: os do hinário que o MOR indica naquela unidade (já disponíveis).
 * - Escalas e arpejos das tonalidades estudadas (gerados pelo app).
 * - Estudos e Exercícios do MOR: partituras do livro “Estudos para Órgão
 *   Eletrônico aplicados ao Hinário”. Ficam “em preparação” até serem
 *   transcritas do livro (os planos de aula só citam as páginas).
 */

export type LessonKind = 'hino' | 'escala' | 'arpejo' | 'estudo' | 'exercicio' | 'pedaleira';

export interface Lesson {
  id: string;
  kind: LessonKind;
  /** Nome da lição (aparece no lugar do título do hino). */
  title: string;
  /** Linha de apoio (ex.: título do hino). */
  detail?: string;
  /** Já pode ser tocada no app. */
  available: boolean;
  hymn?: number;
  scale?: ScaleKey | 'cromatica';
}

export interface Unit {
  id: string;
  volume: 1 | 2;
  number: number;
  title: string;
  lessons: Lesson[];
}

const TITLES = new Map(hymnCatalog().filter((h) => h.kind === 'hino').map((h) => [h.number, h.title]));

// ------------------------------------------------------------------ montagem

function unit(volume: 1 | 2, number: number, title: string, ...groups: Omit<Lesson, 'id'>[][]): Unit {
  const id = `v${volume}-u${number}`;
  const lessons = groups.flat().map((l, i) => ({ ...l, id: `${id}-${i + 1}` }));
  return { id, volume, number, title, lessons };
}

const hinos = (...nums: number[]): Omit<Lesson, 'id'>[] =>
  nums.map((n) => ({ kind: 'hino', title: `Hino ${n}`, detail: TITLES.get(n), available: true, hymn: n }));

const escala = (key: ScaleKey): Omit<Lesson, 'id'>[] => [
  { kind: 'escala', title: `Escala de ${KEYS[key].name}`, available: true, scale: key },
  { kind: 'arpejo', title: `Arpejo de ${KEYS[key].name}`, available: true, scale: key },
];

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const estudos = (...nums: number[]): Omit<Lesson, 'id'>[] =>
  nums.map((n) => ({ kind: 'estudo', title: `Estudo ${n}`, available: false }));

const exercicios = (...nums: number[]): Omit<Lesson, 'id'>[] =>
  nums.map((n) => ({ kind: 'exercicio', title: `Exercício ${n}`, available: false }));

const pedaleira = (title = 'Exercícios de pedaleira'): Omit<Lesson, 'id'>[] => [{ kind: 'pedaleira', title, available: false }];

// ------------------------------------------------------------------ Volume 1

const VOLUME_1: Unit[] = [
  unit(1, 11, 'Estudos 1 ao 10', estudos(...range(1, 10))),
  unit(1, 13, 'Estudos 11 ao 15', estudos(...range(11, 15))),
  unit(1, 14, 'Ligadura de valor', estudos(16, 17)),
  unit(1, 15, 'Ponto de aumento', estudos(...range(18, 22))),
  unit(1, 16, 'A figura da colcheia', exercicios(...range(2, 5))),
  unit(1, 17, 'Recursos de dedilhado', exercicios(...range(6, 10))),
  unit(1, 18, 'Sinais de respiração e articulação de dedos', estudos(23, 24), [
    { kind: 'exercicio', title: 'Exercícios de articulação de dedos', available: false },
  ]),
  unit(1, 19, 'Sinais de repetição e mudança de posição das mãos', estudos(...range(25, 27))),
  unit(1, 20, 'Deslocamento', exercicios(15), estudos(28)),
  unit(1, 21, 'Tom, semitom e sinais de alteração', estudos(29)),
  unit(1, 22, 'Escalas e acordes', escala('do'), exercicios(...range(16, 18)), estudos(30)),
  unit(1, 23, 'Escala de Sol Maior, staccato', escala('sol'), exercicios(19, 20), estudos(...range(31, 33))),
  unit(1, 24, 'Escala de Fá Maior, fermata', escala('fa'), exercicios(21, 22), estudos(...range(34, 36))),
  unit(1, 25, 'Pedaleira', pedaleira('Pedaleira e sistema'), estudos(...range(37, 40))),
  unit(1, 26, 'Hinos', hinos(158, 131, 468)),
];

// ------------------------------------------------------------------ Volume 2

const VOLUME_2: Unit[] = [
  unit(2, 2, 'Tonalidade de Dó Maior', escala('do'), exercicios(1, 2, 3)),
  unit(2, 3, 'Grupos rítmicos', exercicios(4, 5, 6), pedaleira('Exercícios de pedaleira 1 a 9')),
  unit(2, 5, 'Estudos 1 a 3', estudos(1, 2, 3)),
  unit(2, 7, 'Ligaduras', estudos(4), pedaleira()),
  unit(2, 8, 'Contratempo', estudos(5)),
  unit(2, 9, 'Compasso composto', estudos(6)),
  unit(2, 10, 'Exercício 7 e Estudo 7', exercicios(7), estudos(7)),
  unit(2, 11, 'Estudo dos hinos em Dó Maior', hinos(81, 351, 459, 461)),
  unit(2, 12, 'Tonalidade de Fá Maior', escala('fa'), exercicios(8), estudos(8, 9)),
  unit(2, 13, 'Estudo 10, Hino 357 e Estudo 11', estudos(10), hinos(357), estudos(11)),
  unit(2, 14, 'Respiração sobre passagens melódicas', hinos(39, 49, 235, 383, 468)),
  unit(2, 15, 'Síncopa e hinos em Fá Maior', exercicios(9), pedaleira(), hinos(20, 460)),
  unit(2, 16, 'Tonalidade de Sol Maior', escala('sol'), exercicios(10), pedaleira(), estudos(12)),
  unit(2, 17, 'Dinâmica', estudos(13, 14, 15)),
  unit(2, 18, 'Estudo dos hinos em Sol Maior', hinos(3, 96, 131, 199, 278, 363, 437, 454, 466)),
  unit(2, 19, 'Tonalidade de Si♭ Maior', escala('sib'), exercicios(11, 12), pedaleira()),
  unit(2, 20, 'Estudos 16 e 17', estudos(16, 17)),
  unit(2, 21, 'Inversão de vozes e hinos em Si♭ Maior', hinos(109, 132, 165, 433, 439, 443, 445, 448, 451, 474, 476, 477, 479, 480)),
  unit(2, 22, 'Tonalidade de Ré Maior', escala('re'), exercicios(13), pedaleira(), estudos(18, 19)),
  unit(2, 23, 'Estudo dos hinos em Ré Maior', hinos(248, 262, 444)),
  unit(2, 24, 'Tonalidade de Mi♭ Maior', escala('mib'), exercicios(14), pedaleira(), estudos(20, 21, 22)),
  unit(
    2,
    25,
    'Estudo dos hinos em Mi♭ Maior',
    hinos(27, 48, 61, 121, 164, 193, 260, 274, 293, 314, 374, 400, 421, 435, 438, 447, 456, 458, 467, 473, 475, 478),
  ),
  unit(2, 26, 'Tonalidade de Lá♭ Maior', escala('lab'), exercicios(15), pedaleira(), estudos(23)),
  unit(2, 27, 'Estudo dos hinos em Lá♭ Maior', hinos(32, 62, 150, 189, 247, 346, 365, 373, 397, 432, 442, 449, 450, 463)),
  unit(2, 28, 'Tonalidade de Ré♭ Maior', escala('reb'), exercicios(16), pedaleira(), estudos(24), hinos(194, 455)),
  unit(2, 29, 'Novas pulsações', exercicios(17), pedaleira(), estudos(25)),
  unit(2, 30, 'Estudo dos hinos', hinos(431, 434, 441, 453, 457, 471, 472)),
  unit(2, 31, 'Quiálteras', exercicios(18), hinos(464, 465, 469)),
  unit(2, 32, 'Linha de oitava', exercicios(19, 20), estudos(26, 27), hinos(4, 452, 462)),
  unit(2, 33, 'Estudos 28, 29 e 30', estudos(28), pedaleira(), estudos(29, 30)),
  unit(2, 34, 'Estudo dos hinos', hinos(440, 446, 470)),
  unit(2, 35, 'Escala cromática e escalas maiores', [
    { kind: 'escala', title: 'Escala cromática', available: true, scale: 'cromatica' },
    ...(['do', 'sol', 're', 'fa', 'sib', 'mib', 'lab', 'reb'] as ScaleKey[]).map(
      (k) => ({ kind: 'escala', title: `Escala de ${KEYS[k].name}`, available: true, scale: k }) as const,
    ),
  ]),
];

export const TRILHA: { volume: 1 | 2; title: string; units: Unit[] }[] = [
  { volume: 1, title: 'Volume 1', units: VOLUME_1 },
  { volume: 2, title: 'Volume 2', units: VOLUME_2 },
];

const BY_ID = new Map<string, { lesson: Lesson; unit: Unit }>();
for (const v of TRILHA) for (const u of v.units) for (const l of u.lessons) BY_ID.set(l.id, { lesson: l, unit: u });

export function getLesson(id: string): { lesson: Lesson; unit: Unit } | undefined {
  return BY_ID.get(id);
}

/** Quantas lições da unidade já foram tocadas com ao menos 1 estrela. */
export function unitProgress(u: Unit, stars: Record<string, number>): { done: number; total: number } {
  const ready = u.lessons.filter((l) => l.available);
  return { done: ready.filter((l) => (stars[l.id] ?? 0) >= 1).length, total: ready.length };
}

/** Lições que já podem ser tocadas, na ordem do volume. */
function playable(volume: 1 | 2): Lesson[] {
  return TRILHA.find((v) => v.volume === volume)!.units.flatMap((u) => u.lessons.filter((l) => l.available));
}

/** Lição seguinte disponível no mesmo volume (para o botão “Próxima lição”). */
export function nextLesson(id: string): Lesson | undefined {
  const found = BY_ID.get(id);
  if (!found) return undefined;
  const all = playable(found.unit.volume);
  const i = all.findIndex((l) => l.id === id);
  return i >= 0 ? all[i + 1] : undefined;
}

/**
 * A trilha segue a ordem do MOR: cada volume começa liberado na primeira
 * lição, e a seguinte abre quando a anterior for tocada com ao menos 1 estrela.
 */
export function isUnlocked(id: string, stars: Record<string, number>): boolean {
  const found = BY_ID.get(id);
  if (!found || !found.lesson.available) return false;
  const all = playable(found.unit.volume);
  const i = all.findIndex((l) => l.id === id);
  return i <= 0 || (stars[all[i - 1].id] ?? 0) >= 1;
}

/**
 * Música da lição, pronta para a tela de tocar. O título mostrado é o da
 * lição (ex.: “Unidade 26 · Hino 158”), não o do hino.
 */
export function lessonSong(id: string): Song | undefined {
  const found = BY_ID.get(id);
  if (!found || !found.lesson.available) return undefined;
  const { lesson, unit: u } = found;
  const title = `Unidade ${u.number} · ${lesson.title}`;
  const songId = `licao-${lesson.id}`;
  if (lesson.kind === 'hino' && lesson.hymn) {
    const hymn = getSong(`hino-${String(lesson.hymn).padStart(3, '0')}`);
    return hymn ? { ...hymn, id: songId, title, subtitle: lesson.detail, hymnNumber: undefined } : undefined;
  }
  if (lesson.scale === 'cromatica') return chromaticSong(songId, title);
  if (lesson.scale && lesson.kind === 'arpejo') return arpeggioSong(lesson.scale, songId, title);
  if (lesson.scale) return scaleSong(lesson.scale, songId, title);
  return undefined;
}
