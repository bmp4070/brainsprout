export interface DropResult {
  stars: 1 | 2 | 3;
  score: number;
}

const BASE = 300;
const MAX_SPEED_BONUS = 350;
const MAX_ACCURACY_BONUS = 350;
const PAR_SECONDS_PER_BOTTLE = 4;
const MISS_PENALTY = 25;

/**
 * Scores a completed round (target bottles filled).
 *
 * - 300 base so any finish feels rewarding.
 * - up to 350 for speed: par = `target x 4s`; speed = min(1, par/elapsed) x 350.
 *   Guarded against a zero/negative elapsed so it never divides by zero.
 * - up to 350 for accuracy: reduced by ~25 per missed drop, floored at 0.
 *
 * Final score is clamped to [300, 1000].
 *
 * Stars: 3 for a sharp round (at most one miss); otherwise 2 if the score
 * reaches 550; otherwise 1 for finishing.
 */
export function scoreDrop(elapsedMs: number, target: number, misses: number): DropResult {
  const parMs = target * PAR_SECONDS_PER_BOTTLE * 1000;
  const speedBonus = Math.min(1, parMs / Math.max(1, elapsedMs)) * MAX_SPEED_BONUS;
  const accuracyBonus = Math.max(0, MAX_ACCURACY_BONUS - misses * MISS_PENALTY);
  const raw = Math.round(BASE + speedBonus + accuracyBonus);
  const score = Math.max(300, Math.min(1000, raw));

  const stars: 1 | 2 | 3 = misses <= 1 ? 3 : score >= 550 ? 2 : 1;

  return { stars, score };
}
