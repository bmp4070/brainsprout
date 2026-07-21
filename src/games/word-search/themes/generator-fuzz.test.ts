import { describe, expect, it } from 'vitest';
import { generatePuzzle } from '../lib/generator';
import { DIFFICULTIES } from '../lib/types';
import { themes } from './index';

const SEEDS_PER_COMBO = 100;

function cellsSpellWord(
  grid: string[][],
  cells: { row: number; col: number }[],
  word: string,
): boolean {
  return cells.every((cell, i) => grid[cell.row][cell.col] === word[i]);
}

describe('generatePuzzle fuzz across every theme and difficulty', () => {
  for (const theme of themes) {
    for (const difficulty of Object.values(DIFFICULTIES)) {
      it(`places every requested word for ${theme.id}/${difficulty.id} across ${SEEDS_PER_COMBO} seeds`, () => {
        const expectedCount = Math.min(
          difficulty.wordCount,
          theme.words[difficulty.id].length,
        );

        for (let seed = 0; seed < SEEDS_PER_COMBO; seed++) {
          const puzzle = generatePuzzle(theme, difficulty, seed);

          expect(puzzle.placements.length).toBe(expectedCount);
          for (const placement of puzzle.placements) {
            expect(placement.cells).toHaveLength(placement.word.length);
            expect(
              cellsSpellWord(puzzle.grid, placement.cells, placement.word),
            ).toBe(true);
          }
        }
      });
    }
  }
});
