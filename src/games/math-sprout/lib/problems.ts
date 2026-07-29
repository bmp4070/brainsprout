import { mulberry32, randInt } from '../../../shared/lib/rng';
import { ROUND_LENGTH } from './types';
import type { DifficultyId, OperationId, Problem } from './types';

/** Inclusive factor range `[min, max]` used for both operands when multiplying. */
const MULTIPLY_FACTOR_RANGE: Record<DifficultyId, { min: number; max: number }> = {
  // Factors start at 2 (never 0 or 1) so every problem is a real times-table fact.
  easy: { min: 2, max: 5 },
  medium: { min: 2, max: 7 },
  hard: { min: 2, max: 10 },
};

/** Inclusive range for the minuend `a` when subtracting; `b` is drawn from `[1, a]`. */
const SUBTRACT_A_RANGE: Record<DifficultyId, { min: number; max: number }> = {
  easy: { min: 3, max: 10 },
  medium: { min: 6, max: 20 },
  hard: { min: 15, max: 99 },
};

/** Random integer in the inclusive range `[min, max]`. */
function intInRange(rng: () => number, min: number, max: number): number {
  return min + randInt(rng, max - min + 1);
}

/** Seeded Fisher-Yates shuffle; does not mutate the input. */
function shuffle<T>(rng: () => number, arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randInt(rng, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Picks 4 distinct, non-negative integers including `answer`, preferring the
 * given plausible-distractor `candidates` (in priority order) and falling
 * back to nudging by ±1, ±2, ±3, ... until 4 unique values are found. Never
 * throws: the fallback loop always terminates because the integers are
 * unbounded above.
 */
function pickFourDistinct(answer: number, candidates: number[]): number[] {
  const values = new Set<number>([answer]);
  for (const candidate of candidates) {
    if (values.size >= 4) break;
    if (candidate < 0 || values.has(candidate)) continue;
    values.add(candidate);
  }
  let offset = 1;
  let sign = 1;
  while (values.size < 4) {
    const candidate = answer + sign * offset;
    if (candidate >= 0 && !values.has(candidate)) {
      values.add(candidate);
    }
    if (sign === 1) {
      sign = -1;
    } else {
      sign = 1;
      offset += 1;
    }
  }
  return Array.from(values);
}

/** Shuffles the 4 answer values and records where the correct one landed. */
function buildChoices(
  rng: () => number,
  answer: number,
  candidates: number[],
): { choices: number[]; correctIndex: number } {
  const four = pickFourDistinct(answer, candidates);
  const choices = shuffle(rng, four);
  return { choices, correctIndex: choices.indexOf(answer) };
}

/** Generates one problem for `operation`/`difficulty` from a seeded rng. Never throws. */
export function generateProblem(
  operation: OperationId,
  difficulty: DifficultyId,
  rng: () => number,
): Problem {
  if (operation === 'multiply') {
    const { min, max } = MULTIPLY_FACTOR_RANGE[difficulty];
    const a = intInRange(rng, min, max);
    const b = intInRange(rng, min, max);
    const answer = a * b;
    // Plausible near-misses: off-by-a-bit, and adjacent times-table facts
    // (bump one factor up or down by 1) — the classic times-table slips.
    const candidates = [
      a * (b + 1),
      a * (b - 1),
      (a + 1) * b,
      (a - 1) * b,
      answer + 1,
      answer - 1,
      answer + 2,
      answer - 2,
    ];
    const { choices, correctIndex } = buildChoices(rng, answer, candidates);
    return { a, b, operation, answer, choices, correctIndex };
  }

  const { min, max } = SUBTRACT_A_RANGE[difficulty];
  const a = intInRange(rng, min, max);
  const b = intInRange(rng, 1, a);
  const answer = a - b;
  // Plausible near-misses: adding instead of subtracting (a common slip),
  // off-by-one on either operand, and off-by-a-bit on the answer itself.
  const candidates = [a + b, a - (b + 1), a - (b - 1), answer + 1, answer - 1, answer + 2, answer - 2];
  const { choices, correctIndex } = buildChoices(rng, answer, candidates);
  return { a, b, operation, answer, choices, correctIndex };
}

/**
 * Generates a full, deterministic round of `ROUND_LENGTH` problems from a
 * single seed. Best-effort avoids two identical (a, b) problems back-to-back
 * (bounded retries so it can never loop forever or throw).
 */
export function generateRound(operation: OperationId, difficulty: DifficultyId, seed: number): Problem[] {
  const rng = mulberry32(seed);
  const problems: Problem[] = [];
  let prevKey: string | null = null;

  for (let i = 0; i < ROUND_LENGTH; i += 1) {
    let problem = generateProblem(operation, difficulty, rng);
    let attempts = 0;
    while (prevKey !== null && `${problem.a},${problem.b}` === prevKey && attempts < 5) {
      problem = generateProblem(operation, difficulty, rng);
      attempts += 1;
    }
    problems.push(problem);
    prevKey = `${problem.a},${problem.b}`;
  }

  return problems;
}
