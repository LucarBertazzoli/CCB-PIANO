export type HitRating = 'perfect' | 'good';

export interface ScoreSummary {
  total: number;
  hits: number;
  perfect: number;
  missed: number;
  wrong: number;
  bestStreak: number;
  /** 0..1 */
  accuracy: number;
  stars: 0 | 1 | 2 | 3;
}

export function starsFor(accuracy: number): 0 | 1 | 2 | 3 {
  if (accuracy >= 0.95) return 3;
  if (accuracy >= 0.8) return 2;
  if (accuracy >= 0.6) return 1;
  return 0;
}

/**
 * Precisão:
 *  - modo ritmo: perfeito vale 1, bom vale 0.8, perdida vale 0.
 *  - modo espera: cada nota vale 1, notas erradas descontam.
 */
export function computeAccuracy(
  mode: 'wait' | 'rhythm',
  s: Pick<ScoreSummary, 'total' | 'hits' | 'perfect' | 'wrong'>,
): number {
  if (s.total === 0) return 1;
  if (mode === 'rhythm') {
    const good = s.hits - s.perfect;
    const raw = (s.perfect + good * 0.8) / s.total;
    // Notas erradas pesam pouco no modo ritmo (o tempo já penaliza).
    return Math.max(0, raw - (s.wrong * 0.25) / s.total);
  }
  return s.hits / (s.total + s.wrong * 0.5);
}
