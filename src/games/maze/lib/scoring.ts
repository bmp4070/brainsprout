export interface MazeResult {
  stars: 1 | 2 | 3;
  score: number;
}

const BASE_SCORE = 300;
const MAX_EFFICIENCY_BONUS = 500;
const NO_HINT_BONUS = 200;
const HINT_PENALTY = 40;

const THREE_STAR_FACTOR = 1.2;
const TWO_STAR_FACTOR = 2;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Scores a completed maze run.
 *
 * `optimalLength` is the number of STEPS on the shortest path — i.e.
 * `solve(maze, start).length - 1` — and `moves` is how many steps the player
 * actually took (moves >= optimalLength for a real completion).
 *
 * Score bands (all summed, then floored at 0 so it never goes negative):
 *   - BASE_SCORE (300): awarded for finishing at all.
 *   - efficiency bonus (up to 500): efficiency = clamp(optimalLength / moves, 0, 1),
 *     so a perfectly direct run earns the full 500 and a wandering run earns less.
 *   - no-hint bonus (200): granted only when the player used zero hints.
 *   - hint penalty (40 per hint): subtracted for each hint revealed.
 * A flawless, hint-free, optimal run therefore tops out at a clean 1000.
 *
 * Stars:
 *   - 3: no hints AND moves within 1.2x optimal (tight, unaided run).
 *   - 2: moves within 2x optimal (a solid finish).
 *   - 1: any other completion.
 *
 * Guards: a non-positive optimalLength (degenerate maze) is treated as a
 * perfect efficiency of 1; efficiency is clamped so moves < optimalLength can
 * never push the bonus above its cap.
 */
export function scoreMaze(
  moves: number,
  optimalLength: number,
  hintsUsed: number,
): MazeResult {
  const efficiency =
    optimalLength > 0 && moves > 0 ? clamp01(optimalLength / moves) : 1;

  const efficiencyBonus = Math.round(MAX_EFFICIENCY_BONUS * efficiency);
  const noHintBonus = hintsUsed === 0 ? NO_HINT_BONUS : 0;
  const hintPenalty = hintsUsed * HINT_PENALTY;

  const score = Math.max(
    0,
    BASE_SCORE + efficiencyBonus + noHintBonus - hintPenalty,
  );

  const threeStarLimit = optimalLength * THREE_STAR_FACTOR;
  const twoStarLimit = optimalLength * TWO_STAR_FACTOR;

  const stars: 1 | 2 | 3 =
    hintsUsed === 0 && moves <= threeStarLimit
      ? 3
      : moves <= twoStarLimit
        ? 2
        : 1;

  return { stars, score };
}
