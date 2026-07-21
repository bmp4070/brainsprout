import { describe, expect, it } from 'vitest';
import { DIFFICULTIES } from './types';
import { generatePuzzle } from './generator';
import { wingsOfFire } from '../themes/wings-of-fire';

const A_TO_Z = /^[A-Z]$/;

function cellsSpellWord(
  grid: string[][],
  cells: { row: number; col: number }[],
  word: string,
): boolean {
  return cells.every((cell, i) => grid[cell.row][cell.col] === word[i]);
}

function inBounds(row: number, col: number, size: number): boolean {
  return row >= 0 && row < size && col >= 0 && col < size;
}

describe('generatePuzzle', () => {
  it('fills the grid entirely with A-Z letters', () => {
    const puzzle = generatePuzzle(wingsOfFire, DIFFICULTIES.medium, 12345);
    expect(puzzle.grid).toHaveLength(puzzle.size);
    for (const row of puzzle.grid) {
      expect(row).toHaveLength(puzzle.size);
      for (const letter of row) {
        expect(letter).toMatch(A_TO_Z);
      }
    }
  });

  it('places each word such that its cells spell it out and stay in bounds', () => {
    const puzzle = generatePuzzle(wingsOfFire, DIFFICULTIES.medium, 12345);
    expect(puzzle.placements.length).toBeGreaterThan(0);
    for (const placement of puzzle.placements) {
      expect(placement.cells).toHaveLength(placement.word.length);
      for (const cell of placement.cells) {
        expect(inBounds(cell.row, cell.col, puzzle.size)).toBe(true);
      }
      expect(cellsSpellWord(puzzle.grid, placement.cells, placement.word)).toBe(
        true,
      );
    }
  });

  it('easy difficulty only uses east and south directions', () => {
    const puzzle = generatePuzzle(wingsOfFire, DIFFICULTIES.easy, 999);
    for (const placement of puzzle.placements) {
      if (placement.cells.length < 2) continue;
      const dr = Math.sign(placement.cells[1].row - placement.cells[0].row);
      const dc = Math.sign(placement.cells[1].col - placement.cells[0].col);
      const isEast = dr === 0 && dc === 1;
      const isSouth = dr === 1 && dc === 0;
      expect(isEast || isSouth).toBe(true);
    }
  });

  it('produces a deterministic puzzle for a fixed seed', () => {
    const a = generatePuzzle(wingsOfFire, DIFFICULTIES.hard, 42);
    const b = generatePuzzle(wingsOfFire, DIFFICULTIES.hard, 42);
    expect(a.grid).toEqual(b.grid);
    expect(a.placements).toEqual(b.placements);
  });

  it('never throws and places expected word counts across many seeds/difficulties', () => {
    const difficulties = [
      DIFFICULTIES.easy,
      DIFFICULTIES.medium,
      DIFFICULTIES.hard,
    ];
    for (let seed = 0; seed < 300; seed++) {
      for (const difficulty of difficulties) {
        let puzzle;
        expect(() => {
          puzzle = generatePuzzle(wingsOfFire, difficulty, seed);
        }).not.toThrow();
        const expectedCount = Math.min(
          difficulty.wordCount,
          wingsOfFire.words[difficulty.id].length,
        );
        // Should place all requested words in practice; allow the documented
        // fallback of dropping words only as an extreme safety net.
        expect(puzzle!.placements.length).toBeLessThanOrEqual(expectedCount);
        expect(puzzle!.placements.length).toBeGreaterThan(0);
        expect(puzzle!.placements.length).toBe(expectedCount);
      }
    }
  });
});
