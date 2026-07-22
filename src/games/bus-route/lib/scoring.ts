export interface RouteResult {
  stars: 1 | 2 | 3;
  score: number;
  ratio: number;
}

const THREE_STAR_RATIO = 1.03;
const TWO_STAR_RATIO = 1.3;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Scores a completed route by comparing its length to the true optimal tour.
 *
 * `ratio` = playerLength / optimalLength, always >= 1 (guarded so a
 * non-positive optimalLength yields a perfect ratio of 1 rather than dividing
 * by zero). Stars: 3 within 3% of optimal, 2 within 30%, else 1 for finishing.
 *
 * Score uses efficiency = optimalLength / playerLength in (0, 1]. We stretch
 * the useful band [0.55, 1.0] to [0, 1] and map it onto [300, 1000]:
 *   score = round(300 + 700 * clamp((efficiency - 0.55) / 0.45, 0, 1))
 * so any completion earns at least 300 and only an optimal-or-near route
 * reaches 1000.
 */
export function scoreRoute(playerLength: number, optimalLength: number): RouteResult {
  const ratio = optimalLength > 0 ? playerLength / optimalLength : 1;
  const stars: 1 | 2 | 3 =
    ratio <= THREE_STAR_RATIO ? 3 : ratio <= TWO_STAR_RATIO ? 2 : 1;

  const efficiency = ratio > 0 ? 1 / ratio : 1;
  const score = Math.round(300 + 700 * clamp01((efficiency - 0.55) / 0.45));

  return { stars, score, ratio };
}
