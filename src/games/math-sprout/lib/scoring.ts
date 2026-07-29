import { ROUND_LENGTH } from './types';

export interface RoundResult {
  stars: 1 | 2 | 3;
  score: number;
}

/** Max score contribution from raw accuracy (correct / ROUND_LENGTH). */
const ACCURACY_WEIGHT = 700;
/** Max score contribution from the best streak reached this round. */
const STREAK_WEIGHT = 300;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Scores a completed round, mirroring the bus-route/cat-nap style: a clean
 * additive formula that's always non-negative and rewards effort, never
 * penalizing a kid for a completed round.
 *
 *   accuracy   = correct / ROUND_LENGTH                (0..1)
 *   streakRate = bestStreak / ROUND_LENGTH              (0..1, capped)
 *   score      = round(accuracy × 700 + streakRate × 300)   -- always in [0, 1000]
 *
 * Stars: 3 when correct ≥ 9, 2 when correct ≥ 6, else 1 (finishing always
 * earns at least 1 star — there's no way to "fail" Math Sprout).
 */
export function scoreRound(correct: number, bestStreak: number): RoundResult {
  const accuracy = clamp01(correct / ROUND_LENGTH);
  const streakRate = clamp01(bestStreak / ROUND_LENGTH);
  const score = Math.round(accuracy * ACCURACY_WEIGHT + streakRate * STREAK_WEIGHT);

  const stars: 1 | 2 | 3 = correct >= 9 ? 3 : correct >= 6 ? 2 : 1;

  return { stars, score: Math.max(0, Math.min(1000, score)) };
}
