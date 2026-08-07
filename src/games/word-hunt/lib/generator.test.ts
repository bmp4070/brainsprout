import { describe, expect, it } from 'vitest';
import { generatePuzzle } from './generator';
import { solveBoard, findPath } from './solver';
import { DIFFICULTIES } from './types';

describe('generatePuzzle', () => {
  it('is deterministic for a given seed', () => {
    const a = generatePuzzle(DIFFICULTIES.medium, 4242);
    const b = generatePuzzle(DIFFICULTIES.medium, 4242);
    expect(b).toEqual(a);
  });

  it('produces different boards for different seeds', () => {
    const a = generatePuzzle(DIFFICULTIES.medium, 1);
    const b = generatePuzzle(DIFFICULTIES.medium, 2);
    expect(b.grid).not.toEqual(a.grid);
  });

  for (const difficulty of Object.values(DIFFICULTIES)) {
    describe(difficulty.id, () => {
      const puzzle = generatePuzzle(difficulty, 7);

      it('has the right grid dimensions', () => {
        expect(puzzle.grid).toHaveLength(difficulty.size);
        for (const row of puzzle.grid) expect(row).toHaveLength(difficulty.size);
      });

      it('contains at least the target number of findable words', () => {
        expect(puzzle.solutions.length).toBeGreaterThanOrEqual(difficulty.targetWords);
      });

      it('lists solutions that are all genuinely traceable and long enough', () => {
        for (const w of puzzle.solutions) {
          expect(w.length).toBeGreaterThanOrEqual(difficulty.minWordLen);
          expect(findPath(puzzle.grid, w)).not.toBeNull();
        }
      });

      it('solutions match an independent solve of the grid', () => {
        expect(new Set(puzzle.solutions)).toEqual(new Set(solveBoard(puzzle.grid, difficulty.minWordLen)));
      });
    });
  }

  it('never throws across many seeds', () => {
    for (let seed = 0; seed < 60; seed += 1) {
      expect(() => generatePuzzle(DIFFICULTIES.hard, seed)).not.toThrow();
    }
  });
});
