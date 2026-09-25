import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface SongRecord {
  bestStars: 0 | 1 | 2 | 3;
  bestAccuracy: number;
  plays: number;
  lastPlayedAt: number;
}

export interface LessonRecord {
  completed: boolean;
  stars: 0 | 1 | 2 | 3;
  completedAt?: number;
}

interface ProgressState {
  songs: Record<string, SongRecord>;
  lessons: Record<string, LessonRecord>;
  /** Dias (AAAA-MM-DD) em que houve prática. */
  practiceDays: string[];
  practiceSeconds: number;
  recordSongResult: (songId: string, stars: 0 | 1 | 2 | 3, accuracy: number) => void;
  completeLesson: (lessonId: string, stars: 0 | 1 | 2 | 3) => void;
  addPracticeTime: (seconds: number) => void;
  reset: () => void;
}

export function dayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Dias seguidos de prática terminando hoje (ou ontem). */
export function currentStreak(days: string[], today = new Date()): number {
  const set = new Set(days);
  const cursor = new Date(today);
  if (!set.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (set.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      songs: {},
      lessons: {},
      practiceDays: [],
      practiceSeconds: 0,
      recordSongResult: (songId, stars, accuracy) =>
        set((s) => {
          const prev = s.songs[songId];
          const today = dayKey();
          return {
            songs: {
              ...s.songs,
              [songId]: {
                bestStars: Math.max(prev?.bestStars ?? 0, stars) as 0 | 1 | 2 | 3,
                bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, accuracy),
                plays: (prev?.plays ?? 0) + 1,
                lastPlayedAt: Date.now(),
              },
            },
            practiceDays: s.practiceDays.includes(today) ? s.practiceDays : [...s.practiceDays, today],
          };
        }),
      completeLesson: (lessonId, stars) =>
        set((s) => {
          const prev = s.lessons[lessonId];
          return {
            lessons: {
              ...s.lessons,
              [lessonId]: {
                completed: true,
                stars: Math.max(prev?.stars ?? 0, stars) as 0 | 1 | 2 | 3,
                completedAt: prev?.completedAt ?? Date.now(),
              },
            },
          };
        }),
      addPracticeTime: (seconds) => set((s) => ({ practiceSeconds: s.practiceSeconds + seconds })),
      reset: () => set({ songs: {}, lessons: {}, practiceDays: [], practiceSeconds: 0 }),
    }),
    { name: 'ccb-piano-progress', storage: createJSONStorage(() => AsyncStorage), version: 1 },
  ),
);
