export interface CrosswordResult {
  stars: 1 | 2 | 3;
  score: number;
}

const BASE = 300;
const MAX_SPEED_BONUS = 300;
const MAX_ACCURACY_BONUS = 400;
const PAR_SECONDS_PER_BLANK = 15;
const MISTAKE_PENALTY = 40;
const HINT_PENALTY = 80;

/**
 * Scores a completed crossword (every blank filled correctly).
 *
 * - 300 base so any finish feels rewarding.
 * - up to 300 for speed: par = `blanks x 15s`; speed = min(1, par/elapsed) x 300.
 *   Guarded against a zero/negative elapsed so it never divides by zero.
 * - up to 400 for accuracy: reduced by ~40 per wrong tap and ~80 per hint used,
 *   floored at 0.
 *
 * Final score is clamped to [300, 1000].
 *
 * Stars: 3 for a clean solve (no wrong taps, no hints); otherwise 2 if the score
 * reaches 550; otherwise 1 for finishing.
 */
export function scoreCrossword(
  elapsedMs: number,
  blanks: number,
  mistakes: number,
  hintsUsed: number,
): CrosswordResult {
  const parMs = blanks * PAR_SECONDS_PER_BLANK * 1000;
  const speedBonus = Math.min(1, parMs / Math.max(1, elapsedMs)) * MAX_SPEED_BONUS;
  const accuracyBonus = Math.max(
    0,
    MAX_ACCURACY_BONUS - mistakes * MISTAKE_PENALTY - hintsUsed * HINT_PENALTY,
  );
  const raw = Math.round(BASE + speedBonus + accuracyBonus);
  const score = Math.max(300, Math.min(1000, raw));

  const stars: 1 | 2 | 3 = mistakes === 0 && hintsUsed === 0 ? 3 : score >= 550 ? 2 : 1;

  return { stars, score };
}
