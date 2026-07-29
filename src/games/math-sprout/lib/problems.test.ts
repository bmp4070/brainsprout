import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../../shared/lib/rng';
import { generateProblem, generateRound } from './problems';
import { ROUND_LENGTH } from './types';
import type { DifficultyId, OperationId } from './types';

const OPS: OperationId[] = ['subtract', 'multiply'];
const DIFFS: DifficultyId[] = ['easy', 'medium', 'hard'];

const MULTIPLY_RANGE: Record<DifficultyId, { min: number; max: number }> = {
  easy: { min: 2, max: 5 },
  medium: { min: 2, max: 7 },
  hard: { min: 2, max: 10 },
};

const SUBTRACT_A_RANGE: Record<DifficultyId, { min: number; max: number }> = {
  easy: { min: 3, max: 10 },
  medium: { min: 6, max: 20 },
  hard: { min: 15, max: 99 },
};

function checkInvariants(problem: ReturnType<typeof generateProblem>, operation: OperationId, difficulty: DifficultyId) {
  // Answer is correct for the operation.
  if (operation === 'multiply') {
    expect(problem.answer).toBe(problem.a * problem.b);
    const { min, max } = MULTIPLY_RANGE[difficulty];
    expect(problem.a).toBeGreaterThanOrEqual(min);
    expect(problem.a).toBeLessThanOrEqual(max);
    expect(problem.b).toBeGreaterThanOrEqual(min);
    expect(problem.b).toBeLessThanOrEqual(max);
  } else {
    expect(problem.answer).toBe(problem.a - problem.b);
    expect(problem.answer).toBeGreaterThanOrEqual(0);
    const { min, max } = SUBTRACT_A_RANGE[difficulty];
    expect(problem.a).toBeGreaterThanOrEqual(min);
    expect(problem.a).toBeLessThanOrEqual(max);
    expect(problem.b).toBeGreaterThanOrEqual(1);
    expect(problem.b).toBeLessThanOrEqual(problem.a);
  }

  // Choices: length 4, distinct, all non-negative, answer appears exactly
  // once at correctIndex.
  expect(problem.choices).toHaveLength(4);
  expect(new Set(problem.choices).size).toBe(4);
  for (const choice of problem.choices) {
    expect(choice).toBeGreaterThanOrEqual(0);
  }
  expect(problem.choices.filter((c) => c === problem.answer)).toHaveLength(1);
  expect(problem.choices[problem.correctIndex]).toBe(problem.answer);
  expect(problem.correctIndex).toBeGreaterThanOrEqual(0);
  expect(problem.correctIndex).toBeLessThan(4);
}

describe('generateProblem', () => {
  it('computes the correct answer for subtraction', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 50; i += 1) {
      const problem = generateProblem('subtract', 'medium', rng);
      expect(problem.answer).toBe(problem.a - problem.b);
    }
  });

  it('computes the correct answer for multiplication', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 50; i += 1) {
      const problem = generateProblem('multiply', 'medium', rng);
      expect(problem.answer).toBe(problem.a * problem.b);
    }
  });

  it('is deterministic given the same rng seed', () => {
    const a = generateProblem('multiply', 'hard', mulberry32(7));
    const b = generateProblem('multiply', 'hard', mulberry32(7));
    expect(a).toEqual(b);
  });

  for (const operation of OPS) {
    for (const difficulty of DIFFS) {
      it(`${operation}/${difficulty}: satisfies invariants across seeds`, () => {
        for (let seed = 1; seed <= 100; seed += 1) {
          const rng = mulberry32(seed);
          const problem = generateProblem(operation, difficulty, rng);
          checkInvariants(problem, operation, difficulty);
        }
      });
    }
  }

  it('never throws across many seeds and configurations', () => {
    for (const operation of OPS) {
      for (const difficulty of DIFFS) {
        for (let seed = 1; seed <= 100; seed += 1) {
          expect(() => generateProblem(operation, difficulty, mulberry32(seed))).not.toThrow();
        }
      }
    }
  });
});

describe('generateRound', () => {
  it('produces exactly ROUND_LENGTH problems', () => {
    const round = generateRound('subtract', 'easy', 1);
    expect(round).toHaveLength(ROUND_LENGTH);
  });

  it('is deterministic per seed', () => {
    const a = generateRound('multiply', 'hard', 99);
    const b = generateRound('multiply', 'hard', 99);
    expect(a).toEqual(b);
  });

  it('produces different rounds for different seeds (typically)', () => {
    const a = generateRound('multiply', 'hard', 1);
    const b = generateRound('multiply', 'hard', 2);
    expect(a).not.toEqual(b);
  });

  for (const operation of OPS) {
    for (const difficulty of DIFFS) {
      it(`${operation}/${difficulty}: every problem in the round satisfies invariants`, () => {
        for (let seed = 1; seed <= 20; seed += 1) {
          const round = generateRound(operation, difficulty, seed);
          expect(round).toHaveLength(ROUND_LENGTH);
          for (const problem of round) {
            checkInvariants(problem, operation, difficulty);
          }
        }
      });
    }
  }

  it('never throws across many seeds and configurations (fuzz)', () => {
    for (const operation of OPS) {
      for (const difficulty of DIFFS) {
        for (let seed = 1; seed <= 100; seed += 1) {
          expect(() => generateRound(operation, difficulty, seed)).not.toThrow();
        }
      }
    }
  });
});
