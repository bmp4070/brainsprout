import { describe, expect, it } from 'vitest';
import { generatePuzzle } from './generator';
import { solveRemaining } from './solver';
import { cellsKey } from './shapes';
import { cellKey, DIFFICULTIES } from './types';
import type { Cell, Puzzle } from './types';

const ALL = [DIFFICULTIES.easy, DIFFICULTIES.medium, DIFFICULTIES.hard];
const MIN_PIECES: Record<string, number> = { easy: 3, medium: 4, hard: 5 };

function regionCells(puzzle: Puzzle): Cell[] {
  const cells: Cell[] = [];
  for (let r = 0; r < puzzle.rows; r += 1) {
    for (let c = 0; c < puzzle.cols; c += 1) {
      if (puzzle.region[r][c]) cells.push({ r, c });
    }
  }
  return cells;
}

/** BFS 4-connectivity check over the region cells. */
function isConnected(puzzle: Puzzle): boolean {
  const cells = regionCells(puzzle);
  if (cells.length === 0) return false;
  const inRegion = (r: number, c: number): boolean =>
    r >= 0 && r < puzzle.rows && c >= 0 && c < puzzle.cols && puzzle.region[r][c];
  const seen = new Set<string>([cellKey(cells[0])]);
  const queue: Cell[] = [cells[0]];
  while (queue.length > 0) {
    const cur = queue.pop()!;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = cur.r + dr;
      const nc = cur.c + dc;
      if (inRegion(nr, nc) && !seen.has(`${nr},${nc}`)) {
        seen.add(`${nr},${nc}`);
        queue.push({ r: nr, c: nc });
      }
    }
  }
  return seen.size === cells.length;
}

function assertValid(puzzle: Puzzle, difficultyId: string): void {
  // Region size exact and connected.
  expect(regionCells(puzzle).length).toBe(
    ALL.find((d) => d.id === difficultyId)!.targetCells,
  );
  expect(isConnected(puzzle)).toBe(true);

  // Piece count within bounds.
  const max = ALL.find((d) => d.id === difficultyId)!.maxPieces;
  expect(puzzle.pieces.length).toBeGreaterThanOrEqual(MIN_PIECES[difficultyId]);
  expect(puzzle.pieces.length).toBeLessThanOrEqual(max);

  // Not all pieces identical.
  const shapeKeys = new Set(puzzle.pieces.map((p) => cellsKey(p.cells)));
  expect(shapeKeys.size).toBeGreaterThan(1);

  // colorIndex convention.
  puzzle.pieces.forEach((p, i) => {
    expect(p.id).toBe(i);
    expect(p.colorIndex).toBe(i % 7);
  });

  // Solution uses each piece id exactly once and covers the region exactly.
  const usedIds = puzzle.solution.map((p) => p.pieceId).sort((a, b) => a - b);
  expect(usedIds).toEqual(puzzle.pieces.map((p) => p.id));
  const covered = new Set<string>();
  for (const placement of puzzle.solution) {
    for (const cell of placement.cells) {
      expect(puzzle.region[cell.r][cell.c]).toBe(true);
      expect(covered.has(cellKey(cell))).toBe(false);
      covered.add(cellKey(cell));
    }
  }
  expect(covered.size).toBe(regionCells(puzzle).length);
}

describe('generatePuzzle', () => {
  it('is deterministic per seed', () => {
    for (const difficulty of ALL) {
      const a = generatePuzzle(difficulty, 12345);
      const b = generatePuzzle(difficulty, 12345);
      expect(a).toEqual(b);
    }
  });

  it('produces different puzzles for different seeds', () => {
    const a = generatePuzzle(DIFFICULTIES.medium, 1);
    const b = generatePuzzle(DIFFICULTIES.medium, 2);
    expect(JSON.stringify(a.region)).not.toBe(JSON.stringify(b.region));
  });

  it('is solvable by the exact-cover solver (independent of the recorded solution)', () => {
    for (const difficulty of ALL) {
      const puzzle = generatePuzzle(difficulty, 999);
      const result = solveRemaining(puzzle.region, new Set(), puzzle.pieces);
      expect(result.exact).toBe(true);
      expect(result.solution).not.toBeNull();
    }
  });

  it('never throws and produces valid puzzles for 40 seeds x 3 difficulties', () => {
    const timings: Record<string, number[]> = { easy: [], medium: [], hard: [] };
    for (let seed = 0; seed < 40; seed += 1) {
      for (const difficulty of ALL) {
        const t0 = performance.now();
        const puzzle = generatePuzzle(difficulty, seed);
        timings[difficulty.id].push(performance.now() - t0);
        assertValid(puzzle, difficulty.id);
      }
    }
    for (const id of ['easy', 'medium', 'hard']) {
      const sorted = [...timings[id]].sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length / 2)];
      const max = sorted[sorted.length - 1];
      // eslint-disable-next-line no-console
      console.log(`generate ${id}: p50=${p50.toFixed(2)}ms max=${max.toFixed(2)}ms`);
    }
  });
});
