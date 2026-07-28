import type { DifficultyConfig } from './types';

export interface FitResult {
  stars: 1 | 2 | 3;
  score: number;
}

/** Every completion earns at least this. */
const COMPLETION_FLOOR = 300;
/** Max speed bonus, awarded for finishing at or under par time. */
const MAX_SPEED_BONUS = 500;
/** Max accuracy bonus, before hint/misplaced penalties. */
const MAX_ACCURACY_BONUS = 200;
/** Penalty per hint used, subtracted from the accuracy bonus. */
const HINT_PENALTY = 80;
/** Penalty per rejected placement attempt, subtracted from the accuracy bonus. */
const MISPLACED_PENALTY = 15;
/** Seconds of "par" time allotted per piece. */
const SECONDS_PER_PIECE = 12;
const MAX_SCORE = 1000;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Scores a completed Shape Fit puzzle. Mirrors the row-row / bus-route style:
 * a fixed completion floor plus a speed bonus and an accuracy bonus.
 *
 *   par            = pieceCount × 12s
 *   speedBonus     = min(1, par / elapsedSeconds) × 500      (full at/under par)
 *   accuracyBonus  = max(0, 200 − 80·hints − 15·misplaced)
 *   score          = clamp(300 + speedBonus + accuracyBonus, 300, 1000)
 *
 * Stars: 3 when no hints were used and score ≥ 850; 2 when score ≥ 550; else 1.
 */
export function scoreFit(
  elapsedMs: number,
  pieceCount: number,
  hintsUsed: number,
  misplacedAttempts: number,
  _difficulty: DifficultyConfig,
): FitResult {
  const par = pieceCount * SECONDS_PER_PIECE;
  const elapsedSeconds = elapsedMs / 1000;
  const speedRatio = elapsedSeconds > 0 ? Math.min(1, par / elapsedSeconds) : 1;
  const speedBonus = speedRatio * MAX_SPEED_BONUS;

  const accuracyBonus = Math.max(
    0,
    MAX_ACCURACY_BONUS - hintsUsed * HINT_PENALTY - misplacedAttempts * MISPLACED_PENALTY,
  );

  const score = clamp(
    Math.round(COMPLETION_FLOOR + speedBonus + accuracyBonus),
    COMPLETION_FLOOR,
    MAX_SCORE,
  );

  const stars: 1 | 2 | 3 =
    hintsUsed === 0 && score >= 850 ? 3 : score >= 550 ? 2 : 1;

  return { stars, score };
}
