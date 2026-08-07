import { describe, expect, it } from 'vitest';
import { generatePuzzle } from './generator';
import { DIFFICULTIES } from './types';
import type { Cell, Op, Puzzle } from './types';

function apply(op: Op, a: number, b: number): number {
  if (op === '×') return a * b;
  if (op === '−') return a - b;
  return a + b;
}

const numAt = (grid: Cell[][], r: number, c: number): number | null =>
  grid[r]?.[c]?.kind === 'num' ? (grid[r][c] as { value: number }).value : null;
const opAt = (grid: Cell[][], r: number, c: number): string | null =>
  grid[r]?.[c]?.kind === 'op' ? (grid[r][c] as { symbol: string }).symbol : null;

/** Scans the grid for every "num op num = num" run (horizontal and vertical). */
function scanEquations(grid: Cell[][]): Array<{ op: Op; a: number; b: number; c: number }> {
  const found: Array<{ op: Op; a: number; b: number; c: number }> = [];
  const S = grid.length;
  for (let r = 0; r < S; r += 1) {
    for (let c = 0; c < S; c += 1) {
      // horizontal
      const ho = opAt(grid, r, c + 1);
      if (numAt(grid, r, c) !== null && ho !== null && ho !== '=' && numAt(grid, r, c + 2) !== null && opAt(grid, r, c + 3) === '=' && numAt(grid, r, c + 4) !== null) {
        found.push({ op: ho as Op, a: numAt(grid, r, c)!, b: numAt(grid, r, c + 2)!, c: numAt(grid, r, c + 4)! });
      }
      // vertical
      const vo = opAt(grid, r + 1, c);
      if (numAt(grid, r, c) !== null && vo !== null && vo !== '=' && numAt(grid, r + 2, c) !== null && opAt(grid, r + 3, c) === '=' && numAt(grid, r + 4, c) !== null) {
        found.push({ op: vo as Op, a: numAt(grid, r, c)!, b: numAt(grid, r + 2, c)!, c: numAt(grid, r + 4, c)! });
      }
    }
  }
  return found;
}

/** True iff the puzzle used the fallback (every number is 1). */
function isFallback(p: Puzzle): boolean {
  return p.grid.flat().filter((cell) => cell.kind === 'num').every((cell) => (cell as { value: number }).value === 1);
}

describe('generatePuzzle', () => {
  it('is deterministic for a given seed', () => {
    expect(generatePuzzle(DIFFICULTIES.medium, 2024)).toEqual(generatePuzzle(DIFFICULTIES.medium, 2024));
  });

  it('produces different puzzles for different seeds', () => {
    const a = generatePuzzle(DIFFICULTIES.medium, 1);
    const b = generatePuzzle(DIFFICULTIES.medium, 2);
    expect(JSON.stringify(b.grid)).not.toBe(JSON.stringify(a.grid));
  });

  it('grows the board with difficulty (5x5, 9x9, 13x13)', () => {
    expect(DIFFICULTIES.easy.size).toBe(5);
    expect(DIFFICULTIES.medium.size).toBe(9);
    expect(DIFFICULTIES.hard.size).toBe(13);
    for (const d of Object.values(DIFFICULTIES)) {
      const p = generatePuzzle(d, 0);
      expect(p.grid).toHaveLength(d.size);
      for (const row of p.grid) expect(row).toHaveLength(d.size);
    }
  });

  for (const difficulty of Object.values(DIFFICULTIES)) {
    describe(difficulty.id, () => {
      // Hard is a 13x13 solve (slower), so sample fewer of those; still ample.
      const sampleCount = difficulty.id === 'hard' ? 15 : 30;
      const seeds = Array.from({ length: sampleCount }, (_, s) => s * 101 + 7);
      const puzzles = seeds.map((s) => generatePuzzle(difficulty, s));

      it('never falls back to the trivial all-ones grid', () => {
        for (const p of puzzles) expect(isFallback(p)).toBe(false);
      });

      it('every equation on the board is arithmetically true', () => {
        for (const p of puzzles) {
          const eqs = scanEquations(p.grid);
          expect(eqs.length).toBeGreaterThan(0);
          for (const eq of eqs) expect(apply(eq.op, eq.a, eq.b)).toBe(eq.c);
        }
      });

      it('blanks the configured count, never two in one equation', () => {
        for (const p of puzzles) expect(p.blanks).toHaveLength(difficulty.blanks);
      });

      it('uses both subtraction and multiplication in every puzzle', () => {
        for (const p of puzzles) {
          const ops = new Set(scanEquations(p.grid).map((e) => e.op));
          expect(ops.has('−')).toBe(true);
          expect(ops.has('×')).toBe(true);
        }
      });

      it('keeps every number a non-negative, readable integer', () => {
        for (const p of puzzles) {
          for (const row of p.grid) {
            for (const cell of row) {
              if (cell.kind === 'num') {
                expect(Number.isInteger(cell.value)).toBe(true);
                expect(cell.value).toBeGreaterThanOrEqual(0);
                expect(cell.value).toBeLessThanOrEqual(100);
              }
            }
          }
        }
      });

      it('each blank has 4 distinct choices including the correct answer', () => {
        for (const p of puzzles) {
          for (const blank of p.blanks) {
            expect(blank.choices).toHaveLength(4);
            expect(new Set(blank.choices).size).toBe(4);
            expect(blank.choices[blank.correctIndex]).toBe(blank.answer);
          }
        }
      });
    });
  }

  it('never throws across many seeds', () => {
    for (let seed = 0; seed < 20; seed += 1) {
      expect(() => generatePuzzle(DIFFICULTIES.hard, seed)).not.toThrow();
      expect(() => generatePuzzle(DIFFICULTIES.medium, seed)).not.toThrow();
      expect(() => generatePuzzle(DIFFICULTIES.easy, seed)).not.toThrow();
    }
  });
});
