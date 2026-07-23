import { describe, expect, it } from 'vitest';
import { generatePuzzle } from './generator';
import { isSolved } from './rules';
import { solveMinPours } from './solver';
import { CAPACITY, DIFFICULTIES } from './types';
import type { DifficultyConfig, Puzzle } from './types';

const ALL_DIFFICULTIES = [DIFFICULTIES.easy, DIFFICULTIES.medium, DIFFICULTIES.hard];

function isWellFormed(puzzle: Puzzle, difficulty: DifficultyConfig): boolean {
  const { board } = puzzle;
  if (board.length !== difficulty.colorCount + difficulty.emptyBottles) return false;

  const counts = new Array<number>(difficulty.colorCount).fill(0);
  for (const bottle of board) {
    if (bottle.length > CAPACITY) return false;
    for (const color of bottle) {
      if (color < 0 || color >= difficulty.colorCount) return false;
      counts[color] += 1;
    }
  }
  if (!counts.every((c) => c === CAPACITY)) return false;

  if (isSolved(board)) return false;

  const solved = solveMinPours(board);
  return solved.pours > 0 && (solved.firstMove !== null || solved.pours === 0);
}

describe('potion-sort generator', () => {
  it('is deterministic for a fixed seed', () => {
    const a = generatePuzzle(DIFFICULTIES.medium, 42);
    const b = generatePuzzle(DIFFICULTIES.medium, 42);
    expect(a).toEqual(b);
  });

  it('produces different boards for different seeds', () => {
    const a = generatePuzzle(DIFFICULTIES.medium, 1);
    const b = generatePuzzle(DIFFICULTIES.medium, 2);
    expect(a.board).not.toEqual(b.board);
  });

  it('carries the seed and difficulty onto the puzzle', () => {
    const puzzle = generatePuzzle(DIFFICULTIES.hard, 99);
    expect(puzzle.seed).toBe(99);
    expect(puzzle.difficulty).toBe('hard');
  });

  it('never throws and always produces a well-formed, solvable board', () => {
    for (const difficulty of ALL_DIFFICULTIES) {
      for (let seed = 0; seed < 40; seed += 1) {
        expect(() => generatePuzzle(difficulty, seed)).not.toThrow();
        const puzzle = generatePuzzle(difficulty, seed);
        expect(isWellFormed(puzzle, difficulty)).toBe(true);
      }
    }
  });

  it('reports par as a positive number, exact or not', () => {
    for (const difficulty of ALL_DIFFICULTIES) {
      for (let seed = 0; seed < 10; seed += 1) {
        const puzzle = generatePuzzle(difficulty, seed);
        expect(puzzle.par).toBeGreaterThan(0);
        expect(typeof puzzle.parExact).toBe('boolean');
      }
    }
  });

  it('is not already solved out of the box', () => {
    for (const difficulty of ALL_DIFFICULTIES) {
      for (let seed = 0; seed < 20; seed += 1) {
        const puzzle = generatePuzzle(difficulty, seed);
        expect(isSolved(puzzle.board)).toBe(false);
      }
    }
  });
});
