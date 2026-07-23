export interface SortResult {
  stars: 1 | 2 | 3;
  score: number;
  ratio: number;
}

const THREE_STAR_RATIO = 1.15;
const TWO_STAR_RATIO = 1.6;
const HINT_PENALTY = 50;
const MIN_SCORE = 300;
const MAX_SCORE = 1000;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Scores a solved puzzle by comparing the pours used to the puzzle's par (the
 * proven minimum).
 *
 * `ratio` = pours / par, floored at 1: par is a true minimum, so a "better
 * than par" result can only come from a non-exact par and is treated as
 * perfect. A non-positive par is guarded to ratio 1 rather than dividing by
 * zero.
 *
 * Stars: 3 for within 15% of par AND no hints used, 2 for within 60%,
 * otherwise 1 for finishing at all.
 *
 * Score maps the useful band of ratios [1.0, 1.8] onto [1000, 300]:
 *   score = round(300 + 700 * clamp((1.8 - ratio) / 0.8, 0, 1)) - 50 * hints
 * and is finally clamped to [300, 1000] so every finish is worth at least 300.
 */
export function scoreSort(pours: number, par: number, hintsUsed: number): SortResult {
  const raw = par > 0 ? pours / par : 1;
  const ratio = Number.isFinite(raw) ? Math.max(1, raw) : 1;
  const hints = Math.max(0, hintsUsed);

  const stars: 1 | 2 | 3 =
    ratio <= THREE_STAR_RATIO && hints === 0 ? 3 : ratio <= TWO_STAR_RATIO ? 2 : 1;

  const base = Math.round(MIN_SCORE + 700 * clamp01((1.8 - ratio) / 0.8));
  const score = Math.max(MIN_SCORE, Math.min(MAX_SCORE, base - HINT_PENALTY * hints));

  return { stars, score, ratio };
}
