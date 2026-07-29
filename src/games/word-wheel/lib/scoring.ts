import type { DifficultyConfig } from './types';

export interface WheelResult {
  stars: 1 | 2 | 3;
  score: number;
}

const COMPLETION_FLOOR = 300;
const MAX_SPEED_BONUS = 500;
const MAX_ACCURACY_BONUS = 200;
const HINT_PENALTY = 40;
const INVALID_PENALTY = 15;
const SECONDS_PER_WORD = 15;
const MAX_SCORE = 1000;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Calculates score and star rating for a completed Word Wheel round.
 * Base completion floor (300) + speed bonus (up to 500) + accuracy bonus (up to 200).
 */
export function calculateScore(
  elapsedMs: number,
  totalWords: number,
  hintsUsed: number,
  invalidAttempts: number,
  _difficulty: DifficultyConfig,
): WheelResult {
  const par = Math.max(15, totalWords * SECONDS_PER_WORD);
  const elapsedSeconds = elapsedMs / 1000;
  const speedRatio = elapsedSeconds > 0 ? Math.min(1, par / elapsedSeconds) : 1;
  const speedBonus = speedRatio * MAX_SPEED_BONUS;

  const accuracyBonus = Math.max(
    0,
    MAX_ACCURACY_BONUS - hintsUsed * HINT_PENALTY - invalidAttempts * INVALID_PENALTY,
  );

  const score = clamp(
    Math.round(COMPLETION_FLOOR + speedBonus + accuracyBonus),
    COMPLETION_FLOOR,
    MAX_SCORE,
  );

  const stars: 1 | 2 | 3 = hintsUsed === 0 && score >= 850 ? 3 : score >= 550 ? 2 : 1;

  return { stars, score };
}
