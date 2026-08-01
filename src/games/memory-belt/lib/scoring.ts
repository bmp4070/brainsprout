export interface MemoryResult {
  stars: 1 | 2 | 3;
  score: number;
}

const BASE = 300;
const MAX_SPEED_BONUS = 400;
const MAX_ACCURACY_BONUS = 300;
const PAR_SECONDS_PER_TARGET = 4;
const WRONG_TAP_PENALTY = 30;

/**
 * Scores a completed round (all targets caught).
 *
 * - 300 base so any finish feels rewarding.
 * - up to 400 for speed: par = `targetCount x 4s`; speed = min(1, par/elapsed) x 400.
 *   Guarded against a zero/negative elapsed so it never divides by zero.
 * - up to 300 for accuracy: 300 reduced by ~30 per wrong tap (tapping a decoy or
 *   an item that wasn't studied), floored at 0.
 *
 * Final score is clamped to [300, 1000].
 *
 * Stars: 3 for a clean run (at most one wrong tap); otherwise 2 if the score
 * reaches 550; otherwise 1 for finishing.
 */
export function scoreMemory(elapsedMs: number, targetCount: number, wrongTaps: number): MemoryResult {
  const parMs = targetCount * PAR_SECONDS_PER_TARGET * 1000;
  const speedBonus = Math.min(1, parMs / Math.max(1, elapsedMs)) * MAX_SPEED_BONUS;
  const accuracyBonus = Math.max(0, MAX_ACCURACY_BONUS - wrongTaps * WRONG_TAP_PENALTY);
  const raw = Math.round(BASE + speedBonus + accuracyBonus);
  const score = Math.max(300, Math.min(1000, raw));

  const stars: 1 | 2 | 3 = wrongTaps <= 1 ? 3 : score >= 550 ? 2 : 1;

  return { stars, score };
}
