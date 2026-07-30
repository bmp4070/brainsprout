export interface SpotResult {
  stars: 1 | 2 | 3;
  score: number;
}

const BASE = 300;
const MAX_SPEED_BONUS = 500;
const MAX_ACCURACY_BONUS = 200;
const PAR_SECONDS_PER_DIFF = 8;
const HINT_PENALTY = 40;
const WRONG_TAP_PENALTY = 20;

/**
 * Scores a completed round.
 *
 * - 300 base so any finish feels rewarding.
 * - up to 500 for speed: par = `diffCount x 8s`; speed = min(1, par/elapsed) x 500
 *   (solve at or under par for the full bonus, slower tapers toward 0). Guarded
 *   against a zero/negative elapsed so it never divides by zero.
 * - up to 200 for accuracy: 200 reduced by ~40 per hint and ~20 per wrong tap,
 *   floored at 0 on that component.
 *
 * Final score is clamped to [300, 1000].
 *
 * Stars: 3 for a clean solve (no hints, at most one wrong tap); otherwise 2 if
 * the score reaches 550; otherwise 1 for finishing.
 */
export function scoreSpot(
  elapsedMs: number,
  diffCount: number,
  wrongTaps: number,
  hintsUsed: number,
): SpotResult {
  const parMs = diffCount * PAR_SECONDS_PER_DIFF * 1000;
  const speedBonus = Math.min(1, parMs / Math.max(1, elapsedMs)) * MAX_SPEED_BONUS;
  const accuracyBonus = Math.max(
    0,
    MAX_ACCURACY_BONUS - hintsUsed * HINT_PENALTY - wrongTaps * WRONG_TAP_PENALTY,
  );
  const raw = Math.round(BASE + speedBonus + accuracyBonus);
  const score = Math.max(300, Math.min(1000, raw));

  const stars: 1 | 2 | 3 =
    hintsUsed === 0 && wrongTaps <= 1 ? 3 : score >= 550 ? 2 : 1;

  return { stars, score };
}
