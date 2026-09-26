import { loadHymn } from './hymnal';
import type { Song } from './types';

/** Busca uma música (hoje, os hinos e coros do hinário). */
export function getSong(id: string): Song | undefined {
  return loadHymn(id);
}

export type { Song } from './types';
