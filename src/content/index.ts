import { courses } from './courses';
import { exercises } from './songs/exercises';
import { hymns } from './songs/hymns';
import { pieces } from './songs/pieces';
import type { Course, Lesson, Song, Unit } from './types';

/**
 * Catálogo de conteúdo. Hoje é carregado de arquivos locais; no futuro pode
 * ser trocado por uma API sem mudar as telas.
 */
const songs = new Map<string, Song>();
for (const s of [...exercises, ...pieces, ...hymns]) {
  if (songs.has(s.id)) throw new Error(`Música duplicada: ${s.id}`);
  songs.set(s.id, s);
}

export function getSong(id: string): Song | undefined {
  return songs.get(id);
}

export function allSongs(): Song[] {
  return [...songs.values()];
}

export function allHymns(): Song[] {
  return hymns.slice().sort((a, b) => (a.hymnNumber ?? 0) - (b.hymnNumber ?? 0));
}

export function allCourses(): Course[] {
  return courses;
}

export interface LessonRef {
  course: Course;
  unit: Unit;
  lesson: Lesson;
  /** Posição na trilha (para liberar as lições em ordem). */
  order: number;
}

const lessons = new Map<string, LessonRef>();
for (const course of courses) {
  let order = 0;
  for (const unit of course.units) {
    for (const lesson of unit.lessons) {
      if (lessons.has(lesson.id)) throw new Error(`Lição duplicada: ${lesson.id}`);
      lessons.set(lesson.id, { course, unit, lesson, order: order++ });
    }
  }
}

export function getLesson(id: string): LessonRef | undefined {
  return lessons.get(id);
}

export function lessonsOf(course: Course): LessonRef[] {
  return [...lessons.values()].filter((l) => l.course.id === course.id);
}

export type { Course, Lesson, Song, Unit } from './types';
