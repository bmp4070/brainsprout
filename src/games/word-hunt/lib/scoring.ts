export interface HuntResult {
  stars: 1 | 2 | 3;
  score: number;
}

const BASE = 300;
const MAX_SPEED_BONUS = 350;
const MAX_ACCURACY_BONUS = 350;
const PAR_SECONDS_PER_WORD = 12;
const HINT_PENALTY = 50;

/**
 * Scores a completed round (target word count reached).
 *
 * - 300 base so any finish feels rewarding.
 * - up to 350 for speed: par = `targetWords x 12s`; speed = min(1, par/elapsed) x 350.
 *   Guarded against a zero/negative elapsed so it never divides by zero.
 * - up to 350 for accuracy: reduced by ~50 per hint used, floored at 0. (There
 *   is no wrong-answer penalty — bad traces simply don't count as words.)
 *
 * Final score is clamped to [300, 1000].
 *
 * Stars: 3 for a hint-free solve; otherwise 2 if the score reaches 550;
 * otherwise 1 for finishing.
 */
export function scoreHunt(elapsedMs: number, targetWords: number, hintsUsed: number): HuntResult {
  const parMs = targetWords * PAR_SECONDS_PER_WORD * 1000;
  const speedBonus = Math.min(1, parMs / Math.max(1, elapsedMs)) * MAX_SPEED_BONUS;
  const accuracyBonus = Math.max(0, MAX_ACCURACY_BONUS - hintsUsed * HINT_PENALTY);
  const raw = Math.round(BASE + speedBonus + accuracyBonus);
  const score = Math.max(300, Math.min(1000, raw));

  const stars: 1 | 2 | 3 = hintsUsed === 0 ? 3 : score >= 550 ? 2 : 1;

  return { stars, score };
}
